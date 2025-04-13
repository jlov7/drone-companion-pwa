#!/bin/bash

# Change to the app directory
cd app

# Run all tests with config and capture the exit code
npx vitest run --config vitest.config.ts --silent

# Check the exit code
if [ $? -eq 0 ]; then
  echo "✅ SUCCESS: All tests passed! Ready for deployment."
  exit 0
else
  echo "❌ FAILURE: Some tests failed. Fix issues before deploying."
  exit 1
fi 