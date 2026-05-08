import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    fixed_requests: {
      executor: 'shared-iterations',
      iterations: 500,
      vus: 50, // Parallelism level
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000']
  }
};

const API_BASE = __ENV.API_BASE_URL || 'http://localhost:3000';

export default function () {
  const payload = JSON.stringify({
    urls: Array.from({ length: 5 }, (_, index) => `https://example.com?test=${__VU}-${__ITER}-${index}`)
  });

  const response = http.post(`${API_BASE}/scrape`, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  check(response, {
    'accepted status': (r) => r.status === 202
  });

  sleep(0.2);
}
