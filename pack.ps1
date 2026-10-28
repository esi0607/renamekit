# deploy.zip 생성 스크립트 (수동 업로드용 / Git 연동 시에는 필요 없음)
# 사용법: 프로젝트 폴더에서  .\pack.ps1
#
# public/ 안의 사이트 파일만 담아 Cloudflare Pages 에 올릴 수 있는 zip 을 만듭니다.
# Compress-Archive 는 경로를 'css\style.css' 처럼 역슬래시로 저장하는데
# zip 규격은 '/' 이므로, ZipArchive 를 직접 써서 정확히 만듭니다.

$ErrorActionPreference = 'Stop'

try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

Add-Type -AssemblyName System.IO.Compression | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem | Out-Null

$root = $PSScriptRoot
$src  = Join-Path $root 'public'
$out  = Join-Path $root 'deploy.zip'

if (-not (Test-Path $src)) { throw "public 폴더가 없습니다: $src" }

$items = @('index.html', 'css/style.css')
$missing = $items | Where-Object { -not (Test-Path (Join-Path $src $_)) }
if ($missing) { throw "public/ 안에 누락된 항목: $($missing -join ', ')" }

if (Test-Path $out) { Remove-Item $out -Force }

# public/ 안의 모든 파일을 담습니다 (경로 구분자는 반드시 '/')
$entries = @()
Get-ChildItem -Path $src -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length + 1).Replace('\', '/')
    $entries += , @($_.FullName, $rel)
}

$stream = [System.IO.File]::Open($out, [System.IO.FileMode]::Create)
$archive = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($e in $entries) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive, $e[0], $e[1], [System.IO.Compression.CompressionLevel]::Optimal
        ) | Out-Null
    }
}
finally {
    $archive.Dispose()
    $stream.Dispose()
}

$size = [math]::Round((Get-Item $out).Length / 1KB, 1)
Write-Host ""
Write-Host "deploy.zip 생성 완료 ($size KB)" -ForegroundColor Green
Write-Host ""

# 구조 검증
$readStream = [System.IO.File]::OpenRead($out)
$readArchive = New-Object System.IO.Compression.ZipArchive($readStream, [System.IO.Compression.ZipArchiveMode]::Read)
$names = @()
try {
    foreach ($entry in $readArchive.Entries) {
        $names += $entry.FullName
        Write-Host ("  " + $entry.FullName)
    }
}
finally {
    $readArchive.Dispose()
    $readStream.Dispose()
}

$badSlash  = $names | Where-Object { $_ -like '*\*' }
$rootIndex = $names | Where-Object { $_ -eq 'index.html' }
$hasCss    = $names | Where-Object { $_ -eq 'css/style.css' }

Write-Host ""
if ($badSlash) {
    Write-Host "경고: 역슬래시 경로가 있습니다: $($badSlash -join ', ')" -ForegroundColor Red
    exit 1
}
if (-not $rootIndex) {
    Write-Host "경고: index.html 이 최상위에 없습니다. 배포하면 404가 납니다." -ForegroundColor Red
    exit 1
}
if (-not $hasCss) {
    Write-Host "경고: css/style.css 가 없습니다." -ForegroundColor Red
    exit 1
}

Write-Host "OK: 구조 정상." -ForegroundColor Green
