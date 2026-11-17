Write-Output "=== SYSTEM INFO ==="
Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, OSArchitecture, TotalVisibleMemorySize, FreePhysicalMemory | Format-List
Get-PSDrive -PSProvider FileSystem | Select-Object Name, Used, Free | Format-Table

Write-Output "=== VIRTUALIZATION AND WSL ==="
try { wsl --status } catch { $_ }
try { wsl -l -v } catch { $_ }

Write-Output "=== DEVELOPER TOOLS ==="
try { Write-Output "Node: $(node -v)" } catch { Write-Output "Node: missing" }
try { Write-Output "npm: $(npm -v)" } catch { Write-Output "npm: missing" }
try { Write-Output "Git: $(git --version)" } catch { Write-Output "Git: missing" }
try { Write-Output "Docker: $(docker --version)" } catch { Write-Output "Docker: missing" }
try { Write-Output "Docker Compose: $(docker compose version)" } catch { Write-Output "Docker Compose: missing" }
try { docker ps } catch { Write-Output "Docker daemon error: $_" }
try { Write-Output "Flutter: $(flutter --version)" } catch { Write-Output "Flutter: missing" }
try { Write-Output "Dart: $(dart --version)" } catch { Write-Output "Dart: missing" }
try { Write-Output "Java: $(java -version 2>&1)" } catch { Write-Output "Java: missing" }
try { Write-Output "VS Code: $(code --version 2>&1)" } catch { Write-Output "VS Code: missing" }

Write-Output "=== ANDROID SDK ==="
if (Test-Path "$env:LOCALAPPDATA\Android\Sdk") {
    Write-Output "Android SDK found at $env:LOCALAPPDATA\Android\Sdk"
} else {
    Write-Output "Android SDK not found in standard user location"
}

Write-Output "=== PORT AVAILABILITY ==="
Get-NetTCPConnection -LocalPort 5432,6379,3000,3001,5173,80,443 -ErrorAction SilentlyContinue | Select-Object LocalPort, State, OwningProcess | Format-Table

Write-Output "=== WORKSPACE SUBDIRECTORIES ==="
@('backend', 'admin', 'mobile', 'database', 'docs') | ForEach-Object {
    if (Test-Path $_) {
        $files = (Get-ChildItem -Path $_ -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
        Write-Output "$_ : $files files"
    } else {
        Write-Output "$_ : does not exist"
    }
}
