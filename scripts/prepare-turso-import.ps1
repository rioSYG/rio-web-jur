$dbPath = Join-Path $PSScriptRoot "..\\prisma\\dev.db"
$resolvedPath = Resolve-Path $dbPath

Write-Host "Preparing SQLite database for Turso import:" $resolvedPath

sqlite3 $resolvedPath "PRAGMA journal_mode='wal';"
sqlite3 $resolvedPath "PRAGMA wal_checkpoint(truncate);"
sqlite3 $resolvedPath "PRAGMA journal_mode;"

Write-Host ""
Write-Host "Database is ready for Turso import."
Write-Host "Next command:"
Write-Host "turso db import $resolvedPath"
