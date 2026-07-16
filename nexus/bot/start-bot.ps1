$botPath = "C:\Users\HIHIH\OneDrive\Project\nexus\bot"
$logFile = "$botPath\bot.log"
$errorFile = "$botPath\error.log"
$watchdogLog = "$botPath\watchdog.log"

$botRunning = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match $botPath.Replace('\', '\\') }
if (-not $botRunning) {
  Start-Process -FilePath "node" -ArgumentList "index.js" -WorkingDirectory $botPath -NoNewWindow -RedirectStandardOutput $logFile -RedirectStandardError $errorFile
  Add-Content $watchdogLog "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Bot started"
}
