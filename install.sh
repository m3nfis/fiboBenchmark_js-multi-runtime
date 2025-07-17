#!/usr/bin/env bash
set -euo pipefail

# Colors for output
Color_Off=''
Red=''
Green=''
Dim=''
Bold_White=''
Bold_Green=''

if [[ -t 1 ]]; then
    Color_Off='\033[0m'
    Red='\033[0;31m'
    Green='\033[0;32m'
    Dim='\033[0;2m'
    Bold_White='\033[1m'
    Bold_Green='\033[1;32m'
fi

error() {
    echo -e "${Red}error${Color_Off}:" "$@" >&2
    exit 1
}

info() {
    echo -e "${Dim}$@ ${Color_Off}"
}

info_bold() {
    echo -e "${Bold_White}$@ ${Color_Off}"
}

success() {
    echo -e "${Green}$@ ${Color_Off}"
}

# Check if curl is available
command -v curl >/dev/null || error 'curl is required to install fibonacci-benchmark'

# Configuration
BENCHMARK_URL="https://raw.githubusercontent.com/m3nfis/fiboBenchmark_js-multi-runtime/main/benchmark.js"
CONFIG_URL="https://raw.githubusercontent.com/m3nfis/fiboBenchmark_js-multi-runtime/main/config.json"
PACKAGE_URL="https://raw.githubusercontent.com/m3nfis/fiboBenchmark_js-multi-runtime/main/package.json"
README_URL="https://raw.githubusercontent.com/m3nfis/fiboBenchmark_js-multi-runtime/main/README.md"

# Installation directory
INSTALL_DIR=${FIBONACCI_BENCHMARK_INSTALL:-$HOME/.fibonacci-benchmark}
BIN_DIR="$INSTALL_DIR/bin"
EXE="$BIN_DIR/fibonacci-benchmark"

# Create installation directory
if [[ ! -d $BIN_DIR ]]; then
    mkdir -p "$BIN_DIR" || error "Failed to create install directory \"$BIN_DIR\""
fi

info "Installing Fibonacci Benchmark..."

# Download files
echo "Downloading benchmark files..."

# Download benchmark.js
curl --fail --location --progress-bar --output "$BIN_DIR/benchmark.js" "$BENCHMARK_URL" || error "Failed to download benchmark.js from \"$BENCHMARK_URL\""

# Download config.json
curl --fail --location --progress-bar --output "$BIN_DIR/config.json" "$CONFIG_URL" || error "Failed to download config.json from \"$CONFIG_URL\""

# Download package.json
curl --fail --location --progress-bar --output "$BIN_DIR/package.json" "$PACKAGE_URL" || error "Failed to download package.json from \"$PACKAGE_URL\""

# Download README.md
curl --fail --location --progress-bar --output "$BIN_DIR/README.md" "$README_URL" || error "Failed to download README.md from \"$README_URL\""

# Create executable wrapper
cat > "$EXE" << 'EOF'
#!/usr/bin/env bash
# Fibonacci Benchmark Runner
# Compatible with Node.js, Deno, and Bun

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BENCHMARK_SCRIPT="$SCRIPT_DIR/benchmark.js"

# Function to detect available runtime
detect_runtime() {
    if command -v bun >/dev/null; then
        echo "bun"
    elif command -v deno >/dev/null; then
        echo "deno"
    elif command -v node >/dev/null; then
        echo "node"
    else
        echo "none"
    fi
}

# Function to run benchmark with detected runtime
run_benchmark() {
    local runtime="$1"
    shift
    
    case "$runtime" in
        "bun")
            bun run "$BENCHMARK_SCRIPT" "$@"
            ;;
        "deno")
            deno run --allow-read --allow-write --allow-net "$BENCHMARK_SCRIPT" "$@"
            ;;
        "node")
            node "$BENCHMARK_SCRIPT" "$@"
            ;;
        *)
            error "No compatible JavaScript runtime found. Please install Node.js, Deno, or Bun."
            ;;
    esac
}

# Main execution
RUNTIME=$(detect_runtime)
if [[ "$RUNTIME" == "none" ]]; then
    echo "❌ No JavaScript runtime detected!"
    echo "Please install one of the following:"
    echo "  • Node.js: https://nodejs.org/"
    echo "  • Deno: https://deno.land/"
    echo "  • Bun: https://bun.sh/"
    exit 1
fi

echo "🚀 Running Fibonacci Benchmark with $RUNTIME..."
run_benchmark "$RUNTIME" "$@"
EOF

