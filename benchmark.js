/**
 * Fibonacci Benchmark for Server Performance with Multi-Core Worker Threads
 *
 * This script leverages worker threads to perform CPU-intensive Fibonacci calculations
 * across ALL available CPU cores, maximizing computational performance.
 * It's designed to be run on dedicated servers to gauge their computational performance.
 * The last Fibonacci number computed within the time limit serves as a performance score.
 *
 * Compatible with: Node.js, Deno, and Bun
 *
 * Additionally, it gathers and outputs key system information:
 * - Machine Hostname
 * - CPU Model and Number of Cores
 * - Total RAM
 *
 * Usage:
 * 1. Save this code as a .js file (e.g., `benchmark.js`).
 * 2. Run it from your terminal: `node benchmark.js` (or `deno run` / `bun run`)
 *
 * The script will output the benchmark results and system information,
 * formatted as JSON for easy parsing and compilation into a list.
 */

import os from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

// Get __filename equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);

// Parse command line arguments
function parseArguments() {
    const args = process.argv.slice(2);
    const config = {
        duration: 30, // Default 30 seconds
        maxRamMB: null, // Default no limit
        help: false,
        configFile: null,
        outputFile: null,
        runs: 1 // Default single run
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--help' || arg === '-h') {
            config.help = true;
        } else if (arg === '--config' || arg === '-c') {
            config.configFile = args[i + 1];
            i++; // Skip next argument as it's the value
        } else if (arg === '--duration' || arg === '-d') {
            const value = parseInt(args[i + 1]);
            if (!isNaN(value) && value > 0) {
                config.duration = value;
                i++; // Skip next argument as it's the value
            }
        } else if (arg === '--max-ram' || arg === '-r') {
            const value = parseInt(args[i + 1]);
            if (!isNaN(value) && value > 0) {
                config.maxRamMB = value;
                i++; // Skip next argument as it's the value
            }
        } else if (arg === '--output' || arg === '-o') {
            config.outputFile = args[i + 1];
            i++; // Skip next argument as it's the value
        } else if (arg === '--runs' || arg === '-n') {
            const value = parseInt(args[i + 1]);
            if (!isNaN(value) && value > 0) {
                config.runs = value;
                i++; // Skip next argument as it's the value
            }
        }
    }

    return config;
}

// Load configuration from file
function loadConfigFile(configPath) {
    try {
        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);
        
        // Validate config values
        if (config.duration && typeof config.duration === 'number' && config.duration > 0) {
            return {
                duration: config.duration,
                maxRamMB: config.maxRamMB || null,
                outputFile: config.outputFile || null,
                runs: config.runs || 1,
                postUrl: config.postUrl || null
            };
        }
    } catch (error) {
        console.warn(`Warning: Could not load config file '${configPath}': ${error.message}`);
    }
    return null;
}

// Save results to file
function saveResultsToFile(results, outputFile) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = outputFile || `benchmark-results-${timestamp}.json`;
        
        // If outputFile is specified, use it directly; otherwise create timestamped file
        const filepath = outputFile ? outputFile : path.join(process.cwd(), filename);
        
        fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
        console.log(`📁 Results saved to: ${filepath}`);
        return filepath;
    } catch (error) {
        console.error(`❌ Error saving results to file: ${error.message}`);
        return null;
    }
}

// Post results to URL
async function postResultsToUrl(results, postUrl) {
    return new Promise((resolve) => {
        try {
            const url = new URL(postUrl);
            const isHttps = url.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const postData = JSON.stringify(results);
            
            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'Node.js-Fibonacci-Benchmark/1.0'
                }
            };
            
            const req = client.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(`✅ Results posted to: ${postUrl} (Status: ${res.statusCode})`);
                    } else {
                        console.warn(`⚠️  Posted to ${postUrl} but received status: ${res.statusCode}`);
                    }
                    resolve(true);
                });
            });
            
            req.on('error', (error) => {
                console.error(`❌ Error posting results to ${postUrl}: ${error.message}`);
                resolve(false);
            });
            
            req.write(postData);
            req.end();
            
        } catch (error) {
            console.error(`❌ Error posting results: ${error.message}`);
            resolve(false);
        }
    });
}

