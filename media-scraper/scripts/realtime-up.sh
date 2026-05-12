#!/bin/bash
set -e

# Colors for output
CYAN='\033[0;36m'
NC='\033[0m' # No Color

NO_BUILD=false
NO_SMOKE=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    -NoBuild|--no-build)
      NO_BUILD=true
      shift
      ;;
    -NoSmoke|--no-smoke)
      NO_SMOKE=true
      shift
      ;;
  esac
done

function write_step() {
  echo -e "\n${CYAN}==> $1${NC}"
}

# Set working directory to repo root
cd "$(dirname "$0")/.."

write_step "Docker version"
docker version

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
for i in {1..10}; do
  if curl -s -f http://localhost:3000/health > /dev/null; then
    HEALTH_CONTENT=$(curl -s http://localhost:3000/health)
    echo "$HEALTH_CONTENT"
    HEALTH_OK=true
    break
  fi
  sleep 2
done

if [ "$HEALTH_OK" = false ]; then
  echo "Health check failed after retries"
  exit 1
fi

if [ "$NO_SMOKE" = false ]; then
  write_step "SSE smoke test + scrape submit"
  node -e "
(async()=>{
  const base='http://localhost:3000';
  const res=await fetch(base+'/events',{headers:{Accept:'text/event-stream'}});
  if(res.status!==200){ console.error('bad status',res.status); process.exit(1); }
  const reader=res.body.getReader();
  const decoder=new TextDecoder();
  let buf='';
  const timeout=setTimeout(()=>{console.error('timeout waiting JOB_STARTED'); process.exit(1);},8000);
  await fetch(base+'/scrape',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({urls:['https://example.com']})});
  while(true){
    const {value,done}=await reader.read();
    if(done) break;
    buf+=decoder.decode(value,{stream:true});
    if(buf.includes('event: JOB_STARTED')){
      clearTimeout(timeout);
      console.log('OK: got JOB_STARTED');
      process.exit(0);
    }
  }
  clearTimeout(timeout);
  console.error('stream ended unexpectedly');
  process.exit(1);
})().catch(e=>{console.error(e);process.exit(1);});
"
fi

write_step "Done"
echo "Web:  http://localhost:5173"
echo "API:  http://localhost:3000"
echo "Docs: http://localhost:3000/docs"
