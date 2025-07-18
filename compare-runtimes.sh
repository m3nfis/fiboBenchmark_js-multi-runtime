#!/bin/bash

# Multi-Runtime Fibonacci Benchmark Comparison Tool
# Automatically tests Node.js, Deno, and Bun performance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BENCHMARK_DURATION=30
BENCHMARK_RUNS=1
OUTPUT_DIR="./runtime-comparison-$(date +%Y%m%d_%H%M%S)"

# Function to print colored output
print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if a runtime is available
check_runtime() {
    local runtime=$1
    local command=$2
    
    if command -v "$command" &> /dev/null; then
        local version=$($command --version 2>/dev/null | head -n1)
        print_success "$runtime found: $version"
        return 0
    else
        print_warning "$runtime not found"
        return 1
    fi
}

# Function to run benchmark for a specific runtime
run_benchmark() {
    local runtime=$1
    local command=$2
    local output_file="$OUTPUT_DIR/${runtime}_results.json"
    
    print_header "Testing $runtime"
    
    # Create output directory if it doesn't exist
    mkdir -p "$OUTPUT_DIR"
    
    # Run the benchmark
    case $runtime in
        "Node.js")
            node benchmark.js -d $BENCHMARK_DURATION -n $BENCHMARK_RUNS -o "$output_file" 2>&1 | tee "$OUTPUT_DIR/${runtime}_output.log"
            ;;
        "Deno")
            deno run --allow-read --allow-write --allow-net --allow-sys benchmark.js -d $BENCHMARK_DURATION -n $BENCHMARK_RUNS -o "$output_file" 2>&1 | tee "$OUTPUT_DIR/${runtime}_output.log"
            ;;
        "Bun")
            bun run benchmark.js -d $BENCHMARK_DURATION -n $BENCHMARK_RUNS -o "$output_file" 2>&1 | tee "$OUTPUT_DIR/${runtime}_output.log"
            ;;
    esac
    
    # Extract key metrics from the output log
    local overall_score=$(grep "OVERALL Score:" "$OUTPUT_DIR/${runtime}_output.log" | tail -1 | sed 's/.*OVERALL Score: *\([0-9,]*\).*/\1/' | tr -d ',')
    local calculations=$(grep "Calculations:" "$OUTPUT_DIR/${runtime}_output.log" | tail -1 | sed 's/.*Calculations: *\([0-9,]*\).*/\1/' | tr -d ',')
    local duration=$(grep "Duration:" "$OUTPUT_DIR/${runtime}_output.log" | tail -1 | sed 's/.*Duration: *\([0-9.]*\) ms.*/\1/' | tr -d ' ')
    local peak_memory=$(grep "Peak Memory:" "$OUTPUT_DIR/${runtime}_output.log" | tail -1 | sed 's/.*Peak Memory: *\([0-9.]* [A-Z]*\).*/\1/')
    
    # Store results for comparison
    echo "$runtime|$overall_score|$calculations|$duration|$peak_memory" >> "$OUTPUT_DIR/comparison_results.txt"
    
    print_success "$runtime benchmark completed"
}

# Function to display comparison results
display_comparison() {
    print_header "Runtime Performance Comparison"
    
    if [ ! -f "$OUTPUT_DIR/comparison_results.txt" ]; then
        print_error "No comparison results found"
        return 1
    fi
    
    echo -e "${PURPLE}Runtime Comparison Results:${NC}"
    echo -e "${PURPLE}==========================${NC}"
    echo ""
    
    # Create a formatted table
    printf "%-12s | %-15s | %-15s | %-15s | %-15s\n" "Runtime" "Overall Score" "Calculations" "Duration (ms)" "Peak Memory"
    printf "%-12s-|-%-15s-|-%-15s-|-%-15s-|-%-15s\n" "------------" "---------------" "---------------" "---------------" "---------------"
    
    while IFS='|' read -r runtime score calculations duration memory; do
        printf "%-12s | %-15s | %-15s | %-15s | %-15s\n" "$runtime" "$score" "$calculations" "$duration" "$memory"
    done < "$OUTPUT_DIR/comparison_results.txt"
    
    echo ""
    
    # Find the best performer
    local best_score=0
    local best_runtime=""
    
    while IFS='|' read -r runtime score calculations duration memory; do
        if [ "$score" -gt "$best_score" ] 2>/dev/null; then
            best_score=$score
            best_runtime=$runtime
        fi
    done < "$OUTPUT_DIR/comparison_results.txt"
    
    if [ -n "$best_runtime" ]; then
        print_success "🏆 Best Performance: $best_runtime (Score: $best_score)"
    fi
    
    echo ""
    print_info "Detailed results saved to: $OUTPUT_DIR/"
    print_info "Individual runtime outputs: ${OUTPUT_DIR}/*_output.log"
    print_info "JSON results: ${OUTPUT_DIR}/*_results.json"
}

