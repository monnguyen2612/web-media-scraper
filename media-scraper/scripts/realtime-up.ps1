param(
  [switch]$NoBuild,
  [switch]$NoSmoke
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
  Write-Host "`n==> $msg" -ForegroundColor Cyan
}

Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location ".."

Write-Step "Docker version"
docker version | Out-Host

if (-not $NoBuild) {
  Write-Step "pnpm install"
  pnpm install | Out-Host

  Write-Step "Build api/worker/web"
  pnpm --filter @media-scraper/api build | Out-Host
  pnpm --filter @media-scraper/worker build | Out-Host
  pnpm --filter @media-scraper/web build | Out-Host
}

Write-Step "docker compose up (api/worker/web)"
docker compose up -d --build api worker web | Out-Host

Write-Step "Service status"
docker compose ps | Out-Host

Write-Step "Health check"
$healthContent = $null
for ($i = 0; $i -lt 10; $i++) {
  try {
    $health = Invoke-WebRequest -UseBasicParsing "http://localhost:3000/health" -TimeoutSec 5
    $healthContent = $health.Content
    break
  } catch {
    Start-Sleep -Seconds 2
  }
}
if (-not $healthContent) {
  throw "Health check failed after retries"
}
Write-Host $healthContent

if (-not $NoSmoke) {
  Write-Step "SSE smoke test + scrape submit"
  node -e @"
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
"@ | Out-Host
}

Write-Step "Done"
Write-Host "Web:  http://localhost:5173"
Write-Host "API:  http://localhost:3000"
Write-Host "Docs: http://localhost:3000/docs"

