# 배포 가이드

사이트 파일은 모두 `public/` 안에 있습니다. 저장소 루트에는 문서와 스크립트만 둡니다.

```
public/            ← 실제 배포되는 파일 (Cloudflare 의 Build output directory)
  index.html
  css/style.css
  js/*.js
  favicon.svg
  robots.txt
  sitemap.xml
pack.ps1           수동 업로드용 zip 생성 스크립트
deploy.zip         수동 업로드용 (git 에는 안 올라감)
```

---

## 1. GitHub에 올리기 (한 번만, 웹사이트에서)

명령어는 하나도 쓰지 않습니다. 브라우저만 있으면 됩니다.

### 1-1. 빈 저장소 만들기

1. https://github.com 로그인
2. 오른쪽 위 **`+`** → **New repository**
3. 입력:

   | 항목 | 값 |
   |---|---|
   | Repository name | `renamekit` |
   | Description | (비워도 됨) |
   | Public / Private | **Public** (Private도 동작함) |
   | Add a README file | **체크 해제** |
   | Add .gitignore | **None** |
   | Choose a license | **None** |

   > README를 체크하면 저장소에 파일이 미리 생겨서 업로드 화면 링크가 안 보입니다.
   > 전부 비워두고 **Create repository** 를 누르세요.

4. **Create repository** 클릭

### 1-2. 파일 올리기

저장소가 만들어지면 "Get started by creating a new file or uploading an existing file" 같은
안내와 함께 **uploading an existing file** 링크가 보입니다. 클릭하세요.

> 링크가 안 보이면 주소창에 직접 입력:
> `https://github.com/<계정>/renamekit/upload/main`

그다음 **윈도우 탐색기에서 프로젝트 폴더(`기본 프로젝트`)를 열고**:

1. `public` 폴더를 **통째로** 브라우저 업로드 영역에 끌어다 놓기
2. 이어서 아래 파일들도 함께 끌어다 놓기

   ```
   pack.ps1
   DEPLOY.md
   README.md
   .gitignore
   .gitattributes
   ```

3. 아래쪽 **Commit changes** 입력란에 `RenameKit 초기 버전` 입력
4. **Commit changes** 버튼 클릭

> **`deploy.zip`은 올리지 마세요.** 수동 업로드용이라 저장소에는 필요 없습니다.
> **`.git` 폴더도 올리지 마세요.** 탐색기에서 기본으로 숨겨져 있어서 실수할 일은 없습니다.

### 1-3. 구조 확인

저장소 첫 화면에 이렇게 보이면 정상입니다.

```
public/
pack.ps1
DEPLOY.md
README.md
.gitignore
.gitattributes
```

`public` 을 클릭했을 때 `index.html`, `css`, `js`, `favicon.svg`, `robots.txt`, `sitemap.xml`
이 보여야 합니다. **`public` 폴더가 사라지고 파일만 늘어서 있으면** Cloudflare 빌드 설정에서
경로를 못 찾으니, 폴더째로 다시 올려야 합니다.

> **드래그가 안 되거나 폴더가 빠질 때**
> 업로드 화면에서 **choose your files** 로 파일을 하나씩 선택하면 폴더 구조가 유지되지 않습니다.
> 이럴 때는 **Add file → Create new file** 을 눌러 파일 이름 칸에
> `public/css/style.css` 처럼 **슬래시를 포함해** 입력하면 폴더가 자동으로 만들어집니다.
> 파일 10개라서 손으로 해도 몇 분이면 끝납니다.

---

## 2. Cloudflare에서 재생성 (한 번만)

> **왜 지우고 다시 만드나요?**
> 1. Direct Upload 프로젝트는 Git 연동으로 **전환할 수 없습니다.**
> 2. `*.pages.dev` 서브도메인은 **변경할 수 없습니다.**
> → `renamekit.pages.dev`를 유지하려면 삭제 후 같은 이름으로 다시 만들어야 합니다.
> 지금은 트래픽도 커스텀 도메인도 없으므로 잃는 것이 없습니다.

1. https://dash.cloudflare.com → **Workers & Pages**
2. 기존 `renamekit` 프로젝트 클릭 → **Settings** 맨 아래 **Delete project**
   - 주소가 반납됩니다. 몇 분 뒤 같은 이름을 다시 쓸 수 있습니다.
