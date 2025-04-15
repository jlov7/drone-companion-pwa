#!/bin/bash

# Drone Companion Test Runner
# This script runs the comprehensive test suite and diagnostics

# Colors for console output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   DJI Drone Companion Test Suite    ${NC}"
echo -e "${BLUE}======================================${NC}"

# Check if the server is running
if ! curl -s http://localhost:5000/api/health > /dev/null; then
  echo -e "${YELLOW}Server is not running. Starting the server...${NC}"
  echo -e "${YELLOW}Starting the server in a separate process...${NC}"
  # Start the server and run in background
  npx tsx server/index.ts > server.log 2>&1 &
  SERVER_PID=$!
  
  # Wait for server to start
  echo -e "${YELLOW}Waiting for server to start...${NC}"
  sleep 5
  
  # Check again if server started
  if ! curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${RED}Failed to start server. Please start it manually using 'npm run dev'${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Server started successfully!${NC}"
  SERVER_STARTED=true
else
  echo -e "${GREEN}Server is already running.${NC}"
  SERVER_STARTED=false
fi

# Parse command line arguments
VERBOSE=false
CATEGORY=""
STOP_ON_FAILURE=false
RUN_DIAGNOSTICS=true
RUN_TESTS=true
RUN_CREDENTIALS=true

for arg in "$@"
do
  case $arg in
    --verbose)
      VERBOSE=true
      shift
      ;;
    --stop-on-failure)
      STOP_ON_FAILURE=true
      shift
      ;;
    --dji)
      CATEGORY="--category=dji"
      shift
      ;;
    --api)
      CATEGORY="--category=api"
      shift
      ;;
    --database)
      CATEGORY="--category=database"
      shift
      ;;
    --ui)
      CATEGORY="--category=ui"
      shift
      ;;
    --integration)
      CATEGORY="--category=integration"
      shift
      ;;
    --diagnostics-only)
      RUN_DIAGNOSTICS=true
      RUN_TESTS=false
      RUN_CREDENTIALS=false
      shift
      ;;
    --credentials-only)
      RUN_DIAGNOSTICS=false
      RUN_TESTS=false
      RUN_CREDENTIALS=true
      shift
      ;;
    --tests-only)
      RUN_DIAGNOSTICS=false
      RUN_TESTS=true
      RUN_CREDENTIALS=false
      shift
      ;;
    --skip-diagnostics)
      RUN_DIAGNOSTICS=false
      shift
      ;;
    --skip-credentials)
      RUN_CREDENTIALS=false
      shift
      ;;
    --skip-tests)
      RUN_TESTS=false
      shift
      ;;
    --report)
      SAVE_REPORT=true
      shift
      ;;
    --help)
      echo -e "${BLUE}DJI Drone Companion Test Suite${NC}"
      echo -e "Usage: ./test.sh [options]"
      echo -e ""
      echo -e "Options:"
      echo -e "  --verbose           Show detailed test output"
      echo -e "  --dji               Run only DJI API tests"
      echo -e "  --api               Run only API tests"
      echo -e "  --database          Run only database tests"
      echo -e "  --ui                Run only UI tests"
      echo -e "  --integration       Run only integration tests"
      echo -e "  --stop-on-failure   Stop testing after first failure"
      echo -e "  --diagnostics-only  Run only API diagnostics"
      echo -e "  --credentials-only  Run only credential checks"
      echo -e "  --tests-only        Run only unit/integration tests"
      echo -e "  --skip-diagnostics  Skip API diagnostics"
      echo -e "  --skip-credentials  Skip credential checks"
      echo -e "  --skip-tests        Skip unit/integration tests"
      echo -e "  --report            Save diagnostic reports to files"
      echo -e "  --help              Show this help information"
      echo -e ""
      echo -e "Examples:"
      echo -e "  ./test.sh --diagnostics-only --report"
      echo -e "  ./test.sh --dji --verbose"
      echo -e "  ./test.sh --skip-diagnostics --api"
      exit 0
      ;;
  esac
done

# Build command arguments
ARGS=""
if [ "$VERBOSE" = true ]; then
  ARGS="$ARGS --verbose"
fi

if [ "$STOP_ON_FAILURE" = true ]; then
  ARGS="$ARGS --stop-on-failure"
