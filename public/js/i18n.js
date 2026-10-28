(function (global) {
  'use strict';

  var DICT = {
    ko: {
      'html.title': '파일명 일괄 변경 - 설치 없이 브라우저에서 | RenameKit',
      'header.badge': '서버 전송 없음',
      'hero.title': '파일명 일괄 변경',
      'hero.sub': 'zip 파일이나 파일들을 끌어다 놓고 규칙을 고르면, 이름을 한 번에 바꿔서 돌려드립니다. 설치 없이 브라우저에서만 동작합니다.',

      'drop.title': 'zip 파일을 여기로 끌어다 놓으세요',
      'drop.sub': 'zip 안의 파일을 이름만 바꿔서 새 zip으로 돌려드립니다. zip이 없으면 파일을 그대로 끌어다 놔도 됩니다.',
      'drop.browse': '파일 선택',
      'drop.hint': '파일은 브라우저 밖으로 나가지 않습니다.',

      'file.change': '다른 파일',
      'file.reset': '초기화',
      'file.meta': '{n}개 파일 · {size}',
      'file.metaOne': '{n}개 파일 · {size}',

      'presets.title': '빠른 시작',
      'presets.hint': '버튼을 누르면 아래 규칙이 그 프리셋으로 바뀝니다. 그대로 쓰거나 값을 고쳐서 쓰세요.',

      'rules.title': '규칙',
      'rules.add': '+ 규칙 추가',
      'rules.clear': '전체 지우기',
      'rules.hint': "규칙은 위에서부터 차례대로 적용됩니다. 파일 종류 자체를 바꾸려면 '확장자 변경' 규칙을 추가하세요.",
      'rules.empty': '아직 규칙이 없습니다. 위의 빠른 시작을 누르거나 규칙을 추가해 보세요.',

      'preview.title': '미리보기',
      'preview.empty': '파일을 넣으면 여기에 변경 결과가 표시됩니다.',
      'sort.natural': '자연순',
      'sort.original': '원본순',
      'preview.count': '{n}개 중 {m}개 표시',
      'preview.more': '나머지 {n}개는 표시하지 않습니다',

      'table.no': '#',
      'table.before': '변경 전',
      'table.after': '변경 후',
      'table.status': '상태',
      'status.ok': '정상',
      'status.warn': '확인',
      'status.error': '문제',

      'btn.download': '이름 바꾼 zip 다운로드',
      'btn.downloading': '처리 중…',
      'btn.downloadHint': '원본 파일은 그대로 남습니다. 사본이 담긴 새 zip을 받습니다.',

      'summary.ok': '문제 없습니다. {n}개 파일을 내려받을 수 있습니다.',
      'summary.head': '진행하기 전에 확인하세요:',
      'summary.conflict': '같은 이름이 됩니다: {name}',
      'summary.err.empty': '이름이 비어 있는 파일이 있습니다 (규칙을 확인하세요)',
      'summary.err.invalid': '윈도우에서 쓸 수 없는 문자가 들어 있습니다: {name}',
      'summary.err.reserved': '윈도우 예약어라 저장할 수 없습니다: {name}',
      'summary.err.trailing': '이름 끝에 점(.)이나 공백이 있습니다: {name}',
      'summary.err.long': '이름이 너무 깁니다(255자 초과): {name}',
      'summary.warn.size': '전체 용량이 커서(약 {size}) 브라우저가 버티지 못할 수 있습니다. 500MB 이하를 권장합니다.',
      'summary.warn.nochange': '{n}개 파일은 이름이 그대로입니다. 규칙이 실제로 적용되는지 확인해 보세요.',

      'ad.label': '광고 영역',

      'howto.title': '사용 방법',
      'howto.s1t': '1. 파일 넣기',
      'howto.s1d': 'zip 파일을 통째로 끌어다 놓거나, 이름을 바꾸고 싶은 파일들을 선택하세요.',
      'howto.s2t': '2. 규칙 정하기',
      'howto.s2d': '프리셋을 누르거나 규칙을 직접 추가하세요. 결과는 아래 표에서 바로 확인됩니다.',
      'howto.s3t': '3. 내려받기',
      'howto.s3d': '이름이 바뀐 파일이 담긴 새 zip을 받습니다. 원본은 손대지 않습니다.',

      'why.title': '이런 때 씁니다',
      'why.b1': '휴대폰 사진이 IMG_2847.jpg 처럼 뒤죽박죽일 때 날짜·순번 순서로 정리',
      'why.b2': '카카오톡·캡처 파일 앞에 붙은 Screenshot_, KakaoTalk_ 접두어 제거',
      'why.b3': "납품 전에 '최종', '복사본', 공백 같은 군더더기 정리",
      'why.b4': '웹에 올리기 전에 한글·공백·특수문자를 안전한 문자로 통일',
      'why.b5': '확장자가 .jpeg / .JPEG / .jpg 로 섞여 있을 때 하나로 통일',

      'faq.title': '자주 묻는 질문',
      'faq.q1': '파일이 서버로 올라가나요?',
      'faq.a1': '아니요. 압축 해제와 이름 변경, 다시 압축하기까지 전부 브라우저 안에서 처리됩니다. 네트워크 전송이 없습니다.',
      'faq.q2': '한글 파일명이 깨지지 않나요?',
      'faq.a2': '윈도우에서 만든 zip은 파일명을 CP949로 저장하는 경우가 있습니다. 이 도구는 UTF-8 표시가 없으면 CP949로 다시 읽어서 한글이 깨지지 않게 처리합니다.',
      'faq.q3': '폴더 구조는 유지되나요?',
      'faq.a3': '네. zip 안의 폴더 구조는 그대로 두고 파일 이름만 바꿉니다.',
      'faq.q4': '얼마나 큰 파일까지 되나요?',
      'faq.a4': '브라우저 메모리를 쓰기 때문에 대략 500MB 이하를 권장합니다. 그보다 크면 느려지거나 실패할 수 있습니다.',

      'footer.note': '모든 처리는 브라우저에서 이루어집니다.',

      'nav.tool': '도구',
      'nav.guide': '사용법',
      'nav.faq': '자주 묻는 질문',
      'nav.about': '소개',
      'nav.privacy': '개인정보처리방침',
      'content.moreGuide': '규칙 12가지와 실전 예시는 사용법 문서에서 자세히 볼 수 있습니다 →',
      'content.moreFaq': '질문 15개 전체 보기 →',

      'error.read': '파일을 읽지 못했습니다.',
      'error.notzip': 'zip 파일이 아닙니다. zip 파일을 넣거나, 파일을 여러 개 선택해 주세요.',
      'error.zip64': 'ZIP64 형식(4GB 이상)은 아직 지원하지 않습니다.',
      'error.encrypted': '암호가 걸린 zip은 열 수 없습니다. 압축을 푼 뒤 다시 시도해 주세요.',
      'error.method': '지원하지 않는 압축 방식이 들어 있습니다.',
      'error.emptyzip': 'zip 안에 파일이 없습니다.',
      'error.nofiles': '넣은 항목에 파일이 없습니다.',
      'error.download': '다운로드 중 문제가 생겼습니다.',

      'preset.sequence': '사진 순번 매기기',
      'preset.stripPrefix': '접두어 지우기',
      'preset.replaceWord': '단어 바꾸기',
      'preset.sanitize': '공백·특수문자 정리',
      'preset.ext': '확장자 통일',
      'preset.lower': '소문자로 통일',
      'preset.date': '날짜 형식 통일',
      'preset.suffixNum': '뒤에 번호 붙이기',

      'rule.addPrefix': '앞에 붙이기',
      'rule.typeLabel': '규칙 종류',
      'rule.removePrefix': '앞부분 지우기',
      'rule.removeChars': '글자 수로 지우기',
      'rule.addSuffix': '뒤에 붙이기',
      'rule.removeSuffix': '뒷부분 지우기',
      'rule.replace': '찾아서 바꾸기',
      'rule.sequence': '번호 매기기',
      'rule.date': '날짜 형식 통일',
      'rule.sanitize': '안전한 문자로 정리',
      'rule.case': '대소문자',
      'rule.extension': '확장자 변경',
      'rule.truncate': '길이 자르기',

      'field.text': '문자',
      'field.count': '글자 수',
      'field.find': '찾을 것',
      'field.replace': '바꿀 것',
      'field.regex': '정규식',
      'field.caseSensitive': '대소문자 구분',
      'field.mode': '방식',
      'field.start': '시작',
      'field.step': '간격',
      'field.pad': '자릿수',
      'field.separator': '구분자',
      'field.spaceChar': '공백 대체',
      'field.keepKorean': '한글 유지',
      'field.value': '확장자',
      'field.max': '최대 길이',

      'opt.suffix': '뒤에',
      'opt.front': '앞에서',
      'opt.back': '뒤에서',
      'opt.prefix': '앞에',
      'opt.replace': '이름 전체 교체',
      'opt.dash': '2026-10-27',
      'opt.plain': '20261027',
      'opt.short': '261027',
      'opt.lower': '소문자',
      'opt.upper': '대문자'
    },

    en: {
      'html.title': 'Batch File Renamer - Runs in Your Browser | RenameKit',
      'header.badge': 'No upload',
      'hero.title': 'Batch Rename Files',
      'hero.sub': 'Drop a zip file or a bunch of files, pick a rule, and get them back renamed. No install, no upload — everything runs in your browser.',

      'drop.title': 'Drop a .zip file here',
      'drop.sub': 'We rename the files inside and hand you a new zip. No zip? Dropping loose files works too.',
      'drop.browse': 'Choose files',
      'drop.hint': 'Your files never leave this browser.',

      'file.change': 'Change files',
      'file.reset': 'Reset',
      'file.meta': '{n} files · {size}',
      'file.metaOne': '{n} file · {size}',

      'presets.title': 'Quick start',
      'presets.hint': 'Clicking one replaces the rules below with that preset. Use them as-is or tweak the values.',

      'rules.title': 'Rules',
      'rules.add': '+ Add rule',
      'rules.clear': 'Clear all',
      'rules.hint': 'Rules run top to bottom. To change the file type itself, add a "Change extension" rule.',
      'rules.empty': 'No rules yet. Try a quick start above or add a rule.',

      'preview.title': 'Preview',
      'preview.empty': 'Add files to see the renamed result here.',
      'sort.natural': 'Natural',
      'sort.original': 'Archive',
      'preview.count': 'Showing {m} of {n}',
      'preview.more': '{n} more not shown',

      'table.no': '#',
      'table.before': 'Before',
      'table.after': 'After',
      'table.status': 'Status',
      'status.ok': 'OK',
      'status.warn': 'Check',
      'status.error': 'Problem',

      'btn.download': 'Download renamed .zip',
      'btn.downloading': 'Working…',
      'btn.downloadHint': 'Originals are untouched. You get a new zip with copies.',

      'summary.ok': "All good. {n} files ready to download.",
      'summary.head': 'Check these before continuing:',
      'summary.conflict': 'These end up with the same name: {name}',
      'summary.err.empty': 'Some files would get an empty name (check your rules)',
      'summary.err.invalid': 'Contains characters Windows cannot use: {name}',
      'summary.err.reserved': 'Windows reserved name, cannot be saved: {name}',
      'summary.err.trailing': 'Name ends with a dot or space: {name}',
      'summary.err.long': 'Name is longer than 255 characters: {name}',
      'summary.warn.size': 'Total size is large (~{size}); your browser may struggle. Under 500MB is recommended.',
      'summary.warn.nochange': '{n} files would keep their name. Check that the rule actually applies.',

      'ad.label': 'Ad space',

      'howto.title': 'How it works',
      'howto.s1t': '1. Add files',
      'howto.s1d': 'Drop a whole zip, or select the files you want to rename.',
      'howto.s2t': '2. Set a rule',
      'howto.s2d': 'Click a preset or add rules yourself. The table below updates live.',
      'howto.s3t': '3. Download',
      'howto.s3d': 'Get a new zip with renamed files. Your originals stay as they are.',

      'why.title': 'When this helps',
      'why.b1': 'Phone photos named IMG_2847.jpg that you want in date or number order',
      'why.b2': 'Stripping Screenshot_ or KakaoTalk_ prefixes from chat and screen captures',
      'why.b3': 'Removing "final", "copy" and stray spaces before delivery',
      'why.b4': 'Making filenames web-safe before uploading anywhere',
      'why.b5': 'Unifying mixed .jpeg / .JPEG / .jpg extensions',

      'faq.title': 'FAQ',
      'faq.q1': 'Do my files get uploaded?',
      'faq.a1': 'No. Unzipping, renaming and re-zipping all happen inside your browser. Nothing is sent over the network.',
      'faq.q2': 'Will Korean filenames break?',
      'faq.a2': 'Zips made on Windows sometimes store filenames as CP949. If the UTF-8 flag is missing, this tool retries with CP949 so Korean text survives.',
      'faq.q3': 'Is the folder structure kept?',
      'faq.a3': 'Yes. Folder paths inside the zip are preserved; only file names change.',
      'faq.q4': 'How large can a file be?',
      'faq.a4': 'Since it runs in browser memory, around 500MB or less is recommended. Bigger files may be slow or fail.',

      'footer.note': 'Everything runs in your browser.',

      'nav.tool': 'Tool',
      'nav.guide': 'Guide',
      'nav.faq': 'FAQ',
      'nav.about': 'About',
      'nav.privacy': 'Privacy',
      'content.moreGuide': 'See the guide for all 12 rules and real examples →',
      'content.moreFaq': 'Read all 15 questions →',

      'error.read': 'Could not read the file.',
      'error.notzip': 'That is not a zip file. Drop a zip, or select several files instead.',
      'error.zip64': 'ZIP64 (4GB+) archives are not supported yet.',
      'error.encrypted': 'Encrypted archives cannot be opened. Extract it first and try again.',
      'error.method': 'The archive uses an unsupported compression method.',
      'error.emptyzip': 'The zip contains no files.',
      'error.nofiles': 'No files found in what you dropped.',
      'error.download': 'Something went wrong while downloading.',

      'preset.sequence': 'Number photos',
      'preset.stripPrefix': 'Strip prefix',
      'preset.replaceWord': 'Replace word',
      'preset.sanitize': 'Clean up characters',
      'preset.ext': 'Unify extension',
      'preset.lower': 'Lowercase everything',
      'preset.date': 'Normalize dates',
      'preset.suffixNum': 'Add number at end',

      'rule.addPrefix': 'Add prefix',
      'rule.typeLabel': 'Rule type',
      'rule.removePrefix': 'Remove prefix',
      'rule.removeChars': 'Remove characters',
      'rule.addSuffix': 'Add suffix',
      'rule.removeSuffix': 'Remove suffix',
      'rule.replace': 'Find and replace',
      'rule.sequence': 'Numbering',
      'rule.date': 'Normalize date',
      'rule.sanitize': 'Make safe characters',
      'rule.case': 'Letter case',
      'rule.extension': 'Change extension',
      'rule.truncate': 'Truncate',

      'field.text': 'text',
      'field.count': 'count',
      'field.find': 'find',
      'field.replace': 'replace',
      'field.regex': 'regex',
      'field.caseSensitive': 'match case',
      'field.mode': 'mode',
      'field.start': 'start',
      'field.step': 'step',
      'field.pad': 'digits',
      'field.separator': 'separator',
      'field.spaceChar': 'space as',
      'field.keepKorean': 'keep Korean',
      'field.value': 'extension',
      'field.max': 'max length',

      'opt.suffix': 'at end',
      'opt.front': 'from start',
      'opt.back': 'from end',
      'opt.prefix': 'at start',
      'opt.replace': 'replace whole name',
      'opt.dash': '2026-10-27',
      'opt.plain': '20261027',
      'opt.short': '261027',
      'opt.lower': 'lowercase',
      'opt.upper': 'uppercase'
    }
  };

  var current = 'ko';

  function t(key, vars) {
    var table = DICT[current] || DICT.ko;
    var s = table[key];
    if (s == null) s = (DICT.ko[key] != null ? DICT.ko[key] : key);
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, name) {
        return vars[name] != null ? vars[name] : m;
      });
    }
    return s;
  }

  function getLang() { return current; }

  function setLang(lang) {
    if (!DICT[lang]) return;
    current = lang;
    document.documentElement.lang = lang;
    document.title = t('html.title');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    try { localStorage.setItem('rk.lang', lang); } catch (e) { /* ignore */ }
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  function initialLang() {
    var stored = null;
    try { stored = localStorage.getItem('rk.lang'); } catch (e) { /* ignore */ }
    if (stored && DICT[stored]) return stored;
    // 기본은 항상 한국어. 브라우저 언어 자동 감지는 쓰지 않습니다.
    // 이유: 검색엔진 크롤러는 en-US 로 렌더링하므로, 자동 감지를 켜면
    // 구글이 영어 버전을 색인해서 한국어 검색 노출이 사라집니다.
    // 영어 사용자는 헤더의 EN 버튼을 누르면 되고, 그 선택은 저장됩니다.
    return 'ko';
  }

  global.I18N = { t: t, setLang: setLang, getLang: getLang, initialLang: initialLang };
})(window);
