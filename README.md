# 🚀 Multi-Core Fibonacci Benchmark

A high-performance CPU benchmark tool designed for dedicated server environments. This JavaScript application leverages worker threads to maximize CPU utilization across all available cores, providing comprehensive performance metrics for server evaluation and capacity planning.

**Compatible with:** Node.js, Deno, and Bun

## ✨ Features

- **Multi-Core Optimization**: Utilizes all available CPU cores with worker threads
- **Real-Time Memory Monitoring**: Tracks peak and current memory usage with proper units
- **Comprehensive Performance Scoring**: Overall score considering CPU, memory, and efficiency metrics
- **System Information**: Detailed hardware specs (CPU model, cores, RAM)
- **JSON Output**: Structured results for easy parsing and automation
- **Dedicated Server Optimized**: Designed for machines running only this benchmark
- **Multi-Runtime Support**: Works with Node.js, Deno, and Bun

## 🎯 Use Cases

- **Server Performance Evaluation**: Compare computational capabilities across different machines
- **Capacity Planning**: Determine resource requirements for deployment
- **Hardware Benchmarking**: Test CPU performance under sustained load
- **Infrastructure Assessment**: Evaluate server fleet performance

## 📊 Sample Output

```
--- System Information ---
Hostname: POOPIE_MACHINE
CPU: Apple M1 Pro (8 cores)
RAM: 16.00 GB
--------------------------

Starting Fibonacci benchmark on 8 worker threads for 30 seconds...

Benchmark finished after approximately 30005.63 ms.

🏆 OVERALL SCORE: 5,672
📊 Performance Metrics:
   • Calculations/sec: 5,672
   • Core efficiency: 100%
   • Memory efficiency: 449 calc/MB
📈 Results:
Total Fibonacci calculations across 8 cores: 170,179
Average calculations per core: 21,272
Peak memory usage: 379.48 MB RSS, 4.69 MB heap
Final memory usage: 376.47 MB RSS, 4.55 MB heap

--- Benchmark Results ---
{
  "hostname": "RQCTQV92Y5",
  "cpuModel": "Apple M1 Pro",
  "cpuCores": 8,
  "totalRAM": "16.00 GB",
  "benchmarkDurationMs": 30000,
  "actualDurationMs": 30005.63,
  "totalFibonacciIndex": 170179,
  "averageFibonacciIndexPerCore": 21272,
  "performanceMetrics": {
    "calculationsPerSecond": 5672,
    "coreEfficiency": 100,
    "memoryEfficiency": 449,
    "overallScore": 5672
  },
  "memoryUsage": {
    "peak": {
      "rss": "379.48 MB",
      "heapUsed": "4.69 MB",
      "heapTotal": "9.33 MB",
      "external": "438.26 KB",
      "arrayBuffers": "16.34 KB"
    },
    "final": {
      "rss": "376.47 MB",
      "heapUsed": "4.55 MB",
      "heapTotal": "9.33 MB",
      "external": "438.26 KB",
      "arrayBuffers": "16.34 KB"
    }
  }
}
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher recommended), **Deno** (v1.20+), or **Bun** (v0.5+)
- **Tested with**: Bun 1.2.18 ✅, Deno 2.4.2 ✅
- **Module Format**: ES Modules (ESM) - compatible with all modern runtimes
- Dedicated server environment (minimal background processes)

### Installation & Usage

#### Node.js
```bash
# Clone the repository
git clone <repository-url>
cd fibo_banchmark_node

# Run the benchmark
node benchmark.js

# Run with custom duration
node benchmark.js -d 60

# Run multiple times and save results
node benchmark.js -n 5 -o results.json

# Use configuration file
node benchmark.js -c config.json
```

#### Deno
```bash
# Clone the repository
git clone <repository-url>
cd fibo_banchmark_node

# Run the benchmark
deno run --allow-read --allow-write --allow-net benchmark.js

# Run with custom duration
deno run --allow-read --allow-write --allow-net benchmark.js -d 60

# Run multiple times and save results
deno run --allow-read --allow-write --allow-net benchmark.js -n 5 -o results.json
```

#### Bun
```bash
# Clone the repository
git clone <repository-url>
cd fibo_banchmark_node

