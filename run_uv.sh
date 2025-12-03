#!/bin/bash
# Run script using UV for Document Annotation System

echo "Starting Document Annotation System with UV..."
echo ""

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "ERROR: UV is not installed!"
    echo "Please run: bash tools/scripts/setup_uv.sh"
    exit 1
fi

# Check if .venv exists
if [ ! -d ".venv" ]; then
    echo "Virtual environment not found. Running setup..."
    bash tools/scripts/setup_uv.sh
fi

echo "Starting backend server..."
uv run python modules/main.py
