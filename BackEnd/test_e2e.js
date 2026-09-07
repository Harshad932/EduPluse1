/**
 * Simple end-to-end smoke test for the Team API.
 * Usage: npm run test:e2e   (make sure `npm run dev` is running in another terminal first)
 */
require('dotenv').config();
const http = require('http');

const PORT = process.env.PORT || 5000;
const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || 'admin-secret-token';

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

let createdId = null;

async function runTests() {
  console.log('=== STARTING END-TO-END API TESTS ===\n');

  try {
    // 1. Health check
    console.log('Test 1: GET / (Health Check)');
    const health = await request({ host: 'localhost', port: PORT, path: '/', method: 'GET' });
    console.log(health.status === 200 && health.data.success ? 'PASSED\n' : 'FAILED\n');

    // 2. Auth protection: no headers at all
    console.log('Test 2: POST /api/team without auth (expect 403)');
    const unauthorized = await request(
      { host: 'localhost', port: PORT, path: '/api/team', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Unauthorized User', role: 'Dev', category: 'team' }
    );
    console.log(unauthorized.status === 403 ? 'PASSED\n' : `FAILED (got ${unauthorized.status})\n`);

    // 3. Auth protection: fake bearer token must still be rejected
    console.log('Test 3: POST /api/team with a bogus Bearer token (expect 403)');
    const fakeAuth = await request(
      {
        host: 'localhost',
        port: PORT,
        path: '/api/team',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer not-the-real-secret' }
      },
      { name: 'Faker', role: 'Dev', category: 'team' }
    );
    console.log(fakeAuth.status === 403 ? 'PASSED\n' : `FAILED (got ${fakeAuth.status})\n`);

    // 4. Invalid category validation
    console.log('Test 4: POST /api/team with invalid category (expect 400)');
    const invalidCat = await request(
      {
        host: 'localhost',
        port: PORT,
        path: '/api/team',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY }
      },
      { name: 'Test User', role: 'Dev', category: 'superhero' }
    );
    console.log(invalidCat.status === 400 ? 'PASSED\n' : `FAILED (got ${invalidCat.status})\n`);

    // 5. Create a team member
    console.log('Test 5: POST /api/team - create a team member (expect 201)');
    const created = await request(
      {
        host: 'localhost',
        port: PORT,
        path: '/api/team',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY }
      },
      {
        name: 'E2E Test User',
        role: 'Full Stack Developer',
        category: 'team',
        description: 'Created by the end-to-end test script.',
        github_url: 'https://github.com/example',
        linkedin_url: 'https://linkedin.com/in/example'
      }
    );
    console.log(created.status === 201 && created.data.success ? 'PASSED\n' : `FAILED (got ${created.status})\n`);
    createdId = created.data && created.data.data && created.data.data._id;

    // 6. Fetch it back
    console.log('Test 6: GET /api/team?category=team (expect 200, includes new member)');
    const list = await request({ host: 'localhost', port: PORT, path: '/api/team?category=team', method: 'GET' });
    const found = list.status === 200 && list.data.data.some((m) => m._id === createdId);
    console.log(found ? 'PASSED\n' : 'FAILED\n');

    // 7. Update it
    if (createdId) {
      console.log('Test 7: PUT /api/team/:id - update role (expect 200)');
      const updated = await request(
        {
          host: 'localhost',
          port: PORT,
          path: `/api/team/${createdId}`,
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY }
        },
        { role: 'Senior Full Stack Developer' }
      );
      console.log(updated.status === 200 && updated.data.data.role === 'Senior Full Stack Developer' ? 'PASSED\n' : 'FAILED\n');

      // 8. Delete it
      console.log('Test 8: DELETE /api/team/:id (expect 200)');
      const deleted = await request({
        host: 'localhost',
        port: PORT,
        path: `/api/team/${createdId}`,
        method: 'DELETE',
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      console.log(deleted.status === 200 && deleted.data.success ? 'PASSED\n' : 'FAILED\n');
    }

    console.log('=== END-TO-END TESTS COMPLETE ===');
  } catch (err) {
    console.error('Test run failed:', err.message);
    console.error('Is the server running? Start it with `npm run dev` in another terminal.');
    process.exit(1);
  }
}

runTests();
