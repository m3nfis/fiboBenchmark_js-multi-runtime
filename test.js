#!/usr/bin/env node

/**
 * Test Suite for Fibonacci Benchmark
 * Tests all command-line options and functionality
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_TIMEOUT = 60000; // 60 seconds
const BENCHMARK_SCRIPT = path.join(__dirname, 'benchmark.js');

// Test results
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

// Colors for output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
    const icon = status === 'PASS' ? '✅' : '❌';
    const color = status === 'PASS' ? 'green' : 'red';
    log(`${icon} ${name}: ${status}`, color);
    if (details) {
        log(`   ${details}`, 'yellow');
    }
}

// Helper function to run benchmark with options
function runBenchmark(options = [], timeout = 10000) {
    return new Promise((resolve, reject) => {
        const args = [BENCHMARK_SCRIPT, ...options];
        const child = spawn('node', args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: timeout
        });

        let stdout = '';
        let stderr = '';
        let exitCode = null;

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            exitCode = code;
            resolve({ stdout, stderr, exitCode });
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

// Test functions
async function testHelpOption() {
    testResults.total++;
    try {
        const result = await runBenchmark(['--help']);
        
        if (result.exitCode === 0 && 
            result.stdout.includes('Usage: node benchmark.js [options]') &&
            result.stdout.includes('--help') &&
            result.stdout.includes('--duration')) {
            logTest('Help Option', 'PASS');
            testResults.passed++;
        } else {
            logTest('Help Option', 'FAIL', 'Help output not found or incorrect');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Help Option', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testShortHelpOption() {
    testResults.total++;
    try {
        const result = await runBenchmark(['-h']);
        
        if (result.exitCode === 0 && 
            result.stdout.includes('Usage: node benchmark.js [options]')) {
            logTest('Short Help Option (-h)', 'PASS');
            testResults.passed++;
        } else {
            logTest('Short Help Option (-h)', 'FAIL', 'Help output not found');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Short Help Option (-h)', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testDurationOption() {
    testResults.total++;
    try {
        const result = await runBenchmark(['-d', '5']);
        
        if (result.exitCode === 0 && 
            result.stdout.includes('Starting Fibonacci benchmark') &&
            result.stdout.includes('5 seconds')) {
            logTest('Duration Option (-d)', 'PASS');
            testResults.passed++;
        } else {
            logTest('Duration Option (-d)', 'FAIL', 'Duration not set correctly');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Duration Option (-d)', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testLongDurationOption() {
    testResults.total++;
    try {
        const result = await runBenchmark(['--duration', '3']);
        
        if (result.exitCode === 0 && 
            result.stdout.includes('Starting Fibonacci benchmark') &&
            result.stdout.includes('3 seconds')) {
            logTest('Long Duration Option (--duration)', 'PASS');
            testResults.passed++;
        } else {
            logTest('Long Duration Option (--duration)', 'FAIL', 'Duration not set correctly');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Long Duration Option (--duration)', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testRunsOption() {
    testResults.total++;
    try {
        const result = await runBenchmark(['-n', '2', '-d', '2']);
        
        if (result.exitCode === 0 && 
            result.stdout.includes('Number of runs: 2') &&
            result.stdout.includes('Starting run 1/2') &&
            result.stdout.includes('Starting run 2/2')) {
            logTest('Runs Option (-n)', 'PASS');
            testResults.passed++;
        } else {
            logTest('Runs Option (-n)', 'FAIL', 'Multiple runs not executed');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Runs Option (-n)', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testLongRunsOption() {
    testResults.total++;
    try {
        const result = await runBenchmark(['--runs', '2', '-d', '2']);
        
        if (result.exitCode === 0 && 
            result.stdout.includes('Number of runs: 2')) {
            logTest('Long Runs Option (--runs)', 'PASS');
            testResults.passed++;
        } else {
            logTest('Long Runs Option (--runs)', 'FAIL', 'Multiple runs not executed');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Long Runs Option (--runs)', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testOutputOption() {
    testResults.total++;
    const outputFile = 'test-output.json';
    
    try {
        const result = await runBenchmark(['-o', outputFile, '-d', '2']);
        
        if (result.exitCode === 0 && 
            result.stdout.includes('Results saved to:') &&
            fs.existsSync(outputFile)) {
            
            // Verify the output file contains valid JSON
            const content = fs.readFileSync(outputFile, 'utf8');
            JSON.parse(content); // This will throw if invalid JSON
            
            // Clean up
            fs.unlinkSync(outputFile);
            
            logTest('Output Option (-o)', 'PASS');
            testResults.passed++;
        } else {
            logTest('Output Option (-o)', 'FAIL', 'Output file not created or not mentioned');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Output Option (-o)', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testLongOutputOption() {
    testResults.total++;
    const outputFile = 'test-output-long.json';
    
    try {
        const result = await runBenchmark(['--output', outputFile, '-d', '2']);
        
        if (result.exitCode === 0 && 
            result.stdout.includes('Results saved to:') &&
            fs.existsSync(outputFile)) {
            
            // Clean up
            fs.unlinkSync(outputFile);
            
            logTest('Long Output Option (--output)', 'PASS');
            testResults.passed++;
        } else {
            logTest('Long Output Option (--output)', 'FAIL', 'Output file not created');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Long Output Option (--output)', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testMaxRamOption() {
    testResults.total++;
    try {
        const result = await runBenchmark(['-r', '100', '-d', '2']);
        
        if (result.exitCode === 0 && 
            result.stdout.includes('RAM limit: 100 MB')) {
            logTest('Max RAM Option (-r)', 'PASS');
            testResults.passed++;
        } else {
            logTest('Max RAM Option (-r)', 'FAIL', 'RAM limit not set correctly');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Max RAM Option (-r)', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testLongMaxRamOption() {
    testResults.total++;
    try {
        const result = await runBenchmark(['--max-ram', '200', '-d', '2']);
        
        if (result.exitCode === 0 && 
            result.stdout.includes('RAM limit: 200 MB')) {
            logTest('Long Max RAM Option (--max-ram)', 'PASS');
            testResults.passed++;
        } else {
            logTest('Long Max RAM Option (--max-ram)', 'FAIL', 'RAM limit not set correctly');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Long Max RAM Option (--max-ram)', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testConfigFileOption() {
    testResults.total++;
    const configFile = 'test-config.json';
    
    try {
        // Create a test config file
        const config = {
            duration: 3,
            maxRamMB: 500,
            runs: 1,
            outputFile: 'test-config-output.json'
        };
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
        
        const result = await runBenchmark(['-c', configFile]);
        
        if (result.exitCode === 0 && 
            result.stdout.includes('Starting Fibonacci benchmark') &&
            result.stdout.includes('3 seconds')) {
            
            // Clean up
            fs.unlinkSync(configFile);
            if (fs.existsSync('test-config-output.json')) {
                fs.unlinkSync('test-config-output.json');
            }
            
            logTest('Config File Option (-c)', 'PASS');
            testResults.passed++;
        } else {
            logTest('Config File Option (-c)', 'FAIL', 'Config file not loaded correctly');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Config File Option (-c)', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testLongConfigFileOption() {
    testResults.total++;
    const configFile = 'test-config-long.json';
    
    try {
        // Create a test config file
        const config = {
            duration: 2,
            runs: 1
        };
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
        
        const result = await runBenchmark(['--config', configFile]);
        
        if (result.exitCode === 0 && 
            result.stdout.includes('Starting Fibonacci benchmark') &&
            result.stdout.includes('2 seconds')) {
            
            // Clean up
            fs.unlinkSync(configFile);
            
            logTest('Long Config File Option (--config)', 'PASS');
            testResults.passed++;
        } else {
            logTest('Long Config File Option (--config)', 'FAIL', 'Config file not loaded correctly');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Long Config File Option (--config)', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testInvalidConfigFile() {
    testResults.total++;
    const configFile = 'test-invalid-config.json';
    
    try {
        // Create an invalid config file
        fs.writeFileSync(configFile, 'invalid json content');
        
        const result = await runBenchmark(['-c', configFile, '-d', '1']);
        
        if (result.exitCode === 0 && 
            result.stdout.includes('Warning: Could not load config file')) {
            
            // Clean up
            fs.unlinkSync(configFile);
            
            logTest('Invalid Config File Handling', 'PASS');
            testResults.passed++;
        } else {
            logTest('Invalid Config File Handling', 'FAIL', 'Invalid config not handled gracefully');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Invalid Config File Handling', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testCombinedOptions() {
    testResults.total++;
    const outputFile = 'test-combined-output.json';
    
    try {
        const result = await runBenchmark(['-d', '2', '-n', '2', '-o', outputFile]);
        
        if (result.exitCode === 0 && 
            result.stdout.includes('Starting Fibonacci benchmark') &&
            result.stdout.includes('2 seconds') &&
            result.stdout.includes('Number of runs: 2') &&
            result.stdout.includes('Results saved to:') &&
            fs.existsSync(outputFile)) {
            
            // Clean up
            fs.unlinkSync(outputFile);
            
            logTest('Combined Options', 'PASS');
            testResults.passed++;
        } else {
            logTest('Combined Options', 'FAIL', 'Combined options not working correctly');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Combined Options', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testDefaultBehavior() {
    testResults.total++;
    try {
        const result = await runBenchmark([], 35000); // 35 second timeout for 30 second benchmark
        
        if (result.exitCode === 0 && 
            result.stdout.includes('Starting Fibonacci benchmark') &&
            result.stdout.includes('30 seconds') &&
            result.stdout.includes('Number of runs: 1') &&
            result.stdout.includes('BENCHMARK COMPLETED')) {
            logTest('Default Behavior', 'PASS');
            testResults.passed++;
        } else {
            logTest('Default Behavior', 'FAIL', 'Default behavior not working correctly');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Default Behavior', 'FAIL', error.message);
        testResults.failed++;
    }
}

async function testInvalidOptions() {
    testResults.total++;
    try {
        const result = await runBenchmark(['--invalid-option'], 35000); // 35 second timeout for 30 second benchmark
        
        // Should still run with defaults even with invalid options
        if (result.exitCode === 0 && 
            result.stdout.includes('Starting Fibonacci benchmark')) {
            logTest('Invalid Options Handling', 'PASS');
            testResults.passed++;
        } else {
            logTest('Invalid Options Handling', 'FAIL', 'Invalid options not handled gracefully');
            testResults.failed++;
        }
    } catch (error) {
        logTest('Invalid Options Handling', 'FAIL', error.message);
        testResults.failed++;
    }
}

// Main test runner
async function runTests() {
    log('\n🧪 Starting Fibonacci Benchmark Test Suite\n', 'cyan');
    
    const tests = [
        testHelpOption,
        testShortHelpOption,
        testDurationOption,
        testLongDurationOption,
        testRunsOption,
        testLongRunsOption,
        testOutputOption,
        testLongOutputOption,
        testMaxRamOption,
        testLongMaxRamOption,
        testConfigFileOption,
        testLongConfigFileOption,
        testInvalidConfigFile,
        testCombinedOptions,
        testDefaultBehavior,
        testInvalidOptions
    ];
    
    for (const test of tests) {
        try {
            await test();
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            logTest(test.name, 'FAIL', `Test runner error: ${error.message}`);
            testResults.failed++;
        }
    }
    
    // Print summary
    log('\n📊 Test Results Summary', 'cyan');
    log('=' * 50, 'cyan');
    log(`Total Tests: ${testResults.total}`, 'white');
    log(`Passed: ${testResults.passed}`, 'green');
    log(`Failed: ${testResults.failed}`, 'red');
    
    if (testResults.failed === 0) {
        log('\n🎉 All tests passed!', 'green');
        process.exit(0);
    } else {
        log('\n❌ Some tests failed!', 'red');
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(error => {
        log(`\n💥 Test suite failed to run: ${error.message}`, 'red');
        process.exit(1);
    });
} 