// Display help information
function showHelp() {
    console.log(`
🚀 Node.js Multi-Core Fibonacci Benchmark

Usage: node benchmark.js [options]

Options:
  -d, --duration <seconds>    Benchmark duration in seconds (default: 30)
  -r, --max-ram <MB>         Maximum RAM usage in MB before stopping (default: no limit)
  -c, --config <file>        Load configuration from JSON file
  -o, --output <file>        Save results to specified file
  -n, --runs <number>        Number of benchmark runs (default: 1)
  -h, --help                 Show this help message

Examples:
  node benchmark.js                    # Run with default settings
  node benchmark.js -d 60             # Run for 60 seconds
  node benchmark.js --max-ram 1024    # Stop if RAM usage exceeds 1GB
  node benchmark.js -d 45 -r 2048     # Run for 45 seconds, max 2GB RAM
  node benchmark.js -c config.json    # Load settings from config file
  node benchmark.js -o results.json   # Save results to specific file
  node benchmark.js -n 5              # Run benchmark 5 times
  node benchmark.js -n 3 -o results.json # Run 3 times, save to file

Config File Format (config.json):
  {
    "duration": 60,
    "maxRamMB": 1024,
    "outputFile": "results.json",
    "runs": 3,
    "postUrl": "https://api.example.com/benchmark-results"
  }

Note: Command line arguments override config file settings.
This benchmark is designed for dedicated server environments.
`);
}

// Define the duration for the benchmark in milliseconds (configurable)
let BENCHMARK_DURATION_MS = 30 * 1000;
let MAX_RAM_MB = null;

/**
 * Gets current memory usage with proper units
 * @returns {object} Memory usage statistics with units
 */
function getMemoryUsage() {
    const usage = process.memoryUsage();
    
    function formatBytes(bytes) {
        if (bytes >= 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        } else if (bytes >= 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        } else if (bytes >= 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        } else {
            return `${bytes} B`;
        }
    }
    
    return {
        rss: formatBytes(usage.rss),
        heapUsed: formatBytes(usage.heapUsed),
        heapTotal: formatBytes(usage.heapTotal),
        external: formatBytes(usage.external),
        arrayBuffers: formatBytes(usage.arrayBuffers)
    };
}

/**
 * Calculates the nth Fibonacci number iteratively.
 * This approach is efficient for large numbers as it avoids recursion overhead
 * and stack overflow issues. It uses BigInt to handle numbers larger than
 * JavaScript's standard Number type can safely represent.
 * @param {number} n The index of the Fibonacci number to calculate.
 * @returns {BigInt} The nth Fibonacci number.
 */
