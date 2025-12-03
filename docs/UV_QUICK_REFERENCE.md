# UV Quick Reference Card

## Installation

```bash
# Windows (PowerShell)
irm https://astral.sh/uv/install.ps1 | iex

# Linux/macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# Via pip
pip install uv
```

## Project Setup

```bash
# One-command setup (Windows)
tools\scripts\setup_uv.bat

# One-command setup (Linux/macOS)
bash tools/scripts/setup_uv.sh

# Manual setup
uv python install 3.11
uv sync
```

## Daily Commands

| Task | Command |
|------|---------|
| Install dependencies | `uv sync` |
| Add package | `uv add package-name` |
| Add dev package | `uv add --dev package-name` |
| Remove package | `uv remove package-name` |
| Update all | `uv sync --upgrade` |
| Run script | `uv run python script.py` |
| Run tests | `uv run pytest` |
| Activate venv | `.venv\Scripts\activate` (Win) / `source .venv/bin/activate` (Unix) |

## Running the App

```bash
# Quick run (Windows)
run_uv.bat

# Quick run (Linux/macOS)
bash run_uv.sh

# Manual run
uv run python modules/main.py
```

## Python Version Management

```bash
# List available versions
uv python list

# Install version
uv python install 3.11

# Pin version
uv python pin 3.11
```

## Troubleshooting

```bash
# Clear cache
uv cache clean

# Reinstall everything
uv sync --reinstall

# Update UV itself
uv self update
```

## Key Files

- `pyproject.toml` - Project config & dependencies
- `uv.lock` - Lock file (commit this!)
- `.python-version` - Python version pin
- `.venv/` - Virtual environment (don't commit)

## Why UV?

- ⚡ **10-100x faster** than pip
- 🔒 **Deterministic** with lock files
- 🐍 **Python version management** built-in
- 🎯 **Zero config** for most projects
- 🦀 **Written in Rust** for speed

## Full Documentation

See `docs/UV_SETUP_GUIDE.md` for complete guide.
