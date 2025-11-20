#!/bin/bash

# Bash script to run Vitest tests with proper cleanup

echo "Clearing node_modules/.vitest cache..."
if [ -d "node_modules/.vitest" ]; then
    rm -rf node_modules/.vitest
    echo "Cache cleared!"
else
    echo "No cache found."
fi

echo ""
echo "Running tests with single fork..."
npx vitest run --pool=forks --poolOptions.forks.singleFork=true

echo ""
echo "Test run complete!"
