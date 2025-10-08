# Configuración de CORS

## Descripción

Se ha implementado una configuración robusta de CORS (Cross-Origin Resource Sharing) en el backend para permitir solicitudes seguras desde el frontend.

## Configuración Implementada

### Orígenes Permitidos

Los siguientes orígenes están configurados como permitidos:

**Desarrollo:**
- `http://localhost:5173` - Vite dev server
- `http://localhost:3000` - React dev server  
- `http://localhost:4173` - Vite preview
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:4173`

**Producción:**
- Comentados en el código para agregar cuando estén disponibles:
  - `https://tu-dominio.com`
  - `https://www.tu-dominio.com`

### Características de Seguridad

1. **Validación de Origen**: Solo permite solicitudes desde orígenes específicos
2. **Credenciales**: Habilita el envío de cookies y headers de autorización
3. **Métodos HTTP**: Permite GET, POST, PUT, DELETE, OPTIONS
4. **Headers Permitidos**:
   - Origin
   - X-Requested-With
   - Content-Type
   - Accept
   - Authorization
   - Cache-Control
   - Pragma

5. **Cache de Preflight**: 24 horas para optimizar rendimiento
6. **Logging**: Registra todas las solicitudes y errores de CORS
7. **Manejo de Errores**: Respuestas específicas para errores de CORS

## Archivos Modificados

### `server/index.js`

```javascript
// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // React dev server
      'http://localhost:4173', // Vite preview
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:4173',
      // Agregar aquí los dominios de producción cuando estén disponibles
      // 'https://tu-dominio.com',
      // 'https://www.tu-dominio.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400 // Cache preflight requests for 24 hours
};
```

## Pruebas

### Script de Prueba

Se incluye un script de prueba en `scripts/test-cors.cjs` que verifica:

1. ✅ Endpoint de health check
2. ✅ Solicitudes preflight OPTIONS
3. ✅ Solicitudes con origen permitido
4. ✅ Bloqueo de orígenes no permitidos
5. ✅ Solicitudes con credenciales

### Ejecutar Pruebas

```bash
cd scripts
node test-cors.cjs
```

## Logs

El servidor registra automáticamente:

- 🌐 Todas las solicitudes con método, path y origen
- 🚫 Solicitudes bloqueadas por CORS
- ✅ Solicitudes exitosas

## Configuración para Producción

Para configurar en producción:

1. **Agregar dominios de producción** en `allowedOrigins`
2. **Configurar variables de entorno** si es necesario
3. **Verificar certificados SSL** para HTTPS
4. **Probar con el script de CORS**

### Ejemplo para Producción:

```javascript
const allowedOrigins = [
  'https://tu-app.com',
  'https://www.tu-app.com',
  'https://admin.tu-app.com'
];
```

## Seguridad

- ✅ Solo orígenes específicos permitidos
- ✅ Validación de métodos HTTP
- ✅ Headers controlados
- ✅ Logging de solicitudes
- ✅ Manejo de errores específico
- ✅ Cache optimizado

## Dependencias

- `cors`: ^2.8.5 (ya instalado)
- `@types/cors`: ^2.8.19 (ya instalado)

## Notas Importantes

1. **Desarrollo**: La configuración actual permite todos los puertos de desarrollo comunes
2. **Producción**: Agregar dominios específicos antes de desplegar
3. **Logging**: Revisar logs para detectar intentos de acceso no autorizados
4. **Mantenimiento**: Actualizar lista de orígenes según necesidades del proyecto
