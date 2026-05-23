param(
  [string]$Config = ""
)

$ErrorActionPreference = "Stop"

function Get-SafeName($value) {
  $safe = $value -replace '[^a-zA-Z0-9 _-]', ''
  $safe = $safe.Trim()
  if (-not $safe) { return "Customer QR" }
  return $safe
}

function Get-Slug($value) {
  $slug = ($value.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
  if (-not $slug) { return "customer-qr" }
  return $slug
}

$root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$configPath = if ($Config) { Resolve-Path -LiteralPath $Config } else { Resolve-Path -LiteralPath (Join-Path $root "brand-config.json") }
$brand = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json

$appName = Get-SafeName $(if ($brand.appName) { $brand.appName } else { "MP Technology QR" })
$packageName = Get-Slug $appName
$customerName = if ($brand.customerName) { $brand.customerName } else { $appName }
$logoShortName = if ($brand.logoShortName) { $brand.logoShortName } else { "Logo" }
$defaultFileName = if ($brand.defaultFileName) { $brand.defaultFileName } else { $packageName }
$tagline = if ($brand.tagline) { $brand.tagline } else { "QR codes your brand can hand out with confidence." }
$sampleUrl = if ($brand.sampleUrl) { $brand.sampleUrl } else { "https://yourdomain.com" }
$logoSource = if ($brand.logoSource) { Resolve-Path -LiteralPath $brand.logoSource } else { Resolve-Path -LiteralPath (Join-Path $root "assets\mp-technology-logo.png") }
$logoExtension = [System.IO.Path]::GetExtension($logoSource.Path)
$logoFileName = "customer-logo$logoExtension"

$electronDist = Join-Path $root "node_modules\electron\dist"
$out = Join-Path $root "dist\$appName-win32-x64"
$appOut = Join-Path $out "resources\app"
$vendorOut = Join-Path $appOut "vendor"
$assetsOut = Join-Path $appOut "assets"
$logoOutPath = Join-Path $assetsOut $logoFileName

if (-not (Test-Path -LiteralPath (Join-Path $electronDist "electron.exe"))) {
  throw "Electron runtime was not found. Run npm install first."
}

if (Test-Path -LiteralPath $out) {
  $resolvedOut = (Resolve-Path -LiteralPath $out).Path
  if (-not $resolvedOut.StartsWith($root.Path)) {
    throw "Refusing to remove outside project: $resolvedOut"
  }
  Remove-Item -LiteralPath $resolvedOut -Recurse -Force
}

New-Item -ItemType Directory -Path $appOut -Force | Out-Null

Get-ChildItem -LiteralPath $electronDist -Force | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $out -Recurse -Force
}

Move-Item -LiteralPath (Join-Path $out "electron.exe") -Destination (Join-Path $out "$appName.exe") -Force
Copy-Item -LiteralPath `
  (Join-Path $root "index.html"), `
  (Join-Path $root "styles.css"), `
  (Join-Path $root "app.js"), `
  (Join-Path $root "main.js") `
  -Destination $appOut -Force

New-Item -ItemType Directory -Path $vendorOut -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root "vendor\qrcode.min.js") -Destination $vendorOut -Force

New-Item -ItemType Directory -Path $assetsOut -Force | Out-Null
Copy-Item -LiteralPath $logoSource.Path -Destination $logoOutPath -Force

$runtimeBrand = @{
  appName = $appName
  customerName = $customerName
  logoPath = "assets/$logoFileName"
  logoShortName = $logoShortName
  defaultFileName = $defaultFileName
  tagline = $tagline
  sampleUrl = $sampleUrl
}
$brandJson = $runtimeBrand | ConvertTo-Json -Depth 4
Set-Content -LiteralPath (Join-Path $appOut "brand-config.json") -Value $brandJson -Encoding UTF8
Set-Content -LiteralPath (Join-Path $appOut "brand-config.js") -Value "window.MP_QR_BRAND = $brandJson;" -Encoding UTF8

$appPackage = @{
  name = $packageName
  version = "0.1.0"
  main = "main.js"
} | ConvertTo-Json

Set-Content -LiteralPath (Join-Path $appOut "package.json") -Value $appPackage -Encoding UTF8
Write-Output "Built $out"
