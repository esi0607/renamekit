(function () {
  'use strict';

  var t = window.I18N.t;
  var Engine = window.RenameEngine;
  var ZipUtil = window.ZipUtil;

  var MAX_PREVIEW_ROWS = 200;
  var LARGE_BYTES = 500 * 1024 * 1024;

  var state = {
    files: [],       // archive order; use sortedFiles() for display
    rules: [],
    sort: 'natural',
    sourceName: 'files.zip',
    error: null
  };

  var el = {};

  /* ---------------------------------------------------------------- utils */

  function formatSize(bytes) {
    if (!bytes) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB'];
    var i = 0;
    var n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return (i === 0 ? n : n.toFixed(n >= 100 ? 0 : 1)) + ' ' + units[i];
  }

  function totalSize() {
    return state.files.reduce(function (sum, f) { return sum + (f.size || 0); }, 0);
  }

  function baseNameOf(path) {
    var name = path.split(/[\\/]/).pop() || '';
    return name.replace(/\.[^.]+$/, '') || 'files';
  }

  function isZipName(name) {
    return /\.zip$/i.test(name);
  }

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /* ---------------------------------------------------------- file input */

  function handleFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;

    var zips = files.filter(function (f) { return isZipName(f.name); });
    var loose = files.filter(function (f) { return !isZipName(f.name); });

    var jobs = zips.map(function (f) {
      return f.arrayBuffer().then(function (buf) {
        return ZipUtil.parse(buf);
      });
    });

    Promise.all(jobs)
      .then(function (groups) {
        var entries = [];
        groups.forEach(function (group) {
          group.forEach(function (e) { entries.push(e); });
        });

        var mapped = entries.map(function (e) {
          return {
            path: e.name,
            dir: e.dir,
            base: e.base,
            size: e.uncompSize,
            entry: e
          };
        });

        loose.forEach(function (f) {
          mapped.push({
            path: f.name,
            dir: '',
            base: f.name,
            size: f.size,
            file: f
          });
        });

        if (!mapped.length) {
          setError(zips.length ? 'error.emptyzip' : 'error.nofiles');
          return;
        }

        // Remember the archive order so the "Archive" sort option is available.
        // Explorer and Bandizip list files naturally (2 before 10) while zips
        // often store entries lexicographically, so the default view sorts.
        mapped.forEach(function (f, i) { f.orig = i; });

        state.files = mapped;
        state.error = null;
        state.sourceName = zips.length === 1
          ? zips[0].name
          : (zips.length ? 'merged.zip' : 'files.zip');

        renderAll();
      })
      .catch(function (err) {
        var code = err && err.message;
        var map = {
          NOT_ZIP: 'error.notzip',
          ZIP64: 'error.zip64',
          ENCRYPTED: 'error.encrypted',
          METHOD: 'error.method',
          BAD_CENTRAL_DIR: 'error.notzip',
          BAD_LOCAL_HEADER: 'error.notzip'
        };
        setError(map[code] || 'error.read');
      });
  }

  function setError(key) {
    state.error = key;
    state.files = [];
    renderAll();
  }

  function resetAll() {
    state.files = [];
    state.rules = [];
    state.error = null;
    state.sourceName = 'files.zip';
    if (el.fileInput) el.fileInput.value = '';
    renderAll();
  }

  /* ------------------------------------------------------------- presets */

  function renderPresets() {
    el.presets.innerHTML = '';
    Engine.PRESETS.forEach(function (preset) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset';
      btn.textContent = t('preset.' + preset.id);
      btn.addEventListener('click', function () {
        state.rules = deepCopy(preset.rules);
        renderRules();
        renderPreview();
      });
      el.presets.appendChild(btn);
    });
  }

  /* --------------------------------------------------------------- rules */

  function makeRule(type) {
    return { type: type, params: Engine.defaultsFor(type), enabled: true };
  }

  function fieldLabel(key) {
    return t('field.' + key);
  }

  function renderRules() {
    el.rules.innerHTML = '';

    if (!state.rules.length) {
      var empty = document.createElement('div');
      empty.className = 'rules-empty';
      empty.textContent = t('rules.empty');
      el.rules.appendChild(empty);
      return;
    }

    state.rules.forEach(function (rule, index) {
      el.rules.appendChild(renderRuleRow(rule, index));
    });
  }

  function renderRuleRow(rule, index) {
    var row = document.createElement('div');
    row.className = 'rule';

    var order = document.createElement('span');
    order.className = 'rule-order';
    order.textContent = String(index + 1);
    row.appendChild(order);

    var typeSelect = document.createElement('select');
    typeSelect.className = 'rule-type';
    typeSelect.setAttribute('aria-label', t('rule.typeLabel'));
    Engine.RULE_ORDER.forEach(function (type) {
      var opt = document.createElement('option');
      opt.value = type;
      opt.textContent = t('rule.' + type);
      typeSelect.appendChild(opt);
    });
    typeSelect.value = rule.type;
    typeSelect.addEventListener('change', function () {
      var next = makeRule(typeSelect.value);
      next.enabled = rule.enabled;
      state.rules[index] = next;
      renderRules();
      renderPreview();
    });
    row.appendChild(typeSelect);

    var fields = Engine.RULE_FIELDS[rule.type] || [];
    fields.forEach(function (field) {
      // The "replacement label" only matters when the whole name is replaced.
      if (rule.type === 'sequence' && field.key === 'text' && rule.params.mode !== 'replace') return;

      if (field.type === 'check') {
        var wrap = document.createElement('label');
        wrap.className = 'rule-check';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = rule.params[field.key] !== false;
        if (field.def === true) cb.checked = rule.params[field.key] !== false;
        if (field.def === false) cb.checked = rule.params[field.key] === true;
        cb.addEventListener('change', function () {
          rule.params[field.key] = cb.checked;
          renderPreview();
        });
        wrap.appendChild(cb);
        wrap.appendChild(document.createTextNode(fieldLabel(field.key)));
        row.appendChild(wrap);
        return;
      }

      var box = document.createElement('label');
      box.className = 'rule-field';
      box.appendChild(document.createTextNode(fieldLabel(field.key)));

      var input;
      if (field.type === 'select') {
        input = document.createElement('select');
        field.options.forEach(function (value) {
          var opt = document.createElement('option');
          opt.value = value;
          opt.textContent = t('opt.' + value);
          input.appendChild(opt);
        });
        input.value = rule.params[field.key];
      } else {
        input = document.createElement('input');
        input.type = field.type === 'number' ? 'number' : 'text';
        input.value = rule.params[field.key] != null ? rule.params[field.key] : '';
      }

      input.addEventListener('input', function () {
        rule.params[field.key] = field.type === 'number'
          ? input.value
          : input.value;
        if (field.type === 'select' || (rule.type === 'sequence' && field.key === 'mode')) {
          renderRules();
        }
        renderPreview();
      });

      box.appendChild(input);
      row.appendChild(box);
    });

    var spacer = document.createElement('span');
    spacer.className = 'rule-spacer';
    row.appendChild(spacer);

    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'rule-remove';
    remove.setAttribute('aria-label', 'remove rule');
    remove.textContent = '\u00D7';
    remove.addEventListener('click', function () {
      state.rules.splice(index, 1);
      renderRules();
      renderPreview();
    });
    row.appendChild(remove);

    return row;
  }

  /* ------------------------------------------------------------- preview */

  function currentPlan() {
    return Engine.buildPlan(sortedFiles(), state.rules);
  }

  /**
   * Files in display order. The order matters: the numbering rule uses the
   * index, so "natural" and "archive" produce different numbers.
   */
  function sortedFiles() {
    var arr = state.files.slice();
    if (state.sort === 'original') {
      arr.sort(function (a, b) { return a.orig - b.orig; });
    } else {
      arr.sort(function (a, b) { return Engine.naturalCompare(a.path, b.path); });
    }
    return arr;
  }

  function statusChip(status) {
    var chip = document.createElement('span');
    chip.className = 'chip ' + (status === 'ok' ? 'ok' : status === 'warn' ? 'warn' : 'error');
    chip.textContent = t('status.' + (status === 'ok' ? 'ok' : status === 'warn' ? 'warn' : 'error'));
    return chip;
  }

  function renderPreview() {
    el.preview.innerHTML = '';
    el.previewCount.textContent = '';
    el.summary.hidden = true;
    el.summary.className = 'summary';

    if (!state.files.length) {
      var p = document.createElement('p');
      p.className = 'empty';
      p.textContent = state.error ? t(state.error) : t('preview.empty');
      el.preview.appendChild(p);
      if (state.error) el.preview.classList.add('has-error');
      el.downloadBtn.disabled = true;
      el.sortToggle.hidden = true;
      return;
    }
    el.preview.classList.remove('has-error');
    el.sortToggle.hidden = state.files.length < 2;

    var plan = currentPlan();
    var shown = plan.slice(0, MAX_PREVIEW_ROWS);

    var table = document.createElement('table');
    table.className = 'names';

    var thead = document.createElement('thead');
    var headRow = document.createElement('tr');
    [t('table.no'), t('table.before'), t('table.after'), t('table.status')].forEach(function (label, i) {
      var th = document.createElement('th');
      th.textContent = label;
      if (i === 0) th.style.width = '40px';
      if (i === 3) th.style.width = '72px';
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    shown.forEach(function (item) {
      var tr = document.createElement('tr');
      if (item.status === 'error') tr.className = 'row-error';
      else if (item.status === 'warn') tr.className = 'row-warn';

      var tdNum = document.createElement('td');
      tdNum.className = 'num';
      tdNum.textContent = String(item.index + 1);
      tr.appendChild(tdNum);

      var tdOld = document.createElement('td');
      if (item.file.dir) {
        var dirSpan = document.createElement('span');
        dirSpan.className = 'fdir';
        dirSpan.textContent = item.file.dir;
        tdOld.appendChild(dirSpan);
      }
      var oldSpan = document.createElement('span');
      oldSpan.className = 'fname old';
      oldSpan.textContent = item.file.base;
      tdOld.appendChild(oldSpan);
      tr.appendChild(tdOld);

      var tdNew = document.createElement('td');
      if (item.file.dir) {
        var dirSpan2 = document.createElement('span');
        dirSpan2.className = 'fdir';
        dirSpan2.textContent = item.file.dir;
        tdNew.appendChild(dirSpan2);
      }
      var newSpan = document.createElement('span');
      newSpan.className = 'fname new';
      newSpan.textContent = item.newBase;
      tdNew.appendChild(newSpan);
      tr.appendChild(tdNew);

      var tdStatus = document.createElement('td');
      tdStatus.appendChild(statusChip(item.status));
      tr.appendChild(tdStatus);

      tbody.appendChild(tr);
    });

    if (plan.length > shown.length) {
      var moreTr = document.createElement('tr');
      moreTr.className = 'more-row';
      var moreTd = document.createElement('td');
      moreTd.colSpan = 4;
      moreTd.textContent = t('preview.more', { n: plan.length - shown.length });
      moreTr.appendChild(moreTd);
      tbody.appendChild(moreTr);
    }

    table.appendChild(tbody);
    el.preview.appendChild(table);

    el.previewCount.textContent = t('preview.count', {
      n: plan.length,
      m: Math.min(plan.length, shown.length)
    });

    renderSummary(plan);
  }

  function renderSummary(plan) {
    el.summary.replaceChildren();
    var errors = [];
    var warnings = [];

    var conflicts = Object.create(null);
    plan.forEach(function (item) {
      if (item.conflict) conflicts[item.newPath] = true;
      if (item.issues.indexOf('empty') !== -1 && errors.indexOf('empty') === -1) errors.push('empty');
      if (item.issues.indexOf('invalid') !== -1) {
        var msg = { key: 'invalid', name: item.newBase };
        if (!errors.some(function (e) { return e.key === 'invalid' && e.name === msg.name; })) errors.push(msg);
      }
      if (item.issues.indexOf('reserved') !== -1) {
        var rmsg = { key: 'reserved', name: item.newBase };
        if (!errors.some(function (e) { return e.key === 'reserved' && e.name === rmsg.name; })) errors.push(rmsg);
      }
      if (item.issues.indexOf('trailing') !== -1) {
        var tmsg = { key: 'trailing', name: item.newBase };
        if (!errors.some(function (e) { return e.key === 'trailing' && e.name === tmsg.name; })) errors.push(tmsg);
      }
      if (item.issues.indexOf('long') !== -1) {
        var lmsg = { key: 'long', name: item.newBase };
        if (!errors.some(function (e) { return e.key === 'long' && e.name === lmsg.name; })) errors.push(lmsg);
      }
    });

    Object.keys(conflicts).slice(0, 5).forEach(function (path) {
      errors.push({ key: 'conflict', name: path });
    });

    var unchanged = plan.filter(function (item) { return item.newBase === item.file.base; }).length;
    if (unchanged === plan.length && plan.length > 0) {
      warnings.push({ key: 'nochange', n: unchanged });
    }

    var size = totalSize();
    if (size > LARGE_BYTES) warnings.push({ key: 'size', size: formatSize(size) });

    var hasErrors = errors.length > 0;
    el.summary.hidden = false;

    if (!hasErrors && !warnings.length) {
      el.summary.className = 'summary ok';
      el.summary.textContent = t('summary.ok', { n: plan.length });
    } else {
      el.summary.className = 'summary ' + (hasErrors ? 'error' : 'warn');
      var head = document.createElement('strong');
      head.textContent = t('summary.head');
      el.summary.appendChild(head);

      var ul = document.createElement('ul');
      errors.concat(warnings).forEach(function (item) {
        var li = document.createElement('li');
        if (item.key === 'empty') li.textContent = t('summary.err.empty');
        else if (item.key === 'size') li.textContent = t('summary.warn.size', { size: item.size });
        else if (item.key === 'nochange') li.textContent = t('summary.warn.nochange', { n: item.n });
        else if (item.key === 'conflict') li.textContent = t('summary.conflict', { name: item.name });
        else li.textContent = t('summary.err.' + item.key, { name: item.name });
        ul.appendChild(li);
      });
      el.summary.appendChild(ul);
    }

    el.downloadBtn.disabled = hasErrors;
  }

  /* ------------------------------------------------------------ download */

  function readEntry(entry) {
    return Promise.resolve().then(function () {
      return ZipUtil.extract(entry);
    });
  }

  function readLoose(file) {
    return file.arrayBuffer().then(function (buf) {
      return new Uint8Array(buf);
    });
  }

  function download() {
    var plan = currentPlan();
    if (!plan.length) return;

    el.downloadBtn.disabled = true;
    var label = el.downloadBtn.querySelector('span');
    var original = label.textContent;
    label.textContent = t('btn.downloading');

    var jobs = plan.map(function (item) {
      var bytes = item.file.entry ? readEntry(item.file.entry) : readLoose(item.file.file);
      return bytes.then(function (data) {
        return { path: item.newPath, bytes: data };
      });
    });

    Promise.all(jobs)
      .then(function (files) {
        var zipBytes = ZipUtil.create(files);
        var blob = new Blob([zipBytes], { type: 'application/zip' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = baseNameOf(state.sourceName) + '-renamed.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      })
      .catch(function () {
        setError('error.download');
      })
      .then(function () {
        label.textContent = original;
        el.downloadBtn.disabled = false;
        renderPreview();
      });
  }

  /* -------------------------------------------------------------- render */

  function renderFileBar() {
    if (!state.files.length) {
      el.filebar.hidden = true;
      el.dropzone.classList.remove('is-compact');
      return;
    }
    el.filebar.hidden = false;
    el.dropzone.classList.add('is-compact');
    el.fileName.textContent = state.sourceName;
    el.fileMeta.textContent = t(state.files.length === 1 ? 'file.metaOne' : 'file.meta', {
      n: state.files.length,
      size: formatSize(totalSize())
    });
  }

  function renderAll() {
    renderFileBar();
    renderPresets();
    renderRules();
    renderPreview();
  }

  function cacheElements() {
    ['dropzone', 'fileInput', 'browseBtn', 'filebar', 'fileName', 'fileMeta',
      'changeBtn', 'resetBtn', 'presets', 'rules', 'addRuleBtn', 'clearRulesBtn',
      'preview', 'previewCount', 'summary', 'downloadBtn', 'sortToggle'].forEach(function (id) {
      el[id] = document.getElementById(id);
    });
  }

  function bindEvents() {
    el.browseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      el.fileInput.click();
    });

    el.dropzone.addEventListener('click', function () {
      el.fileInput.click();
    });

    el.dropzone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.fileInput.click();
      }
    });

    el.fileInput.addEventListener('change', function () {
      handleFiles(el.fileInput.files);
    });

    ['dragenter', 'dragover'].forEach(function (type) {
      el.dropzone.addEventListener(type, function (e) {
        e.preventDefault();
        el.dropzone.classList.add('is-drag');
      });
    });

    ['dragleave', 'drop'].forEach(function (type) {
      el.dropzone.addEventListener(type, function (e) {
        e.preventDefault();
        el.dropzone.classList.remove('is-drag');
      });
    });

    el.dropzone.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    });

    // Dropping anywhere on the page should not navigate away.
    window.addEventListener('dragover', function (e) { e.preventDefault(); });
    window.addEventListener('drop', function (e) { e.preventDefault(); });

    el.changeBtn.addEventListener('click', function () { el.fileInput.click(); });
    el.resetBtn.addEventListener('click', resetAll);

    el.addRuleBtn.addEventListener('click', function () {
      state.rules.push(makeRule('addPrefix'));
      renderRules();
      renderPreview();
    });

    el.clearRulesBtn.addEventListener('click', function () {
      state.rules = [];
      renderRules();
      renderPreview();
    });

    el.downloadBtn.addEventListener('click', download);

    el.sortToggle.querySelectorAll('.seg-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.sort = btn.getAttribute('data-sort');
        el.sortToggle.querySelectorAll('.seg-btn').forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        renderPreview();
      });
    });

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.I18N.setLang(btn.getAttribute('data-lang'));
      });
    });

    document.addEventListener('langchange', function () {
      renderPresets();
      renderRules();
      renderFileBar();
      renderPreview();
    });
  }

  function init() {
    cacheElements();
    bindEvents();
    window.I18N.setLang(window.I18N.initialLang());
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
