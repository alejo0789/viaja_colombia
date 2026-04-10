# Sistema de Solicitud de Vehículos vía WhatsApp – Plan de Implementación

## Descripción General

**ViajaColobia** es una plataforma multi-tenant B2B que permite a empresas clientes solicitar servicios de transporte a través de WhatsApp. El sistema integra un chatbot conversacional para la toma de solicitudes, un flujo de autorización por supervisor y un panel de administración web para la gestión operativa y asignación de conductores.

---

## Revisión de Usuario Requerida

> [!IMPORTANT]
> El plan está dividido en **4 fases** para desarrollo incremental. Confirmar si el orden y alcance de cada fase es el correcto antes de proceder.

> [!WARNING]
> El sistema requiere integración con la **API oficial de WhatsApp Business (Meta)**. Esto requiere una cuenta Meta Business verificada y aprobación del número de teléfono. Confirmar si ya se tiene acceso o si se usará un proveedor intermedio (ej. Evolution API, Twilio, etc.).

> [!CAUTION]
> La gestión de conductores (base, disponibilidad, geolocalización) **no está incluida en la Fase 1**. Si se necesita para el lanzamiento inicial, debe reordenarse.

---

## Stack Tecnológico ✅ Confirmado

| Capa | Tecnología | Justificación |
|---|---|---|
| **Backend API** | **Python + FastAPI** | Rápido, tipado, ideal como cerebro del sistema |
| **Base de Datos** | PostgreSQL | Relacional, multi-tenant, soporte JSON |
| **Frontend** | Next.js (React) | Dashboard admin potente y moderno |
| **WhatsApp** | **Meta Cloud API Oficial + n8n** | Recepción/envío de mensajes vía webhook n8n; FastAPI decide la lógica |
| **Orquestador de Mensajes** | **n8n** | Recibe webhooks de Meta, los reenvía al backend; el backend le dice a n8n qué mensaje enviar y a quién |
| **Autenticación** | JWT + Roles (Admin, Supervisor, Usuario) | Control de acceso granular |
| **Almacenamiento** | Cloudinary o S3 | Archivos Excel de importación |
| **Notificaciones** | WhatsApp (vía n8n) + Email | Alertas al admin, supervisores y usuarios |
| **Hosting** | VPS (mismo servidor existente) | Consistencia con proyectos actuales |

---

## Modelo de Datos

```
Empresa (companies)
├── id, nombre, nit, telefono, activa
├── → Supervisores (1:N)
└── → Usuarios (1:N)

Supervisor (supervisors)
├── id, empresa_id, nombre, whatsapp, email, activo
└── → puede ver todos los servicios de su empresa

Usuario (users)
├── id, empresa_id, nombre, whatsapp, email, activo
└── → registrado por supervisor (formulario o Excel)

Servicio (services)
├── id, usuario_id, empresa_id, supervisor_id, conductor_id
├── direccion_origen, direccion_destino, hora_programada
├── estado: [PENDIENTE | AUTORIZADO | RECHAZADO | ASIGNADO | EN_CURSO | COMPLETADO | CANCELADO]
├── encuesta_calificacion (1-5), encuesta_comentario
├── created_at, updated_at
└── → historial de estados (service_status_log)

Conductor (drivers)
├── id, nombre, telefono, vehiculo, placa
├── disponible (bool), en_servicio (bool)
├── horario_disponibilidad (JSON: días y horas)
└── → asignado por administrador

Sesion WhatsApp (wa_sessions)
├── id, whatsapp_number, paso_actual, datos_temporales (JSON)
└── → controla el flujo conversacional del bot
```

> **Número único de WhatsApp** ✅ para todas las empresas. El sistema identifica la empresa del usuario por su número registrado en la BD.

---

## Flujo Principal del Sistema

### Arquitectura de Mensajería

```
[META CLOUD API] ──webhook──▶ [n8n] ──POST──▶ [FastAPI Backend]
                                                      │
                                              lógica de negocio
                                                      │
                               ◀──── instrucción: "enviar mensaje X al número Y" ────
[META CLOUD API] ◀──API call── [n8n]
```

### Flujo Conversacional Completo

```
1.  Usuario escribe al número único de WhatsApp
2.  n8n recibe el webhook de Meta y lo reenvía al FastAPI
3.  FastAPI identifica al usuario por su número de WhatsApp (BD)
    → Si no está registrado: responde "No estás registrado. Contacta a tu supervisor."
4.  FastAPI consulta la sesión activa del usuario (wa_sessions)
5.  Bot solicita secuencialmente (mediante n8n):
    a. Dirección de recogida
    b. Dirección de destino
    c. Fecha y hora programada
6.  FastAPI muestra resumen y pide confirmación
7.  Sistema crea solicitud en estado PENDIENTE
8.  FastAPI ordena a n8n enviar WhatsApp al Supervisor de la empresa:
    "Nuevo servicio de [nombre]: [origen] → [destino] el [fecha/hora]. ¿Autoriza? SI / NO"
9.  Supervisor responde:
    → SI: servicio pasa a AUTORIZADO; se notifica al usuario y al admin
    → NO: servicio pasa a RECHAZADO; se notifica al usuario la razón
10. Administrador asigna conductor disponible → estado ASIGNADO
11. n8n notifica al usuario: nombre del conductor, placa, teléfono
12. Al completar el servicio → FastAPI ordena a n8n enviar encuesta al usuario:
    "¿Cómo calificarías tu servicio? Responde del 1 al 5" + campo de comentario
```