3. **Create application** → **Pages** 탭 → **Connect to Git**
4. **Connect GitHub** 클릭 → **Install & Authorize**
   - 권한 화면이 나오면 **Only select repositories** → `renamekit` 선택 (또는 All repositories)
   - **Install & Authorize** 클릭
5. 저장소 목록에서 `renamekit` 옆 **Begin setup**
6. **프로젝트 이름**: `renamekit` (이름이 곧 서브도메인이 됩니다)
7. 빌드 설정:

   | 항목 | 값 |
   |---|---|
   | Production branch | `main` |
   | Framework preset | `None` |
   | Build command | (비움) |
   | Build output directory | `public` |
   | Root directory | (비움) |

8. **Save and Deploy**
9. 1~2분 뒤 `https://renamekit.pages.dev` 확인

> 프로젝트 이름을 다른 걸로 하면 서브도메인도 달라집니다. `renamekit`을 그대로 입력하세요.

---

## 3. 이후 업데이트 (웹사이트에서)

파일을 고쳤으면 GitHub에 다시 올리기만 하면 됩니다. Cloudflare가 자동으로 감지합니다.

**방법 A — 파일 하나만 고칠 때 (추천)**

1. GitHub 저장소에서 파일 클릭 (예: `public/js/rename.js`)
2. 오른쪽 위 **연필 아이콘** 클릭
3. 수정 → **Commit changes** → **Commit changes**
4. 1~2분 뒤 자동 배포

**방법 B — 여러 파일을 한꺼번에 올릴 때**

1. 저장소 → **Add file** → **Upload files**
2. 바뀐 파일(또는 `public` 폴더째)을 끌어다 놓기
3. **Commit changes**

배포 진행 상황은 Cloudflare 대시보드 → 프로젝트 → **Deployments** 탭에서 볼 수 있습니다.
이전 배포는 자동 보관되고, 문제가 생기면 **Rollback** 으로 즉시 되돌릴 수 있습니다.

> **주의**: 웹 업로드는 "덮어쓰기"가 아니라 "같은 경로에 새 버전 추가"입니다.
> 같은 이름으로 올리면 GitHub가 알아서 교체하므로 문제 없습니다.

---

## 4. 수동 업로드 (Git 연동 전에만)

> **Git 연동을 마쳤으면 이 항목은 필요 없습니다.**
> Git으로 만든 프로젝트에는 대시보드에 zip 업로드 버튼이 없습니다.
> 이 방법은 연동 전 Direct Upload 프로젝트에서만 쓸 수 있습니다.

```powershell
.\pack.ps1
```

`deploy.zip`이 생성됩니다. 스크립트 실행이 차단되면:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\pack.ps1
```

> **주의**: 윈도우 기본 `Compress-Archive`는 경로를 `css\style.css`처럼 역슬래시로
> 저장합니다. zip 규격은 `/`이라서 그대로 올리면 배포가 깨질 수 있습니다.
> `pack.ps1`은 `ZipArchive`를 직접 써서 `/`로 저장하고, 생성 후 구조까지 검증합니다.

업로드 경로: 프로젝트 → **Create new deployment** → `deploy.zip` 업로드 → **Deploy**

> **Git 연동 후에는 절대 삭제하지 마세요.** `Delete project` 를 누르면
> `renamekit.pages.dev` 주소가 반납되고, 저장소 연결도 끊깁니다.

---

## 5. 배포 후 확인 체크리스트

- [ ] `https://renamekit.pages.dev/` 첫 화면이 뜬다
- [ ] 한국어로 표시된다 (영어면 **KO** 클릭)
- [ ] `https://renamekit.pages.dev/robots.txt` 내용이 보인다
- [ ] `https://renamekit.pages.dev/sitemap.xml` 내용이 보인다
- [ ] `https://renamekit.pages.dev/og.png` 이미지가 보인다
- [ ] 상단 메뉴 **사용법 / 자주 묻는 질문 / 소개** 링크가 열린다
- [ ] 하단 **개인정보처리방침** 링크가 열린다
- [ ] 탭 아이콘이 보라색 R 아이콘이다
- [ ] zip을 끌어다 놓으면 파일 목록이 뜬다
- [ ] 프리셋 → 미리보기 → 다운로드까지 동작한다
- [ ] 받은 zip의 한글이 안 깨진다

