# VIAJA-COL API Endpoints Reference

## Authentication

All endpoints require: `Authorization: Bearer <token>`

Token format: `userId:rol:empresaClienteId:empresaTransportistaId`

## Admin Routes (`/api/admin`) - Rol 1

### Dashboard & Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard stats (solicitudes by estado, active conductores/vehicles, open alerts) |
| GET | `/ranking-conductores` | Conductor ranking (last 30 days) |

### Solicitudes Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/solicitudes` | List solicitudes (queryParams: estado, page, limit) |
| GET | `/solicitudes/:id` | Single solicitud detail with asignacion |
| POST | `/asignar-servicio` | Assign service to conductor (body: solicitud_id, conductor_id) |

### Conductor Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/conductores` | List all conductores with assigned vehicle |
| POST | `/conductores` | Create conductor (body: nombre, cedula, telefono, email) |
| PUT | `/conductores/:id` | Update conductor |

### Vehicle Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vehiculos` | List all vehiculos |
| POST | `/vehiculos` | Create vehicle (body: conductor_id, placa, marca, modelo, anio, capacidad_pasajeros) |
| PUT | `/vehiculos/:id` | Update vehicle |

### Service Type Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tipos-servicio` | List service types with tariff info |
| PUT | `/tipos-servicio/:id` | Update tariff fields |

### Company Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/empresas` | List client companies |
| POST | `/empresas` | Create company (body: nombre, email, telefono, nit, direccion, ciudad, contacto_*) |

### Alert Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alertas` | List unresolved alerts (resuelta=false) |
| PUT | `/alertas/:id/leer` | Mark alert as read |
| PUT | `/alertas/:id/resolver` | Resolve alert (body: notas_resolucion?) |

---

## Conductor Routes (`/api/conductor`) - Rol 2

### Today's Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/servicios-hoy` | Today's assigned services (DATE = today, ordered by hora_programada) |

### All Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/servicios` | All assigned services (queryParams: page, limit, estado) |
| GET | `/servicio/:id` | Single service detail |

### Service Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/iniciar-servicio` | Start service (body: asignacion_id, cedula_pasajero) |
| POST | `/finalizar-servicio` | End service (body: asignacion_id, notas?) |

### History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/historial` | Past finalizadas services (queryParams: page, limit, desde, hasta) |

---

## Autorizador Routes (`/api/autorizador`) - Rol 4

### Solicitude Authorization
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/solicitudes` | List solicitudes for this empresa_cliente (queryParams: page, limit, estado) |
| POST | `/autorizar` | Authorize/reject solicitud (body: solicitud_id, autorizado, observaciones?) |

### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/estadisticas` | Company stats (total, finalizados, cancelados, costs, duration, exceedents) |

### Employee Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/empleados` | List authorized employees (queryParams: page, limit) |
| POST | `/empleados` | Create employee (body: cedula, nombre, email, telefono, cargo, departamento, limite_mensual?) |
| PUT | `/empleados/:id` | Update employee |
| DELETE | `/empleados/:id` | Soft delete employee (estado='inactivo') |

---

## Reports Routes (`/api/reportes`) - Rol 1

### Aggregated Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/servicios-por-dia` | GROUP BY date (queryParams: desde, hasta) |
| GET | `/por-tipo-servicio` | GROUP BY service type (queryParams: desde, hasta) |
| GET | `/excedentes` | Services with overtime charges (queryParams: desde, hasta, page, limit) |

### Tariff Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/simular-tarifa` | Simulate tariff (queryParams: tipo_servicio_id, duracion_min, es_nocturno?, es_festivo?) |

### Data Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exportar` | Export services as JSON (queryParams: desde, hasta) |

---

## Query Parameters Reference

### Common Parameters
- `page` (default: 1) - Page number for pagination
- `limit` (default: 20) - Items per page
- `desde` - Start date (YYYY-MM-DD format)
- `hasta` - End date (YYYY-MM-DD format)
- `estado` - Filter by estado field

### Pagination
```
GET /api/admin/solicitudes?page=1&limit=20&estado=autorizada
```

### Date Range
```
GET /api/reportes/servicios-por-dia?desde=2024-01-01&hasta=2024-01-31
```

