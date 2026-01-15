/**
 * Performance Load Test Script
 * Uses autocannon to benchmark the enhanced PayPass endpoints
 */

import autocannon from 'autocannon';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function runLoadTest() {
  console.log('🚀 Starting PayPass Performance Load Test...');

  const baseUrl = 'http://localhost:3000'; // Assuming local dev server
  
  const results = [];

  // 1. Test Enhanced Login Endpoint
  console.log('\n--- Testing: POST /api/auth/login-enhanced ---');
  const loginResult = await autocannon({
    url: `${baseUrl}/api/auth/login-enhanced`,
    method: 'POST',
    connections: 10,
    duration: 10,
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      phone: '+263771234567',
      pin: '1234'
    })
  });
  results.push({ endpoint: '/api/auth/login-enhanced', ...loginResult });

  // 2. Test Enhanced KYC Submission
  console.log('\n--- Testing: POST /api/identity/submit-enhanced ---');
  const kycResult = await autocannon({
    url: `${baseUrl}/api/identity/submit-enhanced`,
    method: 'POST',
    connections: 5,
    duration: 10,
    headers: {
      'content-type': 'application/json',
      'authorization': 'Bearer dummy-token'
    },
    body: JSON.stringify({
      userId: 'user-123',
      documentType: 'passport',
      documentNumber: 'AB123456',
      documentCountry: 'ZW',
      documentExpiry: '2030-01-01',
      frontImageUrl: 'https://example.com/front.jpg',
      selfieUrl: 'https://example.com/selfie.jpg'
    })
  });
  results.push({ endpoint: '/api/identity/submit-enhanced', ...kycResult });

  // Save results to file
  const reportPath = join(process.cwd(), 'performance-report.json');
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log(`\n✅ Load test complete. Report saved to: ${reportPath}`);
  
  // Print summary
  results.forEach(res => {
    console.log(`\nEndpoint: ${res.endpoint}`);
    console.log(`Requests/sec: ${res.requests.average}`);
    console.log(`Latency (ms) - Avg: ${res.latency.average}, P99: ${res.latency.p99}`);
    console.log(`Errors: ${res.errors}`);
  });
}

runLoadTest().catch(console.error);
