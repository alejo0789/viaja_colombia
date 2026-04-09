# VIAJA COL V2 - Transporte Preferencial Terrestre

Sistema integral de gestión de transporte terrestre preferencial con WhatsApp integrado, autenticación JWT, y base de datos PostgreSQL mediante Neon.

## Descripción General

VIAJA COL V2 es una plataforma moderna para gestionar reservas de transporte terrestre, con soporte para múltiples roles de usuario, integración de WhatsApp para notificaciones, motor de tarifa dinámico, y sistema de alertas en tiempo real.

## Arquitectura

### Stack Tecnológico

**Frontend:**
- React 18 con TypeScript
- Vite como bundler
- Tailwind CSS para estilos
- shadcn/ui para componentes
- React Router para navegación
- TanStack Query para datos
- Recharts para visualización

**Backend:**
- Express.js con TypeScript
- Neon PostgreSQL
- JWT (jsonwebtoken) para autenticación
- bcrypt para hash de contraseñas
- Meta Business Cloud API para WhatsApp

**Base de Datos:**
- PostgreSQL (Neon)
- Migraciones con pg

## Roles de Usuario

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **Admin** | Administrador del sistema | Gestión completa de usuarios, tarifas, configuración |
| **Operador** | Gestor de rutas y viajes | Crear y modificar viajes, asignar conductores |
| **Conductor** | Conductor de transporte | Ver asignaciones, registrar estado, reportes |
| **Usuario Final** | Pasajero/Cliente | Realizar reservas, ver historial, soporte |

## Estructura del Proyecto

```
VIAJA-COL-V2/
├── src/
│   ├── components/          # Componentes React reutilizables
│   ├── pages/              # Páginas de la aplicación
│   ├── hooks/              # Custom hooks
│   ├── services/           # Servicios API
│   ├── types/              # Tipos TypeScript
│   ├── utils/              # Utilidades
│   ├── styles/             # Estilos globales
│   └── App.tsx             # Componente raíz
├── server/                 # Backend Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.ts
│   ├── .env                # Variables de entorno
│   └── package.json
├── package.json            # Frontend
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── components.json
├── index.html
├── .env.example
├── .gitignore
└── README.md
```

## Inicio Rápido

### Requisitos Previos
- Node.js 18+
- npm o yarn
- Cuenta Neon PostgreSQL
- Credenciales Meta Business Cloud (WhatsApp)

### 1. Configurar Base de Datos Neon

1. Crear proyecto en [Neon](https://console.neon.tech/)
2. Obtener connection string: `postgresql://user:password@host/dbname`
3. Guardar en `server/.env` como `DATABASE_URL`

### 2. Variables de Entorno

**Frontend (`.env`):**
```bash
VITE_API_URL=http://localhost:3001
```

**Backend (`server/.env`):**
```bash
# Base de Datos
DATABASE_URL=postgresql://user:password@host/dbname

# Autenticación
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# WhatsApp Meta
WHATSAPP_TOKEN=your_meta_business_token
WHATSAPP_PHONE_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Servidor
PORT=3001
NODE_ENV=development
```

### 3. Instalación y Ejecución

```bash
# Instalar dependencias frontend
npm install

# Instalar dependencias backend
cd server
npm install
cd ..

# Ejecutar frontend (puerto 8080)
npm run dev

# En otra terminal, ejecutar backend (puerto 3001)
cd server
npm run dev
```

Acceder a http://localhost:8080

## Variables de Entorno Detalladas

### Frontend
- `VITE_API_URL`: URL del servidor backend (default: http://localhost:3001)

### Backend

**Base de Datos:**
- `DATABASE_URL`: Connection string PostgreSQL de Neon

**Autenticación:**
- `JWT_SECRET`: Clave secreta para firmar JWT (min 32 caracteres)
- `JWT_EXPIRES_IN`: Tiempo de expiración del token (default: 7d)

**WhatsApp:**
- `WHATSAPP_TOKEN`: Token de acceso Meta Business Cloud
- `WHATSAPP_PHONE_ID`: ID del número de teléfono WhatsApp registrado
- `WHATSAPP_BUSINESS_ACCOUNT_ID`: ID de la cuenta comercial Meta

**Servidor:**
- `PORT`: Puerto en el que escucha el servidor (default: 3001)
- `NODE_ENV`: Entorno (development, production)

## Motor de Tarifa

El sistema calcula dinámicamente las tarifas basado en:

1. **Distancia**: Tarifa base por kilómetro
2. **Demanda**: Multiplicador según ocupación actual
3. **Horario**: Ajuste por hora del día
4. **Ruta**: Tarifas específicas por rutas
5. **Vehículo**: Variación por tipo de transporte

Fórmula:
```
Tarifa Final = (Tarifa Base × Distancia) × Factor Demanda × Factor Horario
```

## Sistema de Alertas

Sistema reactivo que notifica a usuarios en tiempo real:

- **Reserva Confirmada**: WhatsApp al confirmar booking
- **Cambio de Estado**: Notificaciones cuando viaje inicia/termina
- **Retraso**: Alerta si hay demoras
- **Promociones**: Ofertas especiales por WhatsApp
- **Servicio Técnico**: Alertas para problemas operacionales

Las alertas se envían vía:
- WhatsApp (Meta Business Cloud API)
- Email (integración futura)
- Notificaciones Push (integración futura)

## Resumen de Endpoints API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout

### Usuarios
- `GET /api/users/:id` - Obtener perfil
- `PUT /api/users/:id` - Actualizar perfil
- `GET /api/users` - Listar usuarios (Admin)

### Viajes
- `GET /api/trips` - Listar viajes
- `POST /api/trips` - Crear viaje
- `GET /api/trips/:id` - Obtener viaje
- `PUT /api/trips/:id` - Actualizar viaje
- `POST /api/trips/:id/cancel` - Cancelar viaje

### Reservas
- `POST /api/bookings` - Crear reserva
- `GET /api/bookings/:id` - Obtener reserva
- `PUT /api/bookings/:id` - Actualizar reserva
- `POST /api/bookings/:id/confirm` - Confirmar reserva

### Tarifas
- `GET /api/fares` - Listar tarifas
- `POST /api/fares/calculate` - Calcular tarifa

### WhatsApp
- `POST /api/whatsapp/send` - Enviar mensaje
- `POST /api/whatsapp/webhook` - Webhook de Meta

### Alertas
- `GET /api/alerts` - Listar alertas
- `POST /api/alerts` - Crear alerta
- `PUT /api/alerts/:id/read` - Marcar como leída

## Desarrollo

### Scripts Disponibles

```bash
# Frontend
npm run dev        # Desarrollo con hot reload
npm run build      # Build para producción
npm run preview    # Vista previa del build
npm run lint       # Verificar TypeScript

# Backend
cd server
npm run dev        # Desarrollo con nodemon
npm run build      # Compilar TypeScript
npm run start      # Ejecutar compilado
npm run db:setup   # Inicializar base de datos
npm run db:seed    # Poblar datos de prueba
```

## Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- JWT con expiración configurable
- CORS habilitado para frontend
- Validación de entrada en todos los endpoints
- Protección contra inyección SQL via ORM
- Rate limiting en endpoints sensibles

## Contribución

Para contribuir al proyecto:

1. Crear rama desde `main`
2. Realizar cambios y commits descriptivos
3. Push a la rama
4. Crear Pull Request

## Licencia

Propietario - VIAJA COL 2026

## Soporte

Para reportar bugs o solicitar features, contactar al equipo de desarrollo.
