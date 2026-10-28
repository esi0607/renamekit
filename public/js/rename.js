/*
 * Rename rule engine. Pure functions, no DOM.
 * Rules are applied to the filename stem only; the extension is handled
 * exclusively by the "extension" rule so that a find/replace never
 * accidentally breaks a file's type.
 */
(function (global) {
  'use strict';

  var INVALID_CHARS = /[\\/:*?"<>|]/;
  var RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  var MAX_LEN = 255;

  function splitExt(name) {
    var i = name.lastIndexOf('.');
    if (i <= 0) return [name, ''];
    return [name.slice(0, i), name.slice(i)];
  }

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function toNumber(value, fallback) {
    if (value === '' || value == null) return fallback;
    var n = Number(value);
    return isFinite(n) ? n : fallback;
  }

  function sanitizeStem(str, spaceChar, keepKorean) {
    var sc = spaceChar == null || spaceChar === '' ? '_' : spaceChar;
    var out = str.replace(/\s+/g, sc);
    out = keepKorean
      ? out.replace(/[^\p{L}\p{N}\-_.]/gu, '')
      : out.replace(/[^A-Za-z0-9\-_.]/g, '');
    var scRe = escapeRe(sc);
    out = out.replace(new RegExp(scRe + '{2,}', 'g'), sc);
    out = out.replace(new RegExp('^' + scRe + '+|' + scRe + '+$', 'g'), '');
    return out;
  }

  function normalizeDate(stem, mode) {
    return stem.replace(/(\d{4})[-_.]?(\d{2})[-_.]?(\d{2})/g, function (match, y, mo, d) {
      var m = Number(mo), dd = Number(d);
      if (m < 1 || m > 12 || dd < 1 || dd > 31) return match;
      if (mode === 'plain') return y + mo + d;
      if (mode === 'short') return y.slice(2) + mo + d;
      return y + '-' + mo + '-' + d;
    });
  }

  function applyRule(stem, ext, rule, ctx) {
    var p = rule.params || {};

    switch (rule.type) {
      case 'addPrefix':
        if (p.text) stem = p.text + stem;
        return [stem, ext];

      case 'removePrefix':
        if (p.text && stem.indexOf(p.text) === 0) stem = stem.slice(p.text.length);
        return [stem, ext];

      case 'removeChars': {
        var count = Math.floor(toNumber(p.count, 0));
        if (count > 0) {
          stem = p.mode === 'back'
            ? stem.slice(0, Math.max(stem.length - count, 0))
            : stem.slice(count);
        }
        return [stem, ext];
      }

      case 'addSuffix':
        if (p.text) stem = stem + p.text;
        return [stem, ext];

      case 'removeSuffix':
        if (p.text && stem.length >= p.text.length && stem.slice(-p.text.length) === p.text) {
          stem = stem.slice(0, stem.length - p.text.length);
        }
        return [stem, ext];

      case 'replace': {
        if (!p.find) return [stem, ext];
        var replacement = p.replace == null ? '' : p.replace;
        var caseSensitive = p.caseSensitive !== false;
        if (p.regex) {
          try {
            stem = stem.replace(new RegExp(p.find, caseSensitive ? 'g' : 'gi'), replacement);
          } catch (e) { /* invalid pattern: leave untouched */ }
        } else if (caseSensitive) {
          stem = stem.split(p.find).join(replacement);
        } else {
          stem = stem.replace(new RegExp(escapeRe(p.find), 'gi'), function () { return replacement; });
        }
        return [stem, ext];
      }

      case 'sequence': {
        var sep = p.separator == null ? '_' : p.separator;
        var start = toNumber(p.start, 1);
        var step = toNumber(p.step, 1);
        var width = Math.floor(toNumber(p.pad, 0));

        if (width <= 0) {
          var last = start + step * Math.max(ctx.total - 1, 0);
          width = String(Math.abs(last)).length;
        }

        var num = String(start + step * ctx.index);
        while (num.length < width) num = '0' + num;

        if (p.mode === 'prefix') stem = num + sep + stem;
        else if (p.mode === 'replace') stem = (p.text ? p.text + sep : '') + num;
        else stem = stem + sep + num;

        return [stem, ext];
      }

      case 'date':
        return [normalizeDate(stem, p.mode), ext];

      case 'sanitize':
        return [sanitizeStem(stem, p.spaceChar, p.keepKorean !== false), ext];

      case 'case':
        return p.mode === 'upper'
          ? [stem.toUpperCase(), ext.toUpperCase()]
          : [stem.toLowerCase(), ext.toLowerCase()];

      case 'truncate': {
        var max = Math.floor(toNumber(p.max, 0));
        if (max > 0) stem = stem.slice(0, max);
        return [stem, ext];
      }

      case 'extension': {
        var v = String(p.value == null ? '' : p.value).trim();
        if (v && v.charAt(0) !== '.') v = '.' + v;
        return [stem, v];
      }

      default:
        return [stem, ext];
    }
  }

  function applyRules(base, rules, index, total) {
    var parts = splitExt(base);
    var stem = parts[0];
    var ext = parts[1];

    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (rule.enabled === false) continue;
      var out = applyRule(stem, ext, rule, { index: index, total: total });
      stem = out[0];
      ext = out[1];
    }

    // Windows refuses trailing dots and spaces.
    stem = stem.replace(/[. ]+$/, '');

    return stem + ext;
  }

  function validate(name) {
    var issues = [];
    if (!name || name === '.' || name === '..') issues.push('empty');
    if (INVALID_CHARS.test(name)) issues.push('invalid');
    var stem = splitExt(name)[0];
    if (RESERVED.test(stem)) issues.push('reserved');
    if (/[.]$/.test(name)) issues.push('trailing');
    if (name.length > MAX_LEN) issues.push('long');
    return issues;
  }

  /**
   * Build a rename plan for a list of files: [{ path, base, dir }]
   * Returns [{ index, file, newBase, newPath, issues, status }]
   */
  function buildPlan(files, rules) {
    var total = files.length;
    var plan = files.map(function (file, i) {
      var newBase = applyRules(file.base, rules, i, total);
      var issues = validate(newBase);
      return {
        index: i,
        file: file,
        newBase: newBase,
        newPath: (file.dir || '') + newBase,
        issues: issues,
        status: issues.length ? 'error' : 'ok',
        conflict: false
      };
    });

    // Detect duplicate destinations (case-insensitive: Windows and macOS).
    var seen = Object.create(null);
    for (var i = 0; i < plan.length; i++) {
      var key = plan[i].newPath.toLowerCase();
      if (seen[key] === undefined) {
        seen[key] = i;
      } else {
        plan[i].conflict = true;
        plan[seen[key]].conflict = true;
      }
    }

    for (var j = 0; j < plan.length; j++) {
      if (plan[j].conflict) plan[j].status = 'error';
    }

    return plan;
  }

  var RULE_FIELDS = {
    addPrefix: [{ key: 'text', type: 'text', def: '' }],
    removePrefix: [{ key: 'text', type: 'text', def: '' }],
    removeChars: [
      { key: 'mode', type: 'select', options: ['front', 'back'], def: 'front' },
      { key: 'count', type: 'number', def: 2 }
    ],
    addSuffix: [{ key: 'text', type: 'text', def: '' }],
    removeSuffix: [{ key: 'text', type: 'text', def: '' }],
    replace: [
      { key: 'find', type: 'text', def: '' },
      { key: 'replace', type: 'text', def: '' },
      { key: 'regex', type: 'check', def: false },
      { key: 'caseSensitive', type: 'check', def: true }
    ],
    sequence: [
      { key: 'mode', type: 'select', options: ['suffix', 'prefix', 'replace'], def: 'suffix' },
      { key: 'text', type: 'text', def: '' },
      { key: 'start', type: 'number', def: 1 },
      { key: 'step', type: 'number', def: 1 },
      { key: 'pad', type: 'number', def: 0 },
      { key: 'separator', type: 'text', def: '_' }
    ],
    date: [{ key: 'mode', type: 'select', options: ['dash', 'plain', 'short'], def: 'dash' }],
    sanitize: [
      { key: 'spaceChar', type: 'text', def: '_' },
      { key: 'keepKorean', type: 'check', def: true }
    ],
    case: [{ key: 'mode', type: 'select', options: ['lower', 'upper'], def: 'lower' }],
    extension: [{ key: 'value', type: 'text', def: 'jpg' }],
    truncate: [{ key: 'max', type: 'number', def: 60 }]
  };

  var RULE_ORDER = [
    'addPrefix', 'removePrefix', 'removeChars', 'addSuffix', 'removeSuffix',
    'replace', 'sequence', 'date', 'sanitize', 'case', 'extension', 'truncate'
  ];

  function defaultsFor(type) {
    var fields = RULE_FIELDS[type] || [];
    var params = {};
    for (var i = 0; i < fields.length; i++) params[fields[i].key] = fields[i].def;
    return params;
  }

  var PRESETS = [
    {
      id: 'sequence',
      rules: [{ type: 'sequence', params: { mode: 'replace', text: 'photo', start: 1, step: 1, pad: 3, separator: '_' } }]
    },
    {
      id: 'stripPrefix',
      rules: [{ type: 'removePrefix', params: { text: 'Screenshot_' } }]
    },
    {
      id: 'replaceWord',
      rules: [{ type: 'replace', params: { find: '\uCD5C\uC885', replace: 'final', regex: false, caseSensitive: true } }]
    },
    {
      id: 'sanitize',
      rules: [{ type: 'sanitize', params: { spaceChar: '_', keepKorean: true } }]
    },
    {
      id: 'ext',
      rules: [{ type: 'extension', params: { value: 'jpg' } }]
    },
    {
      id: 'lower',
      rules: [{ type: 'case', params: { mode: 'lower' } }]
    },
    {
      id: 'date',
      rules: [{ type: 'date', params: { mode: 'dash' } }]
    },
    {
      id: 'suffixNum',
      rules: [{ type: 'sequence', params: { mode: 'suffix', text: '', start: 1, step: 1, pad: 2, separator: '_' } }]
    }
  ];

  /**
   * Natural sort: "2" before "10", the way Explorer and Bandizip list files.
   * Compares path segments so files inside the same folder stay together.
   */
  var collator = null;
  try {
    if (typeof Intl !== 'undefined' && Intl.Collator) {
      collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    }
  } catch (e) { collator = null; }

  function naturalCompare(a, b) {
    var as = String(a).split('/');
    var bs = String(b).split('/');
    var n = Math.min(as.length, bs.length);
    for (var i = 0; i < n; i++) {
      var c = collator
        ? collator.compare(as[i], bs[i])
        : (as[i] < bs[i] ? -1 : as[i] > bs[i] ? 1 : 0);
      if (c) return c;
    }
    return as.length - bs.length;
  }

  global.RenameEngine = {
    applyRules: applyRules,
    buildPlan: buildPlan,
    validate: validate,
    splitExt: splitExt,
    naturalCompare: naturalCompare,
    RULE_FIELDS: RULE_FIELDS,
    RULE_ORDER: RULE_ORDER,
    defaultsFor: defaultsFor,
    PRESETS: PRESETS
  };
})(window);
