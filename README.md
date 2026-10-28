# RenameKit — 파일명 일괄 변경 웹툴

zip 파일(또는 파일 여러 개)을 브라우저로 끌어다 놓으면, 규칙에 따라 이름을 바꿔서 새 zip으로 돌려주는 정적 웹앱입니다.
**서버가 없습니다.** 압축 해제·이름 변경·재압축이 전부 브라우저 안에서 일어납니다.

## 실행

가장 간단한 방법: `public/index.html`을 더블클릭.

로컬 서버로 보고 싶다면:

```powershell
cd public
python -m http.server 8899
# 또는
npx serve .
```

## 파일 구조

```
public/             실제 배포되는 사이트 (Cloudflare Build output directory)
  index.html        도구 화면 + SEO 메타 + 구조화 데이터
  guide.html        사용법 문서 (규칙 12가지, 실전 예시)
  faq.html          자주 묻는 질문 15개
  about.html        사이트 소개, 동작 원리, 한계
  privacy.html      개인정보처리방침 (애드센스 대응)
  css/style.css     스타일 (라이트/다크 자동)
  js/i18n.js        한국어/영어 사전 + 토글
  js/zip.js         ZIP 파서 (CP949 파일명 대응) + 생성
  js/rename.js      이름 변환 규칙 엔진 (DOM 없음, 순수 함수)
  js/app.js         UI 연결
  js/vendor/fflate.js 압축 라이브러리 (로컬 번들, CDN 의존 없음)
  favicon.svg       탭 아이콘
  og.png            SNS 공유 썸네일 (1200x630)
  robots.txt        크롤러 허용 + sitemap 위치
  sitemap.xml       검색엔진용 (5개 URL)
  _headers          Cloudflare Pages 응답 헤더/캐시 설정
pack.ps1            수동 업로드용 deploy.zip 생성
DEPLOY.md           배포 절차
```

## 규칙 엔진

`RenameEngine.applyRules(base, rules, index, total)`이 핵심입니다.
규칙은 배열이고 **위에서부터 순서대로** 적용됩니다. 확장자는 `extension` 규칙으로만 바꿉니다.

지원 규칙: `addPrefix` `removePrefix` `removeChars` `addSuffix` `removeSuffix` `replace`
`sequence` `date` `sanitize` `case` `extension` `truncate`

프리셋은 `js/rename.js`의 `PRESETS` 배열에 있습니다. 여기에 항목을 추가하고
`js/i18n.js`에 `preset.<id>` 문구를 넣으면 버튼이 하나 늘어납니다.

## ZIP 처리에서 신경 쓴 부분

- **CP949 파일명**: 윈도우 탐색기로 만든 zip은 파일명을 CP949로 저장하고 UTF-8 플래그를
  세우지 않는 경우가 있습니다. UTF-8로 먼저 시도하고, 실패하면 `euc-kr`로 다시 읽습니다.
- **역슬래시 경로**: .NET `Compress-Archive`는 `사진\a.jpg`처럼 역슬래시를 씁니다.
  파싱할 때 `/`로 정규화합니다.
- **쓰레기 파일**: `__MACOSX/`, `.DS_Store`, `Thumbs.db`는 자동으로 건너뜁니다.
- **출력**: fflate가 UTF-8로 쓰고 플래그를 세우므로 윈도우·macOS·리눅스 모두 정상 표시됩니다.
- **정렬**: zip 안의 엔트리는 사전순(`1, 10, 11, 12, 2, 3…`)으로 저장된 경우가 많습니다.
  탐색기·반디집은 표시할 때 자연 정렬을 하므로, 이 툴도 기본은 `1, 2, … 10, 11`로
  정렬합니다(`RenameEngine.naturalCompare`). 미리보기 옆 **자연순 / 원본순** 토글로
  압축 파일에 저장된 순서 그대로 볼 수도 있습니다. 번호 매기기 규칙은 화면에 보이는
  순서를 그대로 따릅니다.

## 광고 넣는 위치

`index.html`에서 `data-ad-slot`이 붙은 div가 광고 자리입니다.

```html
<div class="ad-slot" data-ad-slot="tool-bottom">
  <!-- 애드센스 승인 후 여기에 <ins class="adsbygoogle"> 코드를 넣으세요 -->
</div>
```

## 배포

정적 파일만 있으므로 아무 데나 올리면 됩니다.
Cloudflare Pages / Netlify / GitHub Pages / Vercel — 모두 무료.

## 다음 단계 후보

1. **B안(폴더 직접 변경)**: `if ('showDirectoryPicker' in window)`로 감지해서 버튼만 추가하면 됩니다.
   크롬·엣지에서만 동작하고 HTTPS가 필요합니다.
2. **`/ko/`, `/en/` URL 분리 + hreflang**: 지금은 한 페이지 토글이지만, 검색 노출을
   두 배로 늘리려면 언어별 정적 페이지를 따로 만들고 `hreflang`을 걸어야 합니다.
3. **프리셋 확장**: EXIF 날짜 기반 정렬, 대량 파일 드래그 시 진행률 표시 등.
4. **테스트**: `js/rename.js`는 순수 함수라 node로 바로 검증할 수 있습니다.