# Function to generate summary report
generate_summary() {
    local summary_file="$OUTPUT_DIR/summary_report.md"
    
    cat > "$summary_file" << EOF
# Runtime Performance Comparison Report

Generated on: $(date)

## Test Configuration
- Benchmark Duration: ${BENCHMARK_DURATION} seconds
- Number of Runs: ${BENCHMARK_RUNS}
- Test Environment: $(uname -s) $(uname -m)

## Results Summary

EOF
    
    while IFS='|' read -r runtime score calculations duration memory; do
        cat >> "$summary_file" << EOF
### $runtime
- **Overall Score**: $score
- **Calculations**: $calculations
- **Duration**: $duration ms
- **Peak Memory**: $memory

EOF
    done < "$OUTPUT_DIR/comparison_results.txt"
    
    cat >> "$summary_file" << EOF

## Recommendations

Based on the benchmark results, consider the following:

1. **Performance**: Choose the runtime with the highest overall score for CPU-intensive tasks
2. **Memory**: Consider memory usage for resource-constrained environments
3. **Stability**: Node.js is the most mature and stable option
4. **Speed**: Bun often provides the fastest execution times
5. **Security**: Deno provides the most secure execution environment

## Files Generated

- \`comparison_results.txt\`: Raw comparison data
- \`*_output.log\`: Detailed output from each runtime
- \`*_results.json\`: Structured JSON results from each runtime
- \`summary_report.md\`: This summary report

EOF
    
    print_success "Summary report generated: $summary_file"
}

# Main execution
main() {
    print_header "Multi-Runtime Fibonacci Benchmark Comparison"
    print_info "This tool will test Node.js, Deno, and Bun performance"
    print_info "Duration: ${BENCHMARK_DURATION} seconds per runtime"
    print_info "Runs: ${BENCHMARK_RUNS} per runtime"
    echo ""
    
    # Check if benchmark.js exists
    if [ ! -f "benchmark.js" ]; then
        print_error "benchmark.js not found in current directory"
        print_info "Please run this script from the directory containing benchmark.js"
        exit 1
    fi
    
    # Initialize results file
    rm -f "$OUTPUT_DIR/comparison_results.txt"
    
    # Check available runtimes
    print_header "Checking Available Runtimes"
    
    local runtimes_found=0
    local nodejs_available=false
    local deno_available=false
    local bun_available=false
    
    if check_runtime "Node.js" "node"; then
        nodejs_available=true
        ((runtimes_found++))
    fi
    
    if check_runtime "Deno" "deno"; then
        deno_available=true
        ((runtimes_found++))
    fi
    
    if check_runtime "Bun" "bun"; then
        bun_available=true
        ((runtimes_found++))
    fi
    
    if [ $runtimes_found -eq 0 ]; then
        print_error "No JavaScript runtimes found!"
        print_info "Please install at least one of: Node.js, Deno, or Bun"
        exit 1
    fi
    
    echo ""
    print_info "Found $runtimes_found runtime(s) available"
    echo ""
    
    # Run benchmarks for available runtimes
    print_header "Running Benchmarks"
    
    if [ "$nodejs_available" = true ]; then
        run_benchmark "Node.js" "node"
        echo ""
    fi
    
    if [ "$deno_available" = true ]; then
        run_benchmark "Deno" "deno"
        echo ""
    fi
    
    if [ "$bun_available" = true ]; then
        run_benchmark "Bun" "bun"
        echo ""
    fi
    
    # Display comparison results
    display_comparison
    
    # Generate summary report
    generate_summary
    
    echo ""
    print_header "Comparison Complete"
    print_success "All benchmarks completed successfully!"
    print_info "Check the $OUTPUT_DIR/ directory for detailed results"
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--duration)
            BENCHMARK_DURATION="$2"
            shift 2
            ;;
        -n|--runs)
            BENCHMARK_RUNS="$2"
            shift 2
            ;;
        -h|--help)
            echo "Multi-Runtime Fibonacci Benchmark Comparison Tool"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -d, --duration SECONDS  Benchmark duration per runtime (default: 30)"
            echo "  -n, --runs COUNT        Number of runs per runtime (default: 1)"
            echo "  -h, --help             Show this help message"
            echo ""
            echo "Example:"
            echo "  $0 -d 60 -n 3  # 60 seconds, 3 runs per runtime"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main 