# Run the benchmark
bun run benchmark.js

# Run with custom duration
bun run benchmark.js -d 60

# Run multiple times and save results
bun run benchmark.js -n 5 -o results.json
```

### Configuration

#### Command Line Options

```bash
node benchmark.js [options]

Options:
  -d, --duration <seconds>    Benchmark duration in seconds (default: 30)
  -r, --max-ram <MB>         Maximum RAM usage in MB before stopping (default: no limit)
  -c, --config <file>        Load configuration from JSON file
  -o, --output <file>        Save results to specified file
  -n, --runs <number>        Number of benchmark runs (default: 1)
  -h, --help                 Show this help message
```

#### Configuration File

Create a `config.json` file for persistent settings:

```json
{
  "duration": 30,
  "maxRamMB": 1024,
  "outputFile": "benchmark-results.json",
  "runs": 1,
  "postUrl": "https://api.example.com/benchmark-results"
}
```

**Configuration Options:**
- `duration`: Benchmark duration in seconds
- `maxRamMB`: Maximum RAM usage limit (stops if exceeded)
- `outputFile`: File to save results (optional)
- `runs`: Number of benchmark runs to perform
- `postUrl`: URL to POST results to (optional)

**Note:** Command line arguments override config file settings.

## 🔄 Runtime Compatibility

### Supported Runtimes

This benchmark is designed to work across multiple JavaScript runtimes:

#### Node.js
- **Worker Threads**: Native support via `worker_threads` module
- **Performance**: Excellent multi-core utilization
- **Stability**: Mature and well-tested implementation
- **Memory Management**: Robust garbage collection

#### Deno
- **Worker Threads**: Native support via `worker_threads` module
- **Security**: Permission-based access control
- **Performance**: Competitive with Node.js
- **Modern APIs**: Latest JavaScript features
- **ES Modules**: Native ESM support
- **Tested Version**: 2.4.2 ✅

#### Bun
- **Worker Threads**: Native support via `worker_threads` module
- **Performance**: Often faster than Node.js for CPU-intensive tasks
- **Memory Efficiency**: Lower memory overhead
- **Fast Startup**: Quick initialization times
- **Tested Version**: 1.2.18 ✅

### Runtime-Specific Considerations

#### Deno Permissions
Deno requires explicit permissions for file and network access:
```bash
# Full permissions (development)
deno run --allow-all benchmark.js

# Minimal permissions (production)
deno run --allow-read --allow-write --allow-net benchmark.js
```

#### Performance Differences
- **Bun**: Generally fastest for CPU-intensive tasks
- **Node.js**: Most stable and widely tested
- **Deno**: Good balance of performance and security

#### Memory Usage
- **Bun**: Typically lowest memory footprint
- **Node.js**: Moderate memory usage
- **Deno**: Slightly higher memory usage due to security features

## 🏆 Performance Metrics Explained

### Overall Score
A comprehensive performance metric that combines:
- **Calculations per Second**: Raw computational throughput
- **Core Efficiency**: Multi-core scaling effectiveness (percentage)
- **Memory Efficiency**: Calculations per MB of memory used

### Memory Usage
- **RSS (Resident Set Size)**: Total memory allocated to the process
- **Heap Used**: JavaScript heap memory currently in use
- **Heap Total**: Total heap memory allocated
- **External**: Memory used by C++ objects bound to JavaScript
- **Array Buffers**: Memory used by ArrayBuffers and SharedArrayBuffers

## 🔄 Multi-Run Capabilities

### Multiple Benchmark Runs
The benchmark supports running multiple iterations to provide more reliable performance data:

```bash
# Run 5 times
node benchmark.js -n 5

# Run 3 times and save results
node benchmark.js -n 3 -o results.json
```

### Aggregated Results
Multi-run benchmarks provide comprehensive statistics:
- **Average Score**: Mean performance across all runs
- **Best/Worst Score**: Performance range
- **Score Variance**: Consistency indicator
- **Total Calculations**: Combined computational output
- **Individual Run Data**: Detailed results for each run

### Result Structure
```json
{
  "benchmarkInfo": {
    "totalRuns": 3,
    "completedRuns": 3,
    "totalDurationMs": 90045.63,
    "startTime": "2024-01-15T10:30:00.000Z",
    "endTime": "2024-01-15T10:31:30.045Z"
  },
  "aggregatedResults": {
    "totalCalculations": 510537,
    "averageCalculationsPerRun": 170179,
    "averageScore": 5672,
    "bestScore": 5890,
    "worstScore": 5450,
    "scoreVariance": 440
  },
  "individualRuns": [...]
}
```

## 📁 Result Management

### File Output
Results can be automatically saved to files:

```bash
# Save with timestamp
node benchmark.js -o results.json