---

## HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Data retrieved/updated |
| 400 | Bad Request | Invalid cedula, missing fields |
| 401 | Unauthorized | No token, invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database error |

---

## Response Examples

### List Response (Success)
```json
{
  "data": [
    {"id": "1", "nombre": "Solicitud 1", "estado": "autorizada"},
    {"id": "2", "nombre": "Solicitud 2", "estado": "asignada"}
  ]
}
```

### Single Item Response (Success)
```json
{
  "data": {
    "id": "1",
    "nombre": "John Doe",
    "cedula": "12345678",
    "estado": "activo"
  }
}
```

### Error Response
```json
{
  "error": "Solicitud no encontrada"
}
```

---

## Request Body Examples

### Assign Service
```json
{
  "solicitud_id": "sol-123",
  "conductor_id": "cond-456"
}
```

### Start Service
```json
{
  "asignacion_id": "asig-789",
  "cedula_pasajero": "98765432"
}
```

### Finalize Service
```json
{
  "asignacion_id": "asig-789",
  "notas": "Service completed successfully"
}
```

### Authorize Solicitude
```json
{
  "solicitud_id": "sol-123",
  "autorizado": true,
  "observaciones": "Approved"
}
```

### Create Conductor
```json
{
  "nombre": "Juan Perez",
  "cedula": "12345678",
  "telefono": "+573001234567",
  "email": "juan@example.com"
}
```

### Create Vehicle
```json
{
  "conductor_id": "cond-123",
  "placa": "ABC-1234",
  "marca": "Toyota",
  "modelo": "Corolla",
  "anio": 2023,
  "capacidad_pasajeros": 4
}
```

### Update Service Type Tariff
```json
{
  "nombre": "Ejecutivo",
  "tarifa_base": 50000,
  "tiempo_maximo_min": 30,
  "costo_extra": 5000,
  "bloque_min": 15,
  "recargo_nocturnidad_pct": 20,
  "recargo_festivo_pct": 15
}
```

### Create Company
```json
{
  "nombre": "Acme Corp",
  "email": "contact@acme.com",
  "telefono": "+573001234567",
  "nit": "900123456",
  "direccion": "Calle 1 #2-3",
  "ciudad": "Bogotá",
  "contacto_nombre": "Manager",
  "contacto_email": "manager@acme.com",
  "contacto_telefono": "+573001234567"
}
```

### Create Employee
```json
{
  "cedula": "12345678",
  "nombre": "Employee Name",
  "email": "employee@company.com",
  "telefono": "+573001234567",
  "cargo": "Director",
  "departamento": "Ventas",
  "limite_mensual": 30
}
```

---

## Rate Limiting & Pagination Best Practices

### Always Paginate Large Results
```
GET /api/admin/solicitudes?page=1&limit=20
GET /api/admin/solicitudes?page=2&limit=20  // Next page
```

### Use Filters to Reduce Results
```
GET /api/admin/solicitudes?estado=autorizada&page=1&limit=20
```

### Date Filtering
```
GET /api/reportes/servicios-por-dia?desde=2024-01-01&hasta=2024-01-31
```

---

## Token Examples

### Admin User
```
Bearer 550e8400-e29b-41d4-a716-446655440000:1:ec-123:et-456
```

### Conductor User
```
Bearer 660e8400-e29b-41d4-a716-446655440111:2:ec-123:et-456
```

### Autorizador User
```
Bearer 770e8400-e29b-41d4-a716-446655440222:4:ec-123:et-456
```

---

## Troubleshooting

### 401 Unauthorized
- Check Authorization header is present
- Verify token format: `userId:rol:empresaClienteId:empresaTransportistaId`
- Verify user exists and is active (rol > 0)

### 403 Forbidden
- Verify user has correct rol for endpoint
- For autorizador endpoints, verify empresaClienteId in token

### 404 Not Found
- Verify resource ID exists
- Check database for missing data

### 400 Bad Request
- Verify all required fields in request body
- Check data types (cedula format, date formats)
- Verify enum values (estado must be valid)

### 500 Server Error
- Check database connection
- Review server logs
- Verify table schemas match expected structure