fi

if [ "$CATEGORY" != "" ]; then
  ARGS="$ARGS $CATEGORY"
fi

# Create reports directory if saving reports
if [ "$SAVE_REPORT" = true ]; then
  mkdir -p ./diagnostics-reports
fi

# Set default exit code
EXIT_CODE=0

# Run credential checks if requested
if [ "$RUN_CREDENTIALS" = true ]; then
  echo -e "\n${CYAN}======================================${NC}"
  echo -e "${CYAN}       DJI API Credential Check       ${NC}"
  echo -e "${CYAN}======================================${NC}"
  
  CRED_ARGS=""
  if [ "$VERBOSE" = true ]; then
    CRED_ARGS="--verbose"
  fi
  
  if [ "$SAVE_REPORT" = true ]; then
    CRED_ARGS="$CRED_ARGS --save"
  fi
  
  # Run credential checks
  npx tsx -e "import { main } from './server/diagnostics/credentialMonitor.ts'; main().then(code => process.exit(code));"
  CREDENTIAL_RESULT=$?
  
  if [ $CREDENTIAL_RESULT -ne 0 ]; then
    echo -e "${YELLOW}⚠️ Credential check reported issues.${NC}"
    EXIT_CODE=1
  fi
fi

# Run API diagnostics if requested
if [ "$RUN_DIAGNOSTICS" = true ]; then
  echo -e "\n${CYAN}======================================${NC}"
  echo -e "${CYAN}        DJI API Diagnostics           ${NC}"
  echo -e "${CYAN}======================================${NC}"
  
  DIAG_ARGS=""
  if [ "$VERBOSE" = true ]; then
    DIAG_ARGS="--verbose"
  fi
  
  if [ "$SAVE_REPORT" = true ]; then
    DIAG_ARGS="$DIAG_ARGS --save"
  fi
  
  # Run diagnostics
  npx tsx server/diagnostics/runDiagnostics.ts $DIAG_ARGS
  DIAGNOSTIC_RESULT=$?
  
  if [ $DIAGNOSTIC_RESULT -ne 0 ]; then
    echo -e "${YELLOW}⚠️ API diagnostics reported issues.${NC}"
    EXIT_CODE=1
  fi
fi

# Run the tests if requested
if [ "$RUN_TESTS" = true ]; then
  echo -e "\n${BLUE}======================================${NC}"
  echo -e "${BLUE}      Running Test Suite              ${NC}"
  echo -e "${BLUE}======================================${NC}"
  
  npx tsx server/tests/runTests.ts $ARGS
  TEST_RESULT=$?
  
  if [ $TEST_RESULT -ne 0 ]; then
    echo -e "${RED}❌ Some tests failed.${NC}"
    EXIT_CODE=$TEST_RESULT
  fi
fi

# If we started the server, shut it down
if [ "$SERVER_STARTED" = true ]; then
  echo -e "${YELLOW}Shutting down the test server...${NC}"
  kill $SERVER_PID
  echo -e "${GREEN}Server shutdown complete.${NC}"
fi

# Print final summary
echo -e "\n${BLUE}======================================${NC}"
echo -e "${BLUE}           Test Summary               ${NC}"
echo -e "${BLUE}======================================${NC}"

if [ "$RUN_CREDENTIALS" = true ]; then
  if [ $CREDENTIAL_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Credential check: Passed${NC}"
  else
    echo -e "${YELLOW}⚠️ Credential check: Issues detected${NC}"
  fi
fi

if [ "$RUN_DIAGNOSTICS" = true ]; then
  if [ $DIAGNOSTIC_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ API diagnostics: All systems operational${NC}"
  else
    echo -e "${YELLOW}⚠️ API diagnostics: Issues detected${NC}"
  fi
fi

if [ "$RUN_TESTS" = true ]; then
  if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Test suite: All tests passed${NC}"
  else
    echo -e "${RED}❌ Test suite: Some tests failed${NC}"
  fi
fi

echo -e "\n${BLUE}Final result:${NC}"
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed successfully!${NC}"
else
  echo -e "${YELLOW}⚠️ Some checks reported issues. Review the output above for details.${NC}"
fi
echo -e "${BLUE}======================================${NC}"

# Return appropriate exit code
exit $EXIT_CODE