# Make executable
chmod +x "$EXE" || error 'Failed to set permissions on fibonacci-benchmark executable'

# Helper function to show tilde path
tildify() {
    if [[ $1 = $HOME/* ]]; then
        local replacement=~/
        echo "${1/$HOME\//$replacement}"
    else
        echo "$1"
    fi
}

success "Fibonacci Benchmark was installed successfully to $Bold_Green$(tildify "$EXE")"

# Check if already in PATH
if command -v fibonacci-benchmark >/dev/null; then
    echo "Run 'fibonacci-benchmark --help' to get started"
    exit 0
fi

# Add to PATH
refresh_command=''
tilde_bin_dir=$(tildify "$BIN_DIR")
quoted_install_dir="${INSTALL_DIR//\"/\\\"}"
if [[ $quoted_install_dir = "$HOME/*" ]]; then
    quoted_install_dir=${quoted_install_dir/$HOME\//\$HOME/}
fi

echo
case $(basename "$SHELL") in
    fish)
        commands=(
            "set --export FIBONACCI_BENCHMARK_INSTALL $quoted_install_dir"
            "set --export PATH $BIN_DIR \$PATH"
        )
        fish_config=$HOME/.config/fish/config.fish
        tilde_fish_config=$(tildify "$fish_config")
        
        if [[ -w $fish_config ]]; then
            {
                echo -e '\n# fibonacci-benchmark'
                for command in "${commands[@]}"; do
                    echo "$command"
                done
            } >>"$fish_config"
            info "Added \"$tilde_bin_dir\" to \$PATH in \"$tilde_fish_config\""
            refresh_command="source $tilde_fish_config"
        else
            echo "Manually add the directory to $tilde_fish_config (or similar):"
            for command in "${commands[@]}"; do
                info_bold " $command"
            done
        fi
        ;;
    zsh)
        commands=(
            "export FIBONACCI_BENCHMARK_INSTALL=$quoted_install_dir"
            "export PATH=\"$BIN_DIR:\$PATH\""
        )
        zsh_config=$HOME/.zshrc
        tilde_zsh_config=$(tildify "$zsh_config")
        
        if [[ -w $zsh_config ]]; then
            {
                echo -e '\n# fibonacci-benchmark'
                for command in "${commands[@]}"; do
                    echo "$command"
                done
            } >>"$zsh_config"
            info "Added \"$tilde_bin_dir\" to \$PATH in \"$tilde_zsh_config\""
            refresh_command="exec $SHELL"
        else
            echo "Manually add the directory to $tilde_zsh_config (or similar):"
            for command in "${commands[@]}"; do
                info_bold " $command"
            done
        fi
        ;;
    bash)
        commands=(
            "export FIBONACCI_BENCHMARK_INSTALL=$quoted_install_dir"
            "export PATH=\"$BIN_DIR:\$PATH\""
        )
        bash_configs=(
            "$HOME/.bashrc"
            "$HOME/.bash_profile"
        )
        
        if [[ ${XDG_CONFIG_HOME:-} ]]; then
            bash_configs+=(
                "$XDG_CONFIG_HOME/.bash_profile"
                "$XDG_CONFIG_HOME/.bashrc"
                "$XDG_CONFIG_HOME/bash_profile"
                "$XDG_CONFIG_HOME/bashrc"
            )
        fi
        
        set_manually=true
        for bash_config in "${bash_configs[@]}"; do
            tilde_bash_config=$(tildify "$bash_config")
            if [[ -w $bash_config ]]; then
                {
                    echo -e '\n# fibonacci-benchmark'
                    for command in "${commands[@]}"; do
                        echo "$command"
                    done
                } >>"$bash_config"
                info "Added \"$tilde_bin_dir\" to \$PATH in \"$tilde_bash_config\""
                refresh_command="source $bash_config"
                set_manually=false
                break
            fi
        done
        
        if [[ $set_manually = true ]]; then
            echo "Manually add the directory to $tilde_bash_config (or similar):"
            for command in "${commands[@]}"; do
                info_bold " $command"
            done
        fi
        ;;
    *)
        echo 'Manually add the directory to ~/.bashrc (or similar):'
        info_bold " export FIBONACCI_BENCHMARK_INSTALL=$quoted_install_dir"
        info_bold " export PATH=\"$BIN_DIR:\$PATH\""
        ;;
esac

echo
info "To get started, run:"
echo
if [[ $refresh_command ]]; then
    info_bold " $refresh_command"
fi
info_bold " fibonacci-benchmark --help" 