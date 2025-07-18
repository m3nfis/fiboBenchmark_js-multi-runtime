# Multi-Runtime Fibonacci Benchmark Comparison Tool (PowerShell)
# Automatically tests Node.js, Deno, and Bun performance

param(
    [int]$Duration = 30,
    [int]$Runs = 1,
    [switch]$Help
)

# Configuration
$OutputDir = "./runtime-comparison-$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Function to print colored output
function Write-Header {
    param([string]$Message)
    Write-Host "================================`n$Message`n================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# Function to check if a runtime is available
function Test-Runtime {
    param([string]$Runtime, [string]$Command)
    
    try {
        $version = & $Command --version 2>$null | Select-Object -First 1
        if ($version) {
            Write-Success "$Runtime found: $version"
            return $true
        }
    }
    catch {
        Write-Warning "$Runtime not found"
        return $false
    }
    
    Write-Warning "$Runtime not found"
    return $false
}

# Function to run benchmark for a specific runtime
function Invoke-Benchmark {
    param([string]$Runtime, [string]$Command)
    
    $outputFile = "$OutputDir/${Runtime}_results.json"
    $logFile = "$OutputDir/${Runtime}_output.log"
    
    Write-Header "Testing $Runtime"
    
    # Create output directory if it doesn't exist
    if (!(Test-Path $OutputDir)) {
        New-Item -ItemType Directory -Path $OutputDir | Out-Null
    }
    
    # Run the benchmark
    $arguments = @()
    switch ($Runtime) {
        "Node.js" {
            $arguments = @("benchmark.js", "-d", $Duration, "-n", $Runs, "-o", $outputFile)
            $process = Start-Process -FilePath "node" -ArgumentList $arguments -Wait -PassThru -RedirectStandardOutput $logFile -RedirectStandardError $logFile
        }
        "Deno" {
            $arguments = @("run", "--allow-read", "--allow-write", "--allow-net", "--allow-sys", "benchmark.js", "-d", $Duration, "-n", $Runs, "-o", $outputFile)
            $process = Start-Process -FilePath "deno" -ArgumentList $arguments -Wait -PassThru -RedirectStandardOutput $logFile -RedirectStandardError $logFile
        }
        "Bun" {
            $arguments = @("run", "benchmark.js", "-d", $Duration, "-n", $Runs, "-o", $outputFile)
            $process = Start-Process -FilePath "bun" -ArgumentList $arguments -Wait -PassThru -RedirectStandardOutput $logFile -RedirectStandardError $logFile
        }
    }
    
    # Display the output
    if (Test-Path $logFile) {
        Get-Content $logFile | Write-Host
    }
    
    # Extract key metrics from the output log
    if (Test-Path $logFile) {
        $content = Get-Content $logFile -Raw
        
        $overallScore = [regex]::Match($content, "OVERALL Score:\s*([0-9,]+)").Groups[1].Value -replace ',', ''
        $calculations = [regex]::Match($content, "Calculations:\s*([0-9,]+)").Groups[1].Value -replace ',', ''
        $duration = [regex]::Match($content, "Duration:\s*([0-9.]+)\s*ms").Groups[1].Value
        $peakMemory = [regex]::Match($content, "Peak Memory:\s*([0-9.]+ [A-Z]+)").Groups[1].Value
        
        # Store results for comparison
        "$Runtime|$overallScore|$calculations|$duration|$peakMemory" | Out-File -FilePath "$OutputDir/comparison_results.txt" -Append -Encoding UTF8
    }
    
    Write-Success "$Runtime benchmark completed"
}

# Function to display comparison results
function Show-Comparison {
    Write-Header "Runtime Performance Comparison"
    
    if (!(Test-Path "$OutputDir/comparison_results.txt")) {
        Write-Error "No comparison results found"
        return
    }
    
    Write-Host "Runtime Comparison Results:" -ForegroundColor Magenta
    Write-Host "==========================" -ForegroundColor Magenta
    Write-Host ""
    
    # Create a formatted table
    Write-Host ("{0,-12} | {1,-15} | {2,-15} | {3,-15} | {4,-15}" -f "Runtime", "Overall Score", "Calculations", "Duration (ms)", "Peak Memory")
    Write-Host ("{0,-12}-|-{1,-15}-|-{2,-15}-|-{3,-15}-|-{4,-15}" -f "------------", "---------------", "---------------", "---------------", "---------------")
    
    $results = Get-Content "$OutputDir/comparison_results.txt"
    $bestScore = 0
    $bestRuntime = ""
    
    foreach ($line in $results) {
        $parts = $line -split '\|'
        if ($parts.Length -eq 5) {
            $runtime, $score, $calculations, $duration, $memory = $parts
            Write-Host ("{0,-12} | {1,-15} | {2,-15} | {3,-15} | {4,-15}" -f $runtime, $score, $calculations, $duration, $memory)
            
            if ([int]$score -gt $bestScore) {
                $bestScore = [int]$score
                $bestRuntime = $runtime
            }
        }
    }
    
    Write-Host ""
    if ($bestRuntime) {
        Write-Success "🏆 Best Performance: $bestRuntime (Score: $bestScore)"
    }
    
    Write-Host ""
    Write-Info "Detailed results saved to: $OutputDir/"
    Write-Info "Individual runtime outputs: $OutputDir/*_output.log"
    Write-Info "JSON results: $OutputDir/*_results.json"
}

# Function to generate summary report
function New-SummaryReport {
    $summaryFile = "$OutputDir/summary_report.md"
    
    $content = @"
# Runtime Performance Comparison Report

Generated on: $(Get-Date)

## Test Configuration
- Benchmark Duration: $Duration seconds
- Number of Runs: $Runs
- Test Environment: $env:OS $env:PROCESSOR_ARCHITECTURE

## Results Summary

"@
    
    if (Test-Path "$OutputDir/comparison_results.txt") {
        $results = Get-Content "$OutputDir/comparison_results.txt"
        foreach ($line in $results) {
            $parts = $line -split '\|'
            if ($parts.Length -eq 5) {
                $runtime, $score, $calculations, $duration, $memory = $parts
                $content += @"

### $runtime
- **Overall Score**: $score
- **Calculations**: $calculations
- **Duration**: $duration ms
- **Peak Memory**: $memory

"@
            }
        }
    }
    
    $content += @"

## Recommendations

Based on the benchmark results, consider the following:

1. **Performance**: Choose the runtime with the highest overall score for CPU-intensive tasks
2. **Memory**: Consider memory usage for resource-constrained environments
3. **Stability**: Node.js is the most mature and stable option
4. **Speed**: Bun often provides the fastest execution times
5. **Security**: Deno provides the most secure execution environment

## Files Generated

- `comparison_results.txt`: Raw comparison data
- `*_output.log`: Detailed output from each runtime
- `*_results.json`: Structured JSON results from each runtime
- `summary_report.md`: This summary report

"@
    
    $content | Out-File -FilePath $summaryFile -Encoding UTF8
    Write-Success "Summary report generated: $summaryFile"
}

# Main execution
function Main {
    if ($Help) {
        Write-Host "Multi-Runtime Fibonacci Benchmark Comparison Tool"
        Write-Host ""
        Write-Host "Usage: .\compare-runtimes.ps1 [OPTIONS]"
        Write-Host ""
        Write-Host "Options:"
        Write-Host "  -Duration SECONDS  Benchmark duration per runtime (default: 30)"
        Write-Host "  -Runs COUNT        Number of runs per runtime (default: 1)"
        Write-Host "  -Help              Show this help message"
        Write-Host ""
        Write-Host "Example:"
        Write-Host "  .\compare-runtimes.ps1 -Duration 60 -Runs 3  # 60 seconds, 3 runs per runtime"
        return
    }
    
    Write-Header "Multi-Runtime Fibonacci Benchmark Comparison"
    Write-Info "This tool will test Node.js, Deno, and Bun performance"
    Write-Info "Duration: $Duration seconds per runtime"
    Write-Info "Runs: $Runs per runtime"
    Write-Host ""
    
    # Check if benchmark.js exists
    if (!(Test-Path "benchmark.js")) {
        Write-Error "benchmark.js not found in current directory"
        Write-Info "Please run this script from the directory containing benchmark.js"
        return
    }
    
    # Remove existing results file
    if (Test-Path "$OutputDir/comparison_results.txt") {
        Remove-Item "$OutputDir/comparison_results.txt" -Force
    }
    
    # Check available runtimes
    Write-Header "Checking Available Runtimes"
    
    $runtimesFound = 0
    $nodejsAvailable = $false
    $denoAvailable = $false
    $bunAvailable = $false
    
    if (Test-Runtime "Node.js" "node") {
        $nodejsAvailable = $true
        $runtimesFound++
    }
    
    if (Test-Runtime "Deno" "deno") {
        $denoAvailable = $true
        $runtimesFound++
    }
    
    if (Test-Runtime "Bun" "bun") {
        $bunAvailable = $true
        $runtimesFound++
    }
    
    if ($runtimesFound -eq 0) {
        Write-Error "No JavaScript runtimes found!"
        Write-Info "Please install at least one of: Node.js, Deno, or Bun"
        return
    }
    
    Write-Host ""
    Write-Info "Found $runtimesFound runtime(s) available"
    Write-Host ""
    
    # Run benchmarks for available runtimes
    Write-Header "Running Benchmarks"
    
    if ($nodejsAvailable) {
        Invoke-Benchmark "Node.js" "node"
        Write-Host ""
    }
    
    if ($denoAvailable) {
        Invoke-Benchmark "Deno" "deno"
        Write-Host ""
    }
    
    if ($bunAvailable) {
        Invoke-Benchmark "Bun" "bun"
        Write-Host ""
    }
    
    # Display comparison results
    Show-Comparison
    
    # Generate summary report
    New-SummaryReport
    
    Write-Host ""
    Write-Header "Comparison Complete"
    Write-Success "All benchmarks completed successfully!"
    Write-Info "Check the $OutputDir/ directory for detailed results"
}

# Run main function
Main 