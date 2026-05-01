$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $projectRoot ".run\processes.json"

if (-not (Test-Path $pidFile)) {
    Write-Host "No managed process file found. Nothing to stop."
    exit 0
}

$items = Get-Content -Path $pidFile -Raw | ConvertFrom-Json
if ($items -isnot [System.Array]) {
    $items = @($items)
}

foreach ($item in $items) {
    $proc = Get-Process -Id $item.pid -ErrorAction SilentlyContinue
    if ($null -ne $proc) {
        taskkill /PID $item.pid /T /F | Out-Null
        Write-Host "Stopped $($item.name) (PID=$($item.pid), tree)."
    } else {
        Write-Host "$($item.name) (PID=$($item.pid)) was not running."
    }
}

Remove-Item -Path $pidFile -Force
Write-Host "All managed services are stopped."
