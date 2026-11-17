$ErrorActionPreference = 'Stop'

$requiredCommands = @('initdb', 'pg_ctl', 'psql')
foreach ($name in $requiredCommands) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required PostgreSQL command is unavailable: $name"
  }
}

$pgBin = Split-Path (Get-Command initdb).Source
$tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$testRoot = Join-Path $tempRoot ("stadium-platform-dbtest-" + [guid]::NewGuid().ToString('N'))
$dataDirectory = Join-Path $testRoot 'data'
$logFile = Join-Path $testRoot 'postgres.log'
$databaseName = 'stadium_phase3_test'
$databaseUser = 'stadium_test'
$portListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$portListener.Start()
$port = $portListener.LocalEndpoint.Port
$portListener.Stop()

function Invoke-CheckedNative([string]$Executable, [string[]]$CommandArgs) {
  & $Executable @CommandArgs
  if ($LASTEXITCODE -ne 0) {
    throw "$Executable failed with exit code $LASTEXITCODE"
  }
}

try {
  New-Item -ItemType Directory -Path $testRoot | Out-Null
  Invoke-CheckedNative (Join-Path $pgBin 'initdb.exe') @(
    '-D', $dataDirectory, '-U', $databaseUser, '--auth=trust', '--no-instructions'
  )
  Invoke-CheckedNative (Join-Path $pgBin 'pg_ctl.exe') @(
    '-D', $dataDirectory,
    '-o', "-h 127.0.0.1 -p $port",
    '-l', $logFile,
    'start'
  )

  $psql = Join-Path $pgBin 'psql.exe'
  $connectionArgs = @('-h', '127.0.0.1', '-p', "$port", '-U', $databaseUser, '-v', 'ON_ERROR_STOP=1')
  Invoke-CheckedNative $psql ($connectionArgs + @('-d', 'postgres', '-c', "CREATE DATABASE $databaseName"))
  Invoke-CheckedNative $psql ($connectionArgs + @('-d', $databaseName, '-f', (Join-Path $PSScriptRoot '..\..\database\000_postgis_compat.sql')))
  Invoke-CheckedNative $psql ($connectionArgs + @('-d', $databaseName, '-f', (Join-Path $PSScriptRoot '..\..\database\schema.sql')))

  $env:STADIUM_TEST_DATABASE_URL = "postgresql://$databaseUser@127.0.0.1:$port/$databaseName"
  Push-Location (Join-Path $PSScriptRoot '..')
  try {
    Invoke-CheckedNative 'npm.cmd' @('run', 'test:integration')
  } finally {
    Pop-Location
    Remove-Item Env:STADIUM_TEST_DATABASE_URL -ErrorAction SilentlyContinue
  }
} finally {
  if (Test-Path $dataDirectory) {
    & (Join-Path $pgBin 'pg_ctl.exe') -D $dataDirectory -m fast stop | Out-Null
  }

  $resolvedRoot = [System.IO.Path]::GetFullPath($testRoot)
  if (
    $resolvedRoot.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
    (Split-Path $resolvedRoot -Leaf) -match '^stadium-platform-dbtest-[0-9a-f]{32}$'
  ) {
    Remove-Item -LiteralPath $resolvedRoot -Recurse -Force
  } else {
    throw 'Refusing to remove a path outside the generated isolated-test directory.'
  }
}
