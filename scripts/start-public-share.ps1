$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$runtimeDir = Join-Path $projectRoot ".runtime"

if (!(Test-Path $runtimeDir)) {
  New-Item -ItemType Directory -Path $runtimeDir | Out-Null
}

$appOut = Join-Path $runtimeDir "app.log"
$appErr = Join-Path $runtimeDir "app.err.log"
$tunnelOut = Join-Path $runtimeDir "tunnel.log"
$tunnelErr = Join-Path $runtimeDir "tunnel.err.log"
$appPidFile = Join-Path $runtimeDir "app.pid"
$tunnelPidFile = Join-Path $runtimeDir "tunnel.pid"
$port = 3002

foreach ($path in @($appOut, $appErr, $tunnelOut, $tunnelErr)) {
  if (Test-Path $path) {
    Remove-Item $path -Force
  }
}

$app = Start-Process -FilePath "npm.cmd" `
  -ArgumentList "run", "start", "--", "--hostname", "127.0.0.1", "--port", "$port" `
  -WorkingDirectory $projectRoot `
  -PassThru `
  -RedirectStandardOutput $appOut `
  -RedirectStandardError $appErr

Set-Content -Path $appPidFile -Value $app.Id

Start-Sleep -Seconds 8

$tunnel = Start-Process -FilePath "cloudflared.exe" `
  -ArgumentList "tunnel", "--url", "http://127.0.0.1:$port" `
  -WorkingDirectory $projectRoot `
  -PassThru `
  -RedirectStandardOutput $tunnelOut `
  -RedirectStandardError $tunnelErr

Set-Content -Path $tunnelPidFile -Value $tunnel.Id

Start-Sleep -Seconds 8

$tunnelLogs = @()
if (Test-Path $tunnelOut) {
  $tunnelLogs += Get-Content $tunnelOut
}
if (Test-Path $tunnelErr) {
  $tunnelLogs += Get-Content $tunnelErr
}

$match = $tunnelLogs | Select-String -Pattern "https://[-a-zA-Z0-9\.]+trycloudflare\.com" | Select-Object -First 1

Write-Host "App PID:" $app.Id
Write-Host "Tunnel PID:" $tunnel.Id

if ($match) {
  Write-Host ""
  Write-Host "Public URL:"
  Write-Host $match.Matches[0].Value
} else {
  Write-Host ""
  Write-Host "Tunnel started, but public URL was not detected yet."
  Write-Host "Check logs:"
  Write-Host $tunnelOut
  Write-Host $tunnelErr
}