function calculateFibonacci(n) {
    if (n <= 1) {
        return BigInt(n);
    }

    let a = 0n; // Use BigInt for large numbers
    let b = 1n; // Use BigInt for large numbers

    for (let i = 2; i <= n; i++) {
        let temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}

/**
 * Gathers system information (hostname, CPU, RAM).
 * @returns {object} An object containing system details.
 */
function getSystemInfo() {
    const cpus = os.cpus();
    const totalMemoryBytes = os.totalmem();
    const totalMemoryGB = (totalMemoryBytes / (1024 * 1024 * 1024)).toFixed(2); // Convert bytes to GB

    return {
        hostname: os.hostname(),
        cpu: {
            model: cpus.length > 0 ? cpus[0].model : 'N/A', // Get model from the first CPU
            cores: cpus.length
        },
        ram: `${totalMemoryGB} GB`
    };
}

if (isMainThread) {
    // --- Main Thread Logic ---
    // This part of the script runs in the main thread.
    // It's responsible for gathering system info, spawning multiple workers,
    // managing the benchmark duration, and collecting the final results.

    // Parse command line arguments
    const config = parseArguments();
    
    // Show help if requested
    if (config.help) {
        showHelp();
        process.exit(0);
    }
    
    // Load config file if specified
    let fileConfig = null;
    if (config.configFile) {
        fileConfig = loadConfigFile(config.configFile);
    }
    
    // Merge config: command line arguments override config file
    const finalConfig = {
        duration: config.duration || (fileConfig ? fileConfig.duration : 30),
        maxRamMB: config.maxRamMB !== undefined ? config.maxRamMB : (fileConfig ? fileConfig.maxRamMB : null),
        outputFile: config.outputFile || (fileConfig ? fileConfig.outputFile : null),
        runs: config.runs || (fileConfig ? fileConfig.runs : 1),
        postUrl: fileConfig ? fileConfig.postUrl : null
    };
    
    // Set configuration
    BENCHMARK_DURATION_MS = finalConfig.duration * 1000;
    MAX_RAM_MB = finalConfig.maxRamMB;

    const systemInfo = getSystemInfo();
    const numCores = systemInfo.cpu.cores;
    
    console.log(`\n--- System Information ---`);
    console.log(`Hostname: ${systemInfo.hostname}`);
    console.log(`CPU: ${systemInfo.cpu.model} (${systemInfo.cpu.cores} cores)`);
    console.log(`RAM: ${systemInfo.ram}`);
    console.log(`--------------------------\n`);

    console.log(`Starting Fibonacci benchmark on ${numCores} worker threads for ${BENCHMARK_DURATION_MS / 1000} seconds...`);
    if (MAX_RAM_MB !== null) {
        console.log(`RAM limit: ${MAX_RAM_MB} MB (benchmark will stop if exceeded)`);
    }
    console.log(`Number of runs: ${finalConfig.runs}`);
    console.log(``);

    // Multi-run results collection
    const allRuns = [];
    const startTime = process.hrtime.bigint(); // High-resolution time for precise measurement

    // Function to run a single benchmark
    async function runSingleBenchmark(runNumber) {
        return new Promise((resolve) => {
            console.log(`\n🔄 Starting run ${runNumber}/${finalConfig.runs}...`);
            
            let workers = [];
            let totalFibIndex = 0;
            let maxFibNumber = 0n;
            let activeWorkers = numCores;
            
            // Memory tracking
            let peakMemoryUsage = getMemoryUsage();
            let peakRSSBytes = process.memoryUsage().rss;
            let memoryCheckInterval;

            // Create workers for each CPU core
            for (let i = 0; i < numCores; i++) {
                const worker = new Worker(__filename, {
                    workerData: { 
                        workerId: i,
                        totalWorkers: numCores
                    }
                });

                // Listen for messages from each worker thread
                worker.on('message', (data) => {
                    // Update the total Fibonacci index and track the highest number
                    totalFibIndex += data.fibIndex;
                    const currentFibNumber = BigInt(data.lastFibonacciNumber);
                    if (currentFibNumber > maxFibNumber) {
                        maxFibNumber = currentFibNumber;
                    }
                });

                // Handle any errors that occur in the worker thread
                worker.on('error', (err) => {
                    console.error(`Worker ${i} error:`, err);
                    activeWorkers--;
                });

                // Handle the worker thread exiting
                worker.on('exit', (code) => {
                    activeWorkers--;
                    if (code !== 0) {
                        console.error(`Worker ${i} stopped with exit code ${code}`);
                    }
                });

                workers.push(worker);
            }

            // Start memory monitoring
            memoryCheckInterval = setInterval(() => {
                const currentMemory = process.memoryUsage();
                const currentRSS = currentMemory.rss;
                
                if (MAX_RAM_MB !== null && currentRSS > MAX_RAM_MB * 1024 * 1024) {
                    console.warn(`RAM usage exceeded limit of ${MAX_RAM_MB} MB. Stopping benchmark.`);
                    clearInterval(memoryCheckInterval);
                    workers.forEach(worker => worker.terminate());
                    resolve({ error: 'RAM_LIMIT_EXCEEDED' });
                    return;
                }
                
                if (currentRSS > peakRSSBytes) {
                    peakRSSBytes = currentRSS;
                    peakMemoryUsage = getMemoryUsage();
                }
            }, 1000); // Check every second

            // Set a timeout to stop the benchmark after the defined duration
            const timer = setTimeout(() => {
                // Terminate all worker threads gracefully
                workers.forEach(worker => worker.terminate());
                
                // Stop memory monitoring
                clearInterval(memoryCheckInterval);
                
                const endTime = process.hrtime.bigint();
                const durationNs = endTime - startTime;
                const durationMs = Number(durationNs) / 1_000_000;

                // Calculate average Fibonacci index per worker
                const avgFibIndex = Math.floor(totalFibIndex / numCores);

                // Get final memory usage
                const finalMemoryUsage = getMemoryUsage();

                // Calculate overall performance score
                const calculationsPerSecond = Math.round(totalFibIndex / (durationMs / 1000));
                const coreEfficiency = Math.round((totalFibIndex / numCores) / (totalFibIndex / numCores) * 100);
                const memoryEfficiency = Math.round((totalFibIndex / parseFloat(peakMemoryUsage.rss.split(' ')[0])) * 1000);
                
                const overallScore = Math.round(calculationsPerSecond * (coreEfficiency / 100) * (memoryEfficiency / 1000));

                // Create run result
                const runResult = {
                    runNumber: runNumber,
                    timestamp: new Date().toISOString(),
                    hostname: systemInfo.hostname,
                    cpuModel: systemInfo.cpu.model,
                    cpuCores: systemInfo.cpu.cores,
                    totalRAM: systemInfo.ram,
                    configuration: {
                        benchmarkDurationMs: BENCHMARK_DURATION_MS,
                        maxRamMB: MAX_RAM_MB,
                        actualDurationMs: parseFloat(durationMs.toFixed(2))
                    },
                    totalFibonacciIndex: totalFibIndex,
                    averageFibonacciIndexPerCore: avgFibIndex,
                    lastFibonacciNumber: maxFibNumber.toString(),
                    activeWorkersAtEnd: activeWorkers,
                    performanceMetrics: {
                        calculationsPerSecond: calculationsPerSecond,
                        coreEfficiency: coreEfficiency,
                        memoryEfficiency: memoryEfficiency,
                        overallScore: overallScore
                    },
                    memoryUsage: {
                        peak: peakMemoryUsage,
                        final: finalMemoryUsage
                    }
                };

                console.log(`✅ Run ${runNumber} completed:`);
                console.log(`   • OVERALL Score: ${overallScore.toLocaleString()}`);
                console.log(`  `);
                console.log(`   • Calculations: ${totalFibIndex.toLocaleString()}`);
                console.log(`   • Duration: ${durationMs.toFixed(2)} ms`);
                console.log(`   • Peak Memory: ${peakMemoryUsage.rss}`);

                resolve(runResult);
            }, BENCHMARK_DURATION_MS);
        });
    }

    // Run multiple benchmarks
    async function runAllBenchmarks() {
        for (let run = 1; run <= finalConfig.runs; run++) {
            const runResult = await runSingleBenchmark(run);
            
            if (runResult.error) {
                console.error(`❌ Run ${run} failed: ${runResult.error}`);
                break;
            }
            
            allRuns.push(runResult);
            
            // Add delay between runs (except for the last run)
            if (run < finalConfig.runs) {
                console.log(`⏳ Waiting 2 seconds before next run...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Calculate aggregated results
        const totalDuration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
        const totalCalculations = allRuns.reduce((sum, run) => sum + run.totalFibonacciIndex, 0);
        const avgScore = Math.round(allRuns.reduce((sum, run) => sum + run.performanceMetrics.overallScore, 0) / allRuns.length);
        const bestScore = Math.max(...allRuns.map(run => run.performanceMetrics.overallScore));
        const worstScore = Math.min(...allRuns.map(run => run.performanceMetrics.overallScore));

        // Create comprehensive results object
        const results = {
            benchmarkInfo: {
                totalRuns: finalConfig.runs,
                completedRuns: allRuns.length,
                totalDurationMs: parseFloat(totalDuration.toFixed(2)),
                startTime: new Date(Date.now() - totalDuration).toISOString(),
                endTime: new Date().toISOString()
            },
            systemInfo: {
                hostname: systemInfo.hostname,
                cpuModel: systemInfo.cpu.model,
                cpuCores: systemInfo.cpu.cores,
                totalRAM: systemInfo.ram
            },
            configuration: {
                benchmarkDurationMs: BENCHMARK_DURATION_MS,
                maxRamMB: MAX_RAM_MB,
                outputFile: finalConfig.outputFile,
                postUrl: finalConfig.postUrl
            },
            aggregatedResults: {
                totalCalculations: totalCalculations,
                averageCalculationsPerRun: Math.round(totalCalculations / allRuns.length),
                averageScore: avgScore,
                bestScore: bestScore,
                worstScore: worstScore,
                scoreVariance: Math.round(bestScore - worstScore)
            },
            individualRuns: allRuns
        };

        // Display final results
        console.log(`\n🏆 BENCHMARK COMPLETED`);
        console.log(`📊 Aggregated Results:`);
        console.log(`   • Total Runs: ${finalConfig.runs}`);
        console.log(`   • Completed Runs: ${allRuns.length}`);
        console.log(`   • Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
        console.log(`   • Total Calculations: ${totalCalculations.toLocaleString()}`);
        console.log(`   • Average Score: ${avgScore.toLocaleString()}`);
        console.log(`   • Best Score: ${bestScore.toLocaleString()}`);
        console.log(`   • Worst Score: ${worstScore.toLocaleString()}`);
        console.log(`   • Score Variance: ${(bestScore - worstScore).toLocaleString()}`);

        console.log(`\n--- Complete Benchmark Results ---`);
        console.log(JSON.stringify(results, null, 2));
        console.log(`--------------------------------\n`);

        // Save results to file if specified
        if (finalConfig.outputFile) {
            saveResultsToFile(results, finalConfig.outputFile);
        }

        // Post results to URL if specified
        if (finalConfig.postUrl) {
            await postResultsToUrl(results, finalConfig.postUrl);
        }

        process.exit(0);
    }

    // Start the benchmark runs
    runAllBenchmarks();

} else {
    // --- Worker Thread Logic ---
    // This part of the script runs inside each worker thread.
    // Each worker continuously calculates Fibonacci numbers and reports progress to the main thread.

    const { workerId, totalWorkers } = workerData;
    let fibIndex = 0;
    let lastFibNumber = 0n;
    let localFibIndex = 0; // Track local calculations for this worker

    /**
     * The main loop for each worker thread.
     * It continuously calculates Fibonacci numbers and sends updates to the parent thread.
     * Each worker calculates from small numbers to maximize calculation speed.
     * It uses setImmediate to yield control back to the event loop, allowing messages
     * to be sent and the worker to eventually receive termination signals from the main thread.
     */
    function workerLoop() {
        // Calculate the next Fibonacci number
        // Start from small numbers to maximize calculation speed
        lastFibNumber = calculateFibonacci(fibIndex);
        localFibIndex++;

        // Send the current progress back to the main thread.
        // BigInt must be converted to string before sending via postMessage.
        parentPort.postMessage({
            fibIndex: 1, // Each iteration counts as 1 calculation
            lastFibonacciNumber: lastFibNumber.toString()
        });

        fibIndex++;

        // Schedule the next iteration of the loop.
        // setImmediate ensures that other pending tasks (like receiving termination signals)
        // can be processed, preventing the worker from completely hogging its event loop.
        setImmediate(workerLoop);
    }

    workerLoop(); // Start the worker's calculation loop
}
