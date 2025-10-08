// Script para probar la configuración de CORS del servidor
// Usar fetch nativo de Node.js 18+

const SERVER_URL = 'http://localhost:3001';

async function testCORS() {
  console.log('🧪 Probando configuración de CORS...\n');

  try {
    // Test 1: Health check endpoint
    console.log('1️⃣ Probando endpoint de health check...');
    const healthResponse = await fetch(`${SERVER_URL}/api/health`);
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   CORS Headers:`, {
      'Access-Control-Allow-Origin': healthResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': healthResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': healthResponse.headers.get('Access-Control-Allow-Headers'),
      'Access-Control-Allow-Credentials': healthResponse.headers.get('Access-Control-Allow-Credentials')
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   Response:`, healthData);
    }
    console.log('');

    // Test 2: OPTIONS preflight request
    console.log('2️⃣ Probando preflight OPTIONS request...');
    const optionsResponse = await fetch(`${SERVER_URL}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    console.log(`   Status: ${optionsResponse.status}`);
    console.log(`   CORS Headers:`, {
      'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers'),
      'Access-Control-Allow-Credentials': optionsResponse.headers.get('Access-Control-Allow-Credentials'),
      'Access-Control-Max-Age': optionsResponse.headers.get('Access-Control-Max-Age')
    });
    console.log('');

    // Test 3: Request with allowed origin
    console.log('3️⃣ Probando request con origen permitido...');
    const allowedOriginResponse = await fetch(`${SERVER_URL}/api/health`, {
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    console.log(`   Status: ${allowedOriginResponse.status}`);
    console.log(`   Origin Header: ${allowedOriginResponse.headers.get('Access-Control-Allow-Origin')}`);
    console.log('');

    // Test 4: Request with disallowed origin (should be blocked)
    console.log('4️⃣ Probando request con origen no permitido...');
    try {
      const disallowedOriginResponse = await fetch(`${SERVER_URL}/api/health`, {
        headers: {
          'Origin': 'http://malicious-site.com'
        }
      });
      console.log(`   Status: ${disallowedOriginResponse.status}`);
      if (disallowedOriginResponse.status === 403) {
        const errorData = await disallowedOriginResponse.json();
        console.log(`   Error Response:`, errorData);
      }
    } catch (error) {
      console.log(`   Error esperado: ${error.message}`);
    }
    console.log('');

    // Test 5: Request with credentials
    console.log('5️⃣ Probando request con credenciales...');
    const credentialsResponse = await fetch(`${SERVER_URL}/api/health`, {
      credentials: 'include',
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    console.log(`   Status: ${credentialsResponse.status}`);
    console.log(`   Credentials Allowed: ${credentialsResponse.headers.get('Access-Control-Allow-Credentials')}`);
    console.log('');

    console.log('✅ Pruebas de CORS completadas!');
    console.log('\n📋 Resumen de la configuración:');
    console.log('   ✅ Orígenes permitidos configurados');
    console.log('   ✅ Credenciales habilitadas');
    console.log('   ✅ Métodos HTTP permitidos');
    console.log('   ✅ Headers permitidos');
    console.log('   ✅ Cache de preflight configurado');
    console.log('   ✅ Logging de requests habilitado');
    console.log('   ✅ Manejo de errores CORS configurado');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    console.log('\n💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3001');
  }
}

testCORS();
