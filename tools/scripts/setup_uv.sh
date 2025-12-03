#!/bin/bash
# Setup script for UV Python package manager on Unix/Linux/macOS

echo "========================================"
echo "UV Setup for Document Annotation System"
echo "========================================"
echo ""

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "UV is not installed. Installing UV..."
    echo ""
    echo "Installing via curl..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    
    # Source the shell config to get uv in PATH
    if [ -f "$HOME/.bashrc" ]; then
        source "$HOME/.bashrc"
    elif [ -f "$HOME/.zshrc" ]; then
        source "$HOME/.zshrc"
    fi
    
    # Check again
    if ! command -v uv &> /dev/null; then
        echo "UV installation failed. Please install manually:"
        echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
        echo "  or: pip install uv"
        exit 1
    fi
fi

echo "UV is installed!"
echo ""

# Check Python version
echo "Checking Python version..."
uv python list
echo ""

# Install Python 3.11 if needed
echo "Installing/verifying Python 3.11..."
uv python install 3.11
echo ""

# Create virtual environment and install dependencies
echo "Creating virtual environment and installing dependencies..."
uv sync
echo ""

echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "To activate the virtual environment:"
echo "  source .venv/bin/activate"
echo ""
echo "To run the backend server:"
echo "  uv run python modules/main.py"
echo ""
echo "To run tests:"
echo "  uv run pytest"
echo ""
