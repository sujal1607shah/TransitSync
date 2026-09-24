const http = require('http');
const assert = require('assert');

const BASE_HOST = '127.0.0.1';
const BASE_PORT = 5000;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(dataString),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api${path}`,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = rawData ? JSON.parse(rawData) : null;
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: rawData });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

async function testMultiTenancy() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING MULTI-TENANCY ISOLATION SECURITY TESTS');
  console.log('======================================================\n');

  try {
    // 1. Health check
    console.log('1️⃣ Checking Health Endpoint...');
    const health = await request('GET', '/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.success, true);
    console.log('   ✅ Health endpoint OK');

    // 2. Register New Organization 1 ("Delta Logistics") + Admin 1
    console.log('\n2️⃣ Registering Organization A ("Delta Logistics")...');
    const orgCodeA = `DLT${Math.floor(100 + Math.random() * 900)}`;
    const regResA = await request('POST', '/organizations/register', {
      organization: {
        name: 'Delta Logistics Corp',
        code: orgCodeA,
        city: 'Mumbai',
      },
      admin: {
        name: 'Admin Delta',
        email: `admin.${orgCodeA.toLowerCase()}@deltalogistics.com`,
        password: 'password123',
      },
    });
    assert.strictEqual(regResA.status, 201, `Failed with ${JSON.stringify(regResA.data)}`);
    const tokenA = regResA.data.data.token;
    const orgIdA = regResA.data.data.organization.id;
    console.log(`   ✅ Org A created: ${orgCodeA} (ID: ${orgIdA})`);

    // 3. Register New Organization 2 ("Echo Freight") + Admin 2
    console.log('\n3️⃣ Registering Organization B ("Echo Freight")...');
    const orgCodeB = `ECH${Math.floor(100 + Math.random() * 900)}`;
    const regResB = await request('POST', '/organizations/register', {
      organization: {
        name: 'Echo Freight Express',
        code: orgCodeB,
        city: 'Delhi',
      },
      admin: {
        name: 'Admin Echo',
        email: `admin.${orgCodeB.toLowerCase()}@echofreight.com`,
        password: 'password123',
      },
    });
    assert.strictEqual(regResB.status, 201, `Failed with ${JSON.stringify(regResB.data)}`);
    const tokenB = regResB.data.data.token;
    const orgIdB = regResB.data.data.organization.id;
    console.log(`   ✅ Org B created: ${orgCodeB} (ID: ${orgIdB})`);

    // 4. Create Driver & Vehicle under Org A
    console.log('\n4️⃣ Creating Driver and Vehicle under Org A...');
    const driverResA = await request(
      'POST',
      '/drivers',
      { name: 'Driver Delta 1', phone: '9999911111', licenseNumber: 'DL-01-DELTA', driverId: `DRV-A-${orgCodeA}` },
      tokenA
    );
    assert.strictEqual(driverResA.status, 201, `Driver create failed: ${JSON.stringify(driverResA.data)}`);

    const vehicleResA = await request(
      'POST',
      '/vehicles',
      { name: 'Delta Truck 1', vehicleID: `VEH-A-${orgCodeA}`, registrationNumber: `MH01DL${Math.floor(1000 + Math.random() * 9000)}` },
      tokenA
    );
    assert.strictEqual(vehicleResA.status, 201, `Vehicle create failed: ${JSON.stringify(vehicleResA.data)}`);
    console.log(`   ✅ Org A Driver: ${driverResA.data.data.driverId}, Vehicle: ${vehicleResA.data.data.vehicleID}`);

    // 5. Create Driver & Vehicle under Org B
    console.log('\n5️⃣ Creating Driver and Vehicle under Org B...');
    const driverResB = await request(
      'POST',
      '/drivers',
      { name: 'Driver Echo 1', phone: '8888822222', licenseNumber: 'DL-02-ECHO', driverId: `DRV-B-${orgCodeB}` },
      tokenB
    );
    assert.strictEqual(driverResB.status, 201);

    const vehicleResB = await request(
      'POST',
      '/vehicles',
      { name: 'Echo Truck 1', vehicleID: `VEH-B-${orgCodeB}`, registrationNumber: `DL01EC${Math.floor(1000 + Math.random() * 9000)}` },
      tokenB
    );
    assert.strictEqual(vehicleResB.status, 201);
    console.log(`   ✅ Org B Driver: ${driverResB.data.data.driverId}, Vehicle: ${vehicleResB.data.data.vehicleID}`);

    // 6. Test DRIVER ISOLATION
    console.log('\n6️⃣ Testing Driver Isolation...');
    const driversListA = await request('GET', '/drivers', null, tokenA);
    const driverIdsA = driversListA.data.data.map((d) => d.driverId);
    assert.strictEqual(driverIdsA.includes(`DRV-A-${orgCodeA}`), true);
    assert.strictEqual(driverIdsA.includes(`DRV-B-${orgCodeB}`), false, 'CRITICAL: Driver B leaked into Org A driver list!');
    console.log('   ✅ Driver list correctly isolated by organization.');

    // 7. Test VEHICLE ISOLATION
    console.log('\n7️⃣ Testing Vehicle Isolation...');
    const vehiclesListA = await request('GET', '/vehicles', null, tokenA);
    const vehicleIdsA = vehiclesListA.data.data.map((v) => v.vehicleID);
    assert.strictEqual(vehicleIdsA.includes(`VEH-A-${orgCodeA}`), true);
    assert.strictEqual(vehicleIdsA.includes(`VEH-B-${orgCodeB}`), false, 'CRITICAL: Vehicle B leaked into Org A vehicle list!');
    console.log('   ✅ Vehicle list correctly isolated by organization.');

    // 8. Test CROSS-TENANT VEHICLE ACCESS BY ID
    console.log('\n8️⃣ Testing Cross-Tenant Direct ID Access Attack...');
    const crossAccess = await request('GET', `/vehicles/VEH-B-${orgCodeB}`, null, tokenA);
    assert.strictEqual(crossAccess.status, 404, 'Expected 404 for cross-tenant vehicle lookup');
    console.log('   ✅ Cross-tenant resource lookup safely rejected with 404.');

    // 9. Test CHAT USER SEARCH ISOLATION
    console.log('\n9️⃣ Testing Chat Users Isolation...');
    const chatUsersA = await request('GET', '/chat/users', null, tokenA);
    const chatUserEmailsA = chatUsersA.data.data.map((u) => u.email);
    assert.strictEqual(chatUserEmailsA.some((e) => e.includes('echofreight')), false, 'CRITICAL: Org B user leaked in Org A chat search!');
    console.log('   ✅ Chat search strictly isolates organization users.');

    // 10. Test DASHBOARD METRICS ISOLATION
    console.log('\n🔟 Testing Dashboard Analytics Isolation...');
    const dashA = await request('GET', '/dashboard/admin', null, tokenA);
    assert.strictEqual(dashA.data.data.totalVehicles, 1, 'Org A dashboard should count exactly 1 vehicle');
    assert.strictEqual(dashA.data.data.totalDrivers, 1, 'Org A dashboard should count exactly 1 driver');
    console.log('   ✅ Dashboard metrics count only tenant data (Total Vehicles: 1, Drivers: 1).');

    console.log('\n======================================================');
    console.log('🎉 ALL MULTI-TENANCY SECURITY TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ Security Test Failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testMultiTenancy();
}

module.exports = testMultiTenancy;
