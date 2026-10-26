param(
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Join-Path $projectRoot 'backend'
$frontendRoot = Join-Path $projectRoot 'frontend'
$node = (Get-Command node.exe -ErrorAction Stop).Source

function Get-FreeLocalPort {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    try {
        $listener.Start()
        return ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
    }
    finally {
        $listener.Stop()
    }
}

function Wait-ForHttp {
    param(
        [string]$Url,
        [System.Diagnostics.Process]$Process,
        [string]$ServiceName
    )

    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        if ($Process.HasExited) {
            throw "$ServiceName exited during startup (exit code $($Process.ExitCode))."
        }

        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                return
            }
        }
        catch {
            Start-Sleep -Milliseconds 500
        }
    }

    throw "$ServiceName did not respond at $Url within 20 seconds."
}

if (-not (Test-Path (Join-Path $backendRoot 'src\server.js'))) {
    throw "Backend entrypoint not found under $backendRoot."
}
if (-not (Test-Path (Join-Path $frontendRoot 'node_modules\vite\bin\vite.js'))) {
    throw "Vite is not installed. Run 'npm install' in $frontendRoot and try again."
}

$backendPort = Get-FreeLocalPort
$frontendPort = Get-FreeLocalPort
while ($frontendPort -eq $backendPort) {
    $frontendPort = Get-FreeLocalPort
}

$env:SERVER_PORT = "$backendPort"
$env:VITE_API_PROXY_TARGET = "http://127.0.0.1:$backendPort"

$backendEnvPath = Join-Path $backendRoot '.env'
if (Test-Path $backendEnvPath) {
    $mongoSetting = Get-Content $backendEnvPath |
        Where-Object { $_ -match '^\s*MONGO_URI\s*=' } |
        Select-Object -First 1
    if ($mongoSetting -match '^\s*MONGO_URI\s*=\s*(.*?)\s*$') {
        $mongoUri = $matches[1].Trim()
        if ($mongoUri.Length -ge 2 -and $mongoUri[0] -eq $mongoUri[$mongoUri.Length - 1] -and $mongoUri[0] -in @('"', "'")) {
            $mongoUri = $mongoUri.Substring(1, $mongoUri.Length - 2)
        }
        if ($mongoUri) {
            $env:MONGO_URI = $mongoUri
        }
    }
}

$backendProcess = Start-Process -FilePath $node `
    -ArgumentList 'src/server.js' `
    -WorkingDirectory $backendRoot `
    -PassThru

$frontendProcess = Start-Process -FilePath $node `
    -ArgumentList @(
        'node_modules/vite/bin/vite.js',
        '--host=127.0.0.1',
        "--port=$frontendPort",
        '--strictPort'
    ) `
    -WorkingDirectory $frontendRoot `
    -PassThru

$frontendUrl = "http://127.0.0.1:$frontendPort/"
$backendUrl = "http://127.0.0.1:$backendPort/"

try {
    Wait-ForHttp -Url $backendUrl -Process $backendProcess -ServiceName 'Backend'
    Wait-ForHttp -Url $frontendUrl -Process $frontendProcess -ServiceName 'Frontend'
}
catch {
    if (-not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue
    }
    if (-not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue
    }
    throw
}

Write-Host ''
Write-Host 'SENTINEL AI is running.'
Write-Host "Application: $frontendUrl"
Write-Host "Backend API: $backendUrl"
Write-Host "Backend PID: $($backendProcess.Id)"
Write-Host "Frontend PID: $($frontendProcess.Id)"
Write-Host 'Close the two Node.js console windows to stop the services.'
Write-Host 'MongoDB must be running locally at mongodb://127.0.0.1:27017 for database-backed features.'

if (-not $NoBrowser) {
    Start-Process $frontendUrl
}
