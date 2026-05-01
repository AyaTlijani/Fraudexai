param(
    [switch]$WithStreamlit
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPython = Join-Path $projectRoot ".venv\Scripts\python.exe"
$runDir = Join-Path $projectRoot ".run"
$pidFile = Join-Path $runDir "processes.json"

function Get-ListeningProcessId {
    param([int]$Port)

    $pattern = "^\s*TCP\s+\S+:" + $Port + "\s+\S+\s+LISTENING\s+\d+\s*$"
    $line = netstat -ano -p TCP | Select-String -Pattern $pattern | Select-Object -First 1
    if ($null -eq $line) {
        return $null
    }

    $columns = $line.Line.Trim() -split "\s+"
    if ($columns.Count -lt 5) {
        return $null
    }

    return [int]$columns[4]
}

function Assert-PortAvailable {
    param(
        [int]$Port,
        [string]$ServiceName
    )

    $existingPid = Get-ListeningProcessId -Port $Port
    if ($null -ne $existingPid) {
        $proc = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
        $procName = if ($null -ne $proc) { $proc.ProcessName } else { "unknown" }
        throw "$ServiceName cannot start because port $Port is already in use by PID $existingPid ($procName). Stop that process and rerun .\\start_project.ps1."
    }
}

if (-not (Test-Path $venvPython)) {
    throw "Virtual environment not found at $venvPython. Run setup first."
}

if (-not (Test-Path $runDir)) {
    New-Item -ItemType Directory -Path $runDir | Out-Null
}

$processes = @()

Assert-PortAvailable -Port 8000 -ServiceName "Backend"

$backendOut = Join-Path $runDir "backend.out.log"
$backendErr = Join-Path $runDir "backend.err.log"
$backendProc = Start-Process -FilePath $venvPython `
    -WorkingDirectory (Join-Path $projectRoot "backend") `
    -ArgumentList @("-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000") `
    -PassThru `
    -WindowStyle Hidden `
    -RedirectStandardOutput $backendOut `
    -RedirectStandardError $backendErr
$processes += [pscustomobject]@{ name = "backend"; pid = $backendProc.Id; port = 8000 }

Assert-PortAvailable -Port 4200 -ServiceName "Frontend"

$frontendOut = Join-Path $runDir "frontend.out.log"
$frontendErr = Join-Path $runDir "frontend.err.log"
$frontendProc = Start-Process -FilePath "npm.cmd" `
    -WorkingDirectory (Join-Path $projectRoot "frontend") `
    -ArgumentList @("run", "start", "--", "--host", "0.0.0.0", "--port", "4200", "--no-open") `
    -PassThru `
    -WindowStyle Hidden `
    -RedirectStandardOutput $frontendOut `
    -RedirectStandardError $frontendErr
$processes += [pscustomobject]@{ name = "frontend"; pid = $frontendProc.Id; port = 4200 }

if ($WithStreamlit) {
    Assert-PortAvailable -Port 8501 -ServiceName "Streamlit"

    $streamlitOut = Join-Path $runDir "streamlit.out.log"
    $streamlitErr = Join-Path $runDir "streamlit.err.log"
    $streamlitProc = Start-Process -FilePath $venvPython `
        -WorkingDirectory (Join-Path $projectRoot "Fraud_Analyst") `
        -ArgumentList @("-m", "streamlit", "run", "app_dataanalyst.py", "--server.port", "8501", "--server.headless", "true") `
        -PassThru `
        -WindowStyle Hidden `
        -RedirectStandardOutput $streamlitOut `
        -RedirectStandardError $streamlitErr
    $processes += [pscustomobject]@{ name = "streamlit"; pid = $streamlitProc.Id; port = 8501 }
}

$processes | ConvertTo-Json | Set-Content -Path $pidFile -Encoding UTF8

Write-Host "Started services:"
foreach ($p in $processes) {
    Write-Host "- $($p.name) (PID=$($p.pid), port=$($p.port))"
}

Write-Host ""
Write-Host "Frontend : http://localhost:4200"
Write-Host "Backend  : http://localhost:8000"
if ($WithStreamlit) {
    Write-Host "Streamlit: http://localhost:8501"
}
Write-Host ""
Write-Host "To stop all services: .\\stop_project.ps1"
