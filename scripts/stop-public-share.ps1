$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$runtimeDir = Join-Path $projectRoot ".runtime"

foreach ($name in @("tunnel.pid", "app.pid")) {
  $path = Join-Path $runtimeDir $name
  if (Test-Path $path) {
    $pid = Get-Content $path | Select-Object -First 1
    if ($pid) {
      try {
        Stop-Process -Id ([int]$pid) -Force -ErrorAction Stop
        Write-Host "Stopped PID" $pid
      } catch {
        Write-Host "PID" $pid "was not running."
      }
    }
    Remove-Item $path -Force
  }
}