---

## 5-1. 애드센스 신청 순서

사이트가 살아 있는 것을 확인한 **다음에** 진행하세요.

### ① Google Search Console 등록

1. https://search.google.com/search-console 접속
2. **URL 접두어** 방식 선택 → `https://renamekit.pages.dev/` 입력
3. `search-console-XXXX.html` 파일을 내려받기
4. GitHub 저장소 → **Add file → Upload files** → 그 파일을 `public/` 안에 업로드
   - ⚠️ 반드시 `public/` 안에 넣어야 사이트에서 열립니다 (루트에 두면 404)
5. 1~2분 뒤 Search Console에서 **확인** 클릭
6. 좌측 **Sitemaps** → `sitemap.xml` 입력 → **제출**

### ② 색인 요청

Search Console 상단 검색창에 URL을 넣고 **색인 생성 요청**을 누르세요.
5개 페이지(`/`, `/guide.html`, `/faq.html`, `/about.html`, `/privacy.html`)를 각각 요청합니다.

### ③ 애드센스 신청

1. https://adsense.google.com → Google 계정으로 시작
2. 사이트 URL: `https://renamekit.pages.dev`
3. **사이트 소유권 확인** 단계에서 나오는 코드를 `public/index.html`의 `</head>` 바로 위에 붙여넣기

   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
   ```

4. GitHub에서 바로 수정 → **Commit changes** → 1~2분 뒤 자동 배포
5. 애드센스에서 **확인** 클릭

### ④ 승인 후 할 일

1. `index.html`에서 광고 슬롯 주석을 해제 (`<!-- 광고 슬롯` 부분)
   - `data-ad-client` 와 `data-ad-slot` 을 애드센스에서 발급받은 값으로 교체
2. 애드센스 → **사이트 → ads.txt** 에서 안내하는 한 줄을 `public/ads.txt` 로 만들어 업로드
3. 2~4주 뒤 정책 센터에서 승인 여부 확인

> **심사 기간:** 보통 2주 안팎, 길면 한 달입니다. 그동안 블로그 글을 5~10개 올려두면
> 승인 확률이 올라갑니다. 승인 전에는 광고 코드를 넣지 않아도 됩니다.

---

## 6. 잘 안 될 때

**흰 화면 / 404**
Build output directory가 `public`인지 확인하세요.

**CSS가 안 먹는다**
`public/css/style.css`가 저장소에 있는지, `.gitignore`가 `css`를 막고 있지 않은지 확인.

**수정했는데 반영이 안 된다**
1. GitHub 저장소에 실제로 커밋이 올라갔는지 확인 (저장소 → **Commits**)
2. Cloudflare Deployments 탭에서 새 배포가 돌았는지 확인
3. 브라우저 **Ctrl+F5**

**`renamekit` 이름을 다시 못 쓴다**
삭제 직후 몇 분간 반납이 지연될 수 있습니다. 잠시 후 다시 시도하세요.

---

## 7. 커스텀 도메인 (나중에)

애드센스를 신청할 시점에 도메인을 사면 됩니다.

1. 도메인 구매 (Cloudflare Registrar, Namecheap 등 — 연 1~2만 원)
2. Pages 프로젝트 → **Custom domains** → **Set up a domain**
3. 안내에 따라 DNS 설정 (도메인을 Cloudflare로 옮기면 자동)
4. HTTPS 인증서 자동 발급

> 애드센스는 `*.pages.dev` 같은 무료 서브도메인보다 **내 도메인**이 승인에 유리합니다.
> 나중에 블로그 글까지 같은 도메인 아래(`example.com/blog`)로 옮기면 SEO가 합쳐집니다.

---

## 8. 비용

무료 플랜으로 충분합니다.

| 항목 | 무료 한도 |
|---|---|
| 대역폭 | 무제한 |
| 빌드 | 월 500회 |
| 파일 수 | 배포당 20,000개 |
| 파일 크기 | 25 MiB |

현재 사이트는 약 **210KB**, 파일 16개입니다.
