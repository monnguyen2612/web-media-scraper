#!/usr/bin/env bash
set -e

# Colors for output
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

NO_BUILD=false
NO_SMOKE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -NoBuild|--no-build)
      NO_BUILD=true
      shift
      ;;
    -NoSmoke|--no-smoke)
      NO_SMOKE=true
      shift
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

function write_step() {
  printf "\n${CYAN}==> %s${NC}\n" "$1"
}

function check_command() {
  if ! command -v "$1" &> /dev/null; then
    printf "${RED}Error: %s is not installed or not in PATH.${NC}\n" "$1"
    exit 1
  fi
}

# Set working directory to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

write_step "Pre-flight check"
check_command docker
check_command pnpm
check_command node

write_step "Environment version"
docker --version
docker compose version
node -v
pnpm -v

if [ "$NO_BUILD" = false ]; then
  write_step "pnpm install"
  pnpm install

  write_step "Build api/worker/web"
  pnpm --filter @media-scraper/api build
  pnpm --filter @media-scraper/worker build
  pnpm --filter @media-scraper/web build
fi

write_step "docker compose up (api/worker/web)"
docker compose up -d --build api worker web

write_step "Service status"
docker compose ps

write_step "Health check"
HEALTH_OK=false
for i in {1..15}; do
  if curl -s -f http://localhost:3000/health > /dev/null; then
    HEALTH_CONTENT=$(curl -s http://localhost:3000/health)
    echo "$HEALTH_CONTENT"
    HEALTH_OK=true
    break
  fi
  printf "."
  sleep 2
done
printf "\n"

if [ "$HEALTH_OK" = false ]; then
  printf "${RED}Health check failed after retries${NC}\n"
  exit 1
fi

if [ "$NO_SMOKE" = false ]; then
  write_step "SSE smoke test + scrape submit"
  node -e "
(async()=>{
  const base='http://localhost:3000';
  const timeoutMs = 20000;
  console.log('Connecting to SSE at ' + base + '/events...');
  
  const timeout = setTimeout(() => {
    console.error('Timeout: JOB_STARTED event not received within ' + (timeoutMs/1000) + 's');
    process.exit(1);
  }, timeoutMs);

  try {
    const res = await fetch(base + '/events', { headers: { Accept: 'text/event-stream' } });
    if (res.status !== 200) {
      console.error('SSE connection failed with status: ' + res.status);
      process.exit(1);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    console.log('Submitting scrape request...');
    const scrapeRes = await fetch(base + '/scrape', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ urls: ['https://example.com'] })
    });

    if (!scrapeRes.ok) {
      console.error('Scrape submission failed with status: ' + scrapeRes.status);
      process.exit(1);
    }

    console.log('Waiting for JOB_STARTED event...');
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      if (buf.includes('event: JOB_STARTED')) {
        clearTimeout(timeout);
        console.log('OK: Received JOB_STARTED event');
        process.exit(0);
      }
    }
    
    clearTimeout(timeout);
    console.error('SSE stream ended unexpectedly');
    process.exit(1);
  } catch (err) {
    console.error('Smoke test failed:', err.message);
    process.exit(1);
  }
})().catch(e => {
  console.error('Unhandled error in smoke test:', e);
  process.exit(1);
});
"
fi

write_step "Done"
echo "Web:  http://localhost:5173"
echo "API:  http://localhost:3000"
echo "Docs: http://localhost:3000/docs"

