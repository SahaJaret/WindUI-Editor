param(
  [string]$Icons1 = "D:\GiRep\Icons1.lua",
  [string]$Icons2 = "D:\GiRep\Icons2.lua",
  [string]$OutDir = "D:\GiRep\WindUI\preview\icons-cache",
  [int]$DelayMs = 200,
  [string]$Cookie = ""
)

if (-not (Test-Path $Icons1) -and -not (Test-Path $Icons2)) {
  Write-Error "Icons1.lua/Icons2.lua not found. Pass -Icons1/-Icons2 paths."
  exit 1
}

$cookie = $Cookie
if (-not $cookie) { $cookie = $env:ROBLOX_SECURITY }
if (-not $cookie) {
  $secure = Read-Host -AsSecureString "Enter .ROBLOSECURITY cookie"
  $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $cookie = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}
if (-not $cookie) {
  Write-Error "Missing .ROBLOSECURITY cookie."
  exit 1
}
$cookie = $cookie.Trim()
$cookie = $cookie.Trim('"').Trim("'")
if ($cookie -match 'ROBLOSECURITY=') {
  $cookie = $cookie -replace '^.*ROBLOSECURITY=',''
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$pattern = '\["([^"]+)"\]\s*=\s*"rbxassetid://(\d+)"'
$icons = @{}

foreach ($file in @($Icons1, $Icons2)) {
  if (-not (Test-Path $file)) { continue }
  $text = Get-Content -Raw -Path $file
  [regex]::Matches($text, $pattern) | ForEach-Object {
    $name = $_.Groups[1].Value
    $id = $_.Groups[2].Value
    if (-not $icons.ContainsKey($name)) { $icons[$name] = $id }
  }
}

Write-Host "Icons found:" $icons.Count

$headers = @{
  "Cookie" = ".ROBLOSECURITY=$cookie"
  "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

try {
  $auth = Invoke-WebRequest -Uri "https://users.roblox.com/v1/users/authenticated" -Headers $headers -UseBasicParsing -Method GET
  if ($auth.StatusCode -ne 200) {
    Write-Error "Auth test status: $($auth.StatusCode). Cookie invalid or blocked."
    exit 1
  }
} catch {
  Write-Error "Auth test failed: $($_.Exception.Message)"
  Write-Error "Cookie invalid or blocked. Re-login and copy a fresh cookie."
  exit 1
}

$count = 0
$fail = 0
foreach ($kv in ($icons.GetEnumerator() | Sort-Object Name)) {
  $name = $kv.Name
  $id = $kv.Value
  $out = Join-Path $OutDir ($name + ".png")
  if (Test-Path $out) { continue }
  $url = "https://assetdelivery.roblox.com/v1/asset/?id=$id"
  try {
    Invoke-WebRequest -Uri $url -Headers $headers -OutFile $out -UseBasicParsing | Out-Null
    $count++
    if ($count % 50 -eq 0) { Write-Host "Downloaded" $count }
    Start-Sleep -Milliseconds $DelayMs
  } catch {
    $fail++
    if ($fail -le 3) {
      Write-Warning "Failed $name ($id): $($_.Exception.Message)"
      Write-Warning "URL: $url"
    } elseif ($fail -eq 4) {
      Write-Warning "More failures suppressed..."
    }
  }
}

Write-Host "Done. Downloaded:" $count
