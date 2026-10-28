/*
 * Minimal ZIP reader built on top of fflate.
 *
 * fflate decodes entry names as UTF-8 unconditionally, which mangles Korean
 * filenames in archives produced by Windows Explorer (those store CP949 and do
 * not set the UTF-8 flag). We therefore read the central directory ourselves,
 * decode names with the correct encoding, and only use fflate for inflate and
 * for writing the output archive.
 */
(function (global) {
  'use strict';

  var SIG_EOCD = 0x06054b50;
  var SIG_CEN = 0x02014b50;
  var SIG_LOC = 0x04034b50;
  var FLAG_UTF8 = 0x0800;
  var FLAG_ENCRYPTED = 0x0001;
  var METHOD_STORE = 0;
  var METHOD_DEFLATE = 8;

  var utf8Strict = new TextDecoder('utf-8', { fatal: true });
  var utf8Loose = new TextDecoder('utf-8');
  var cp949 = null;
  try { cp949 = new TextDecoder('euc-kr'); } catch (e) { cp949 = null; }

  function decodeName(bytes, flags) {
    var name = null;

    if (flags & FLAG_UTF8) {
      name = utf8Loose.decode(bytes);
      // Some tools set the flag but still store CP949. Repair obvious damage.
      if (name.indexOf('\uFFFD') === -1) return name;
    } else {
      try {
        return utf8Strict.decode(bytes);
      } catch (e) { /* not valid UTF-8, fall through */ }
    }

    if (cp949) {
      try {
        var alt = cp949.decode(bytes);
        if (alt.indexOf('\uFFFD') === -1) return alt;
      } catch (e2) { /* ignore */ }
    }

    return name != null ? name : utf8Loose.decode(bytes);
  }

  function findEOCD(view) {
    var len = view.byteLength;
    var min = Math.max(0, len - 65557);
    for (var i = len - 22; i >= min; i--) {
      if (view.getUint32(i, true) === SIG_EOCD) return i;
    }
    return -1;
  }

  function parse(buffer) {
    var view = new DataView(buffer);
    var bytes = new Uint8Array(buffer);

    var eocd = findEOCD(view);
    if (eocd < 0) throw new Error('NOT_ZIP');

    var count = view.getUint16(eocd + 10, true);
    var cdSize = view.getUint32(eocd + 12, true);
    var cdOffset = view.getUint32(eocd + 16, true);

    if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
      throw new Error('ZIP64');
    }

    var entries = [];
    var p = cdOffset;

    for (var i = 0; i < count; i++) {
      if (p + 46 > bytes.length || view.getUint32(p, true) !== SIG_CEN) {
        throw new Error('BAD_CENTRAL_DIR');
      }

      var flags = view.getUint16(p + 8, true);
      var method = view.getUint16(p + 10, true);
      var compSize = view.getUint32(p + 20, true);
      var uncompSize = view.getUint32(p + 24, true);
      var nameLen = view.getUint16(p + 28, true);
      var extraLen = view.getUint16(p + 30, true);
      var commentLen = view.getUint16(p + 32, true);
      var localOffset = view.getUint32(p + 42, true);

      if (flags & FLAG_ENCRYPTED) throw new Error('ENCRYPTED');
      if (method !== METHOD_STORE && method !== METHOD_DEFLATE) throw new Error('METHOD');

      var nameBytes = bytes.subarray(p + 46, p + 46 + nameLen);
      // Some tools (notably .NET's Compress-Archive) write backslash separators,
      // which is not what the ZIP spec says. Normalise so paths stay valid.
      var name = decodeName(nameBytes, flags).replace(/\\/g, '/');
      p += 46 + nameLen + extraLen + commentLen;

      if (!name || name.charAt(name.length - 1) === '/') continue; // directory
      if (name.indexOf('__MACOSX/') === 0) continue;

      var base = name.slice(name.lastIndexOf('/') + 1);
      if (base === '.DS_Store' || base === 'Thumbs.db' || base === 'desktop.ini') continue;

      if (view.getUint32(localOffset, true) !== SIG_LOC) throw new Error('BAD_LOCAL_HEADER');
      var localNameLen = view.getUint16(localOffset + 26, true);
      var localExtraLen = view.getUint16(localOffset + 28, true);
      var dataStart = localOffset + 30 + localNameLen + localExtraLen;

      entries.push({
        name: name,
        dir: name.slice(0, name.lastIndexOf('/') + 1),
        base: base,
        method: method,
        compSize: compSize,
        uncompSize: uncompSize,
        data: bytes.subarray(dataStart, dataStart + compSize)
      });
    }

    return entries;
  }

  function extract(entry) {
    if (entry.method === METHOD_STORE) return entry.data;
    try {
      return global.fflate.inflateSync(entry.data);
    } catch (e) {
      throw new Error('METHOD');
    }
  }

  /**
   * files: [{ path, bytes }]
   * Uses the streaming writer rather than zipSync so the entry order is exactly
   * the order of the preview list (zipSync takes an object, and integer-like
   * keys get reordered by the JS engine).
   */
  function create(files) {
    var chunks = [];
    var total = 0;

    var zip = new global.fflate.Zip(function (err, chunk) {
      if (err) throw err;
      if (chunk && chunk.length) {
        chunks.push(chunk);
        total += chunk.length;
      }
    });

    for (var i = 0; i < files.length; i++) {
      var entry = new global.fflate.ZipDeflate(files[i].path, { level: 6 });
      zip.add(entry);
      entry.push(files[i].bytes, true);
    }
    zip.end();

    var out = new Uint8Array(total);
    var offset = 0;
    for (var j = 0; j < chunks.length; j++) {
      out.set(chunks[j], offset);
      offset += chunks[j].length;
    }
    return out;
  }

  global.ZipUtil = { parse: parse, extract: extract, create: create, decodeName: decodeName };
})(window);
