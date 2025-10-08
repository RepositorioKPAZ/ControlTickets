// Usar fetch nativo (disponible en Node.js 18+)

async function testAuth() {
  try {
    console.log('🧪 Probando autenticación...');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'rdelafuente@kpaz.la',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Autenticación exitosa!');
      console.log('Usuario:', data.user);
      console.log('Token:', data.token.substring(0, 50) + '...');
    } else {
      console.log('❌ Error de autenticación:');
      console.log('Status:', response.status);
      console.log('Error:', data.error);
    }
    
  } catch (error) {
    console.error('💥 Error de conexión:', error.message);
  }
}

// Ejecutar el test
testAuth().then(() => {
  console.log('\n🎉 Test completado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