---

## Desglose por Fases

---

### 🚀 FASE 1 – Núcleo del Sistema (MVP)
**Objetivo:** Tener el flujo completo funcional de extremo a extremo.

#### Backend (Python + FastAPI)
- [ ] Setup proyecto FastAPI + PostgreSQL
- [ ] Modelo de base de datos (empresas, supervisores, usuarios, servicios, wa_sessions)
- [ ] Webhook endpoint para recibir mensajes desde n8n
- [ ] Motor de sesiones conversacionales (máquina de estados por número de WhatsApp)
- [ ] Flujo bot: identificación → recogida → destino → hora → confirmación
- [ ] Flujo autorización supervisor (SI/NO por WhatsApp)
- [ ] Cambio de estado automático tras autorización
- [ ] Notificación al administrador (WhatsApp vía n8n) cuando hay servicio nuevo
- [ ] API REST para el dashboard

#### Frontend (Dashboard Admin – Next.js)
- [ ] Login con roles (Admin, Supervisor)
- [ ] Vista: listado de servicios con estados y filtros
- [ ] Acción: asignar conductor a un servicio
- [ ] Vista: gestión de empresas (CRUD básico)
- [ ] Vista: gestión de supervisores por empresa
- [ ] Vista: gestión de conductores

#### Integración n8n
- [ ] Workflow n8n: recibir webhook Meta → POST a FastAPI
- [ ] Workflow n8n: recibir instrucción de FastAPI → enviar mensaje por Meta API

---

### 🏢 FASE 2 – Gestión Avanzada de Usuarios y Empresas
**Objetivo:** Dar autonomía a los supervisores para gestionar sus equipos.

- 
- [ ] Importación masiva de usuarios vía Excel (.xlsx)
- [ ] Dashboard del supervisor:
  - Servicios solicitados por su empresa
  - Filtros por usuario, fecha, estado
  - Estadísticas básicas (total por mes, por estado)
- [ ] Gestión de múltiples supervisores por empresa
- [ ] Activar/desactivar usuarios desde supervisión

---

### 📊 FASE 3 – Reportes, Analítica y Disponibilidad de Conductores
**Objetivo:** Visibilidad operativa completa y gestión de flota.

#### Disponibilidad de Conductores ✅
- [ ] Gestión de horarios de conductores (días y franjas horarias disponibles)
- [ ] Estado en tiempo real: Disponible / En servicio / No disponible
- [ ] Al asignar un servicio, el admin solo ve conductores disponibles en la hora programada
- [ ] El conductor cambia a "En servicio" al iniciar y a "Disponible" al completar
- [ ] Vista de agenda de conductores disponibles por hora

#### Reportes
- [ ] Dashboard admin: métricas globales (servicios por empresa, por estado, por conductor)
- [ ] Exportación de reportes a Excel/PDF
- [ ] Historial de estados por servicio (trazabilidad completa)
- [ ] Reporte de conductores: servicios asignados, completados, horas trabajadas
- [ ] Notificaciones en tiempo real (WebSockets o polling) para el admin

#### Encuestas de Satisfacción ✅
- [ ] Al marcar un servicio como COMPLETADO, el bot envía automáticamente la encuesta al usuario
- [ ] Encuesta: calificación 1-5 estrellas + comentario opcional
- [ ] Dashboard con promedio de calificaciones por conductor y por empresa
- [ ] Reporte de NPS / satisfacción por período

---

### 🔔 FASE 4 – Experiencia Avanzada y Automatización
**Objetivo:** Pulir la experiencia y escalar.

- [ ] Cancelación de servicio por WhatsApp (usuario o supervisor)
- [ ] Recordatorio automático 30 min antes del servicio
- [ ] Portal de auto-registro para nuevas empresas
- [ ] App móvil para conductores (seguimiento en tiempo real)
- [ ] Múltiples instancias de n8n / números WhatsApp si se requiere escalar

---

## Decisiones Confirmadas ✅

> [!NOTE]
> ✅ **WhatsApp**: Meta Cloud API Oficial conectada a **n8n** como orquestador de mensajes. FastAPI actúa como cerebro: recibe eventos de n8n y le ordena qué mensajes enviar y a quién.

> [!NOTE]
> ✅ **Backend**: Python + FastAPI con PostgreSQL.

> [!NOTE]
> ✅ **Número único de WhatsApp** para todas las empresas. Identificación por número de teléfono registrado.

> [!NOTE]
> ✅ **Fase 3** incluirá gestión de disponibilidad de conductores.

> [!NOTE]
> ✅ **Encuesta de satisfacción** al finalizar el servicio (1-5 estrellas + comentario), enviada automáticamente por WhatsApp.

---

## Preguntas Abiertas

> [!IMPORTANT]
> **¿Los conductores son empleados propios** de la empresa transportadora, o también pueden ser externos/contratistas? ¿Se necesita algún control para ellos desde la Fase 1?

> [!WARNING]
> **¿Ya existe un dominio/VPS** para este proyecto, o se necesita contemplar la contratación de infraestructura?

---

## Plan de Verificación

### Fase 1
1. Prueba end-to-end del flujo WhatsApp completo (solicitud → autorización → notificación admin)
2. Login y roles correctamente restringidos en el dashboard
3. Asignación de conductor desde la plataforma
4. Cambio de estado reflejado en tiempo real

### Fase 2
1. Registro de usuario via link funciona en móvil
2. Importación Excel con validaciones de errores
3. Dashboard supervisor muestra solo los servicios de su empresa