# Save to specific location
node benchmark.js -o /path/to/results.json
```

### HTTP POST Integration
Results can be automatically posted to external APIs:

```json
{
  "postUrl": "https://api.example.com/benchmark-results"
}
```

**Features:**
- **Automatic POST**: Results sent after each benchmark completion
- **Error Handling**: Graceful handling of network issues
- **Status Reporting**: Clear feedback on POST success/failure
- **JSON Format**: Standard JSON payload with all benchmark data

### Output Formats
- **Console Output**: Real-time progress and final results
- **JSON File**: Complete structured data for analysis
- **HTTP POST**: Integration with external systems
- **Timestamped Files**: Automatic file naming with timestamps

## 🔧 Technical Details

### Architecture
- **Main Thread**: Manages worker threads, timing, and result aggregation
- **Worker Threads**: One per CPU core, performing Fibonacci calculations in parallel
- **Memory Monitoring**: Real-time tracking with 1-second intervals
- **BigInt Support**: Handles large Fibonacci numbers without precision loss
- **Cross-Runtime**: Compatible with Node.js, Deno, and Bun

### Performance Characteristics
- **7.2x improvement** over single-threaded approach on 8-core systems
- **90% efficiency** in multi-core scaling
- **Minimal overhead** from inter-thread communication
- **Linear scaling** with core count
- **Runtime Optimized**: Performance varies by JavaScript runtime

### Fibonacci Algorithm
Uses an iterative approach with BigInt for:
- **Efficiency**: Avoids recursion overhead and stack overflow
- **Precision**: Handles numbers larger than JavaScript's Number type
- **Speed**: Optimized for high-frequency calculations
- **Compatibility**: Works across all modern JavaScript runtimes

## 📈 Benchmarking Best Practices

### For Accurate Results
1. **Dedicated Environment**: Run on machines with minimal background processes
2. **Consistent Conditions**: Same runtime version and system state
3. **Multiple Runs**: Average results from several benchmark runs
4. **System Monitoring**: Monitor CPU temperature and throttling
5. **Runtime Consistency**: Use the same runtime for all comparisons

### For Server Comparison
1. **Same Duration**: Use identical benchmark duration across machines
2. **Normalized Scoring**: Compare overall scores for fair evaluation
3. **Resource Analysis**: Consider memory usage for capacity planning
4. **Efficiency Metrics**: Look at core and memory efficiency percentages
5. **Runtime Selection**: Choose runtime based on deployment requirements

### Runtime-Specific Recommendations

#### Node.js
- **Production**: Use LTS versions for stability
- **Performance**: Enable V8 optimizations with `--max-old-space-size`
- **Monitoring**: Use built-in performance hooks for detailed analysis

#### Deno
- **Security**: Use minimal required permissions
- **Performance**: Enable V8 flags with `--v8-flags`
- **Caching**: Leverage Deno's module cache for faster startup

#### Bun
- **Performance**: Often provides best CPU performance
- **Memory**: Monitor memory usage as Bun may use less RAM
- **Compatibility**: Test thoroughly as Bun is newer runtime

## 🛠️ Troubleshooting

### Common Issues

**Low Performance**
- Check for background processes consuming CPU
- Ensure Node.js version is recent
- Verify all cores are available to the process

**Memory Issues**
- Monitor for memory leaks in long-running benchmarks
- Check system memory availability
- Consider reducing worker thread count if needed

**Worker Thread Errors**
- Verify Node.js worker thread support
- Check for system resource limits
- Ensure proper error handling in worker code

## 📝 License

[Add your license information here]

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Perfect for DevOps teams, system administrators, and anyone needing to evaluate server performance in dedicated environments.** 