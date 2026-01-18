# Railway Environment Variables - QR Frontend

Configure estas variables en el Railway Dashboard para el servicio `qr-front`:

## Variables Requeridas

```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://spectacular-smile-production.up.railway.app
EXPO_PUBLIC_SYSTEM_A_API_URL=https://ideal-motivation-production.up.railway.app

# Node Configuration
NODE_ENV=production
PORT=3001
```

## Cómo Configurar en Railway

1. Ve a tu proyecto en Railway Dashboard
2. Selecciona el servicio `qr-front`
3. Ve a la pestaña **Variables**
4. Agrega cada variable con su valor correspondiente
5. Railway redesplegará automáticamente con las nuevas variables

## Notas Importantes

- **EXPO_PUBLIC_API_BASE_URL**: URL de tu API de QR desplegada en Railway
- **EXPO_PUBLIC_SYSTEM_A_API_URL**: URL de tu Product API desplegada en Railway
- Las variables con prefijo `EXPO_PUBLIC_` son accesibles en el código del cliente
- Railway proporciona automáticamente la variable `PORT`, pero puedes especificar 3001 si lo prefieres

## Verificación

Después de configurar las variables:
1. Railway redesplegará automáticamente
2. Verifica los logs para confirmar que no hay errores de configuración
3. Prueba la aplicación accediendo a la URL de Railway
