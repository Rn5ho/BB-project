# Centri U-21 NT — Discord export (whole server: #report-treninga + #splosna-diskusija)
# Run me:  right-click -> Run with PowerShell   (or: powershell -File .\run-export.ps1)
# You will be prompted for your Discord user token — it is used ONLY for this export,
# passed directly to DiscordChatExporter, and never written to disk.
# Token: use Desktop\token.txt if present (then delete it), else prompt for a VISIBLE paste.
$tokenFile = 'C:\Users\Rn5ho\Desktop\token.txt'
if (Test-Path $tokenFile) {
  $token = (Get-Content $tokenFile -Raw).Trim()
  Remove-Item $tokenFile -Force
  Write-Host "Token read from token.txt ($($token.Length) chars); file deleted." -ForegroundColor Cyan
} else {
  $token = (Read-Host 'Paste your Discord token (VISIBLE - check it is complete, then Enter)').Trim()
}
if ($token.Length -lt 30) {
  Write-Host "Token looks too short ($($token.Length) chars) — copy the FULL authorization value and try again." -ForegroundColor Red
  exit 1
}
Write-Host "Starting export with a $($token.Length)-char token..." -ForegroundColor Cyan
$cli = 'C:\Users\Rn5ho\Tools\DiscordChatExporter-Cli\DiscordChatExporter.Cli.exe'
$out = 'C:\Users\Rn5ho\Downloads\centri-u21'
& $cli exportguild -g 1286640156354412565 -t $token -f Json --media --output "$out\%C.json"
if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host "EXPORT FAILED (exit code $LASTEXITCODE) — read the error above." -ForegroundColor Red
} else {
  Write-Host ''
  Write-Host 'Done. Exported files:' -ForegroundColor Green
  Get-ChildItem $out -Recurse | Select-Object FullName, @{n='MB';e={[math]::Round($_.Length/1MB,1)}} | Format-Table -AutoSize
}
