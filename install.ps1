# Fibonacci Benchmark Installer for Windows
# Compatible with Node.js, Deno, and Bun

param(
    [string]$InstallDir = "$env:USERPROFILE\.fibonacci-benchmark"
)

# Configuration
$BENCHMARK_URL = "https://raw.githubusercontent.com/m3nfis/fiboBenchmark_js-multi-runtime/main/benchmark.js"
$CONFIG_URL = "https://raw.githubusercontent.com/m3nfis/fiboBenchmark_js-multi-runtime/main/config.json"
$PACKAGE_URL = "https://raw.githubusercontent.com/m3nfis/fiboBenchmark_js-multi-runtime/main/package.json"
$README_URL = "https://raw.githubusercontent.com/m3nfis/fiboBenchmark_js-multi-runtime/main/README.md"

# Installation directories
$BIN_DIR = Join-Path $InstallDir "bin"
$EXE = Join-Path $BIN_DIR "fibonacci-benchmark.ps1"

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "error: $Message" "Red"
    exit 1
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput $Message "Gray"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput $Message "Green"
}

# Check if PowerShell version is sufficient
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Error "PowerShell 5.0 or higher is required"
}

# Check if Invoke-WebRequest is available
try {
    Invoke-WebRequest -Uri "https://httpbin.org/get" -UseBasicParsing -TimeoutSec 5 | Out-Null
} catch {
    Write-Error "Internet connection required to install fibonacci-benchmark"
}

Write-Info "Installing Fibonacci Benchmark..."

# Create installation directory
if (!(Test-Path $BIN_DIR)) {
    New-Item -ItemType Directory -Path $BIN_DIR -Force | Out-Null
}

# Download files
Write-Info "Downloading benchmark files..."

try {
    # Download benchmark.js
    Invoke-WebRequest -Uri $BENCHMARK_URL -OutFile (Join-Path $BIN_DIR "benchmark.js") -UseBasicParsing
    
    # Download config.json
    Invoke-WebRequest -Uri $CONFIG_URL -OutFile (Join-Path $BIN_DIR "config.json") -UseBasicParsing
    
    # Download package.json
    Invoke-WebRequest -Uri $PACKAGE_URL -OutFile (Join-Path $BIN_DIR "package.json") -UseBasicParsing
    
    # Download README.md
    Invoke-WebRequest -Uri $README_URL -OutFile (Join-Path $BIN_DIR "README.md") -UseBasicParsing
} catch {
    Write-Error "Failed to download benchmark files: $($_.Exception.Message)"
}

# Create PowerShell executable wrapper
$PowerShellScript = @'
# Fibonacci Benchmark Runner for Windows
# Compatible with Node.js, Deno, and Bun

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$BENCHMARK_SCRIPT = Join-Path $SCRIPT_DIR "benchmark.js"

# Function to detect available runtime
function Get-JavaScriptRuntime {
    if (Get-Command bun -ErrorAction SilentlyContinue) {
        return "bun"
    } elseif (Get-Command deno -ErrorAction SilentlyContinue) {
        return "deno"
    } elseif (Get-Command node -ErrorAction SilentlyContinue) {
        return "node"
    } else {
        return "none"
    }
}

# Function to run benchmark with detected runtime
function Start-Benchmark {
    param(
        [string]$Runtime,
        [string[]]$Args
    )
    
    switch ($Runtime) {
        "bun" {
            & bun run $BENCHMARK_SCRIPT @Args
        }
        "deno" {
            & deno run --allow-read --allow-write --allow-net $BENCHMARK_SCRIPT @Args
        }
        "node" {
            & node $BENCHMARK_SCRIPT @Args
        }
        default {
            Write-Error "No compatible JavaScript runtime found. Please install Node.js, Deno, or Bun."
        }
    }
}

# Main execution
$RUNTIME = Get-JavaScriptRuntime
if ($RUNTIME -eq "none") {
    Write-Host "❌ No JavaScript runtime detected!" -ForegroundColor Red
    Write-Host "Please install one of the following:" -ForegroundColor Yellow
    Write-Host "  • Node.js: https://nodejs.org/" -ForegroundColor Cyan
    Write-Host "  • Deno: https://deno.land/" -ForegroundColor Cyan
    Write-Host "  • Bun: https://bun.sh/" -ForegroundColor Cyan
    exit 1
}

Write-Host "🚀 Running Fibonacci Benchmark with $RUNTIME..." -ForegroundColor Green
Start-Benchmark -Runtime $RUNTIME -Args $Arguments
'@

# Save the PowerShell script
$PowerShellScript | Out-File -FilePath $EXE -Encoding UTF8

# Create batch file wrapper for easier execution
$BatchScript = @"
@echo off
powershell.exe -ExecutionPolicy Bypass -File "$EXE" %*
"@

$BatchFile = Join-Path $BIN_DIR "fibonacci-benchmark.bat"
$BatchScript | Out-File -FilePath $BatchFile -Encoding ASCII

Write-Success "Fibonacci Benchmark was installed successfully to $EXE"

# Add to PATH
$CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($CurrentPath -notlike "*$BIN_DIR*") {
    $NewPath = "$CurrentPath;$BIN_DIR"
    [Environment]::SetEnvironmentVariable("PATH", $NewPath, "User")
    Write-Info "Added $BIN_DIR to PATH"
    Write-Info "You may need to restart your terminal for PATH changes to take effect"
} else {
    Write-Info "Fibonacci Benchmark is already in PATH"
}

Write-Host ""
Write-Info "To get started, run:"
Write-Host "  fibonacci-benchmark --help" -ForegroundColor Green
Write-Host ""
Write-Info "Or use the PowerShell command:"
Write-Host "  fibonacci-benchmark.ps1 --help" -ForegroundColor Green 