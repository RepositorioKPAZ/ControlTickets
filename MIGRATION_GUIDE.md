# Guía de Migración: Supabase a MySQL

Esta guía te ayudará a migrar tu aplicación de Supabase a MySQL.

## 📋 Prerrequisitos

1. **MySQL Server** instalado y funcionando
2. **Node.js** versión 18 o superior
3. **Acceso a tu base de datos Supabase** actual

## 🚀 Pasos de Migración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo `env.example` a `.env` y configura las variables:

```bash
cp env.example .env
```

Edita `.env` con tus configuraciones:

```env
# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=tu_contraseña_aqui
MYSQL_DATABASE=ticket_system

# JWT Configuration
JWT_SECRET=tu-clave-super-secreta-cambia-esto-en-produccion

# Supabase (para migración)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
```

### 3. Crear Base de Datos MySQL

```sql
CREATE DATABASE ticket_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Ejecutar Esquema MySQL

```bash
mysql -u root -p ticket_system < database/schema.sql
```

### 5. Migrar Datos

```bash
node scripts/migrate-to-mysql.js
```

### 6. Verificar Migración

Revisa que todos los datos se hayan migrado correctamente:

```sql
USE ticket_system;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM tickets;
SELECT COUNT(*) FROM clients;
```

### 7. Cambiar Contraseñas de Usuarios

Los usuarios migrados tendrán la contraseña por defecto `changeme123`. Debes cambiarlas:

```sql
-- Ejemplo para cambiar contraseña de un usuario
UPDATE users SET password_hash = 'nuevo_hash_aqui' WHERE email = 'usuario@ejemplo.com';
```

## 🔧 Configuración de la Aplicación

### Actualizar Componentes

Los siguientes archivos han sido actualizados para usar MySQL:

- ✅ `src/integrations/mysql/client.ts` - Cliente MySQL
- ✅ `src/integrations/mysql/auth.ts` - Autenticación MySQL
- ✅ `src/components/auth/mysql-auth-guard.tsx` - Guard de autenticación
- ✅ `src/contexts/auth-context.tsx` - Contexto de autenticación
- ✅ `src/App.tsx` - Configuración principal
- ✅ `src/pages/Index.tsx` - Página principal

### Remover Dependencias de Supabase

```bash
npm uninstall @supabase/supabase-js
```

## 🧪 Probar la Aplicación

1. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Probar autenticación:**
   - Intenta hacer login con un usuario migrado
   - Verifica que el logout funcione
   - Prueba la recuperación de contraseña

3. **Probar funcionalidades:**
   - Crear tickets
   - Ver dashboard
   - Gestionar clientes
   - Ver reportes

## 🔒 Seguridad

### Variables de Entorno

- ✅ **JWT_SECRET**: Usa una clave fuerte y única
- ✅ **MYSQL_PASSWORD**: Usa contraseñas seguras
- ✅ **MYSQL_USER**: Evita usar 'root' en producción

### Base de Datos

- ✅ Configura firewall para MySQL
- ✅ Usa SSL/TLS para conexiones
- ✅ Limita permisos de usuario
- ✅ Habilita logging de auditoría

## 🐛 Solución de Problemas

### Error de Conexión MySQL

```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar conexión
mysql -u root -p -h localhost
```

### Error de Autenticación

```bash
# Verificar variables de entorno
echo $MYSQL_PASSWORD

# Probar conexión con credenciales
mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -h $MYSQL_HOST
```

### Error de Migración

```bash
# Verificar datos en Supabase
# Verificar permisos de MySQL
# Revisar logs de error
```

## 📊 Comparación: Supabase vs MySQL

| Característica | Supabase | MySQL |
|----------------|----------|-------|
| **Autenticación** | Built-in | JWT + bcrypt |
| **Base de Datos** | PostgreSQL | MySQL |
| **Hosting** | Cloud | Self-hosted |
| **Escalabilidad** | Automática | Manual |
| **Costo** | Variable | Fijo |
| **Control** | Limitado | Completo |

## 🔄 Rollback

Si necesitas volver a Supabase:

1. **Revertir cambios en código:**
   ```bash
   git checkout HEAD~1
   ```

2. **Reinstalar Supabase:**
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Restaurar archivos originales:**
   - `src/components/auth/auth-guard.tsx`
   - `src/integrations/supabase/`

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Revisa los logs de error
2. Verifica la configuración de MySQL
3. Confirma que las variables de entorno estén correctas
4. Verifica que el esquema se haya creado correctamente

## ✅ Checklist de Migración

- [ ] MySQL instalado y configurado
- [ ] Variables de entorno configuradas
- [ ] Esquema de base de datos creado
- [ ] Datos migrados exitosamente
- [ ] Contraseñas de usuarios actualizadas
- [ ] Aplicación funcionando con MySQL
- [ ] Todas las funcionalidades probadas
- [ ] Dependencias de Supabase removidas
- [ ] Documentación actualizada

---

¡Felicitaciones! 🎉 Has migrado exitosamente tu aplicación de Supabase a MySQL.
