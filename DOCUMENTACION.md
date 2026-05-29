# Documentación del Sistema de Reservas U-SALA

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Backend](#2-backend)
   - 2.1 [Configuraciones globales](#21-configuraciones-globales)
   - 2.2 [Middleware de autenticación](#22-middleware-de-autenticación)
   - 2.3 [Validador de reservas (ReservationValidator)](#23-validador-de-reservas-reservationvalidator)
   - 2.4 [Servicio de reservas (ReservaService)](#24-servicio-de-reservas-reservaservice)
   - 2.5 [Controlador de reservas (ReservaController)](#25-controlador-de-reservas-reservacontroller)
   - 2.6 [Rutas de reservas](#26-rutas-de-reservas)
   - 2.7 [Base de datos](#27-base-de-datos)
3. [Frontend](#3-frontend)
   - 3.1 [Servicios frontend](#31-servicios-frontend)
   - 3.2 [ReservaForm](#32-reservaform)
   - 3.3 [ReservaModal](#33-reservamodal)
   - 3.4 [CalendarView](#34-calendarview)
   - 3.5 [Dashboard (Admin)](#35-dashboard-admin)
   - 3.6 [DocenteDashboard](#36-docentedashboard)
   - 3.7 [UsuarioDashboard](#37-usuariodashboard)
   - 3.8 [Header](#38-header)
4. [Flujo completo de creación de reserva](#4-flujo-completo-de-creación-de-reserva)
5. [Flujo de aprobación/rechazo](#5-flujo-de-aprobaciónrechazo)
6. [Roles y permisos](#6-roles-y-permisos)
7. [Reglas de negocio](#7-reglas-de-negocio)
8. [API endpoints](#8-api-endpoints)

---

## 1. Arquitectura General

El proyecto se divide en dos aplicaciones independientes:

```
U-SALA/
├── backend-reserva-miumg/     # Express + PostgreSQL
│   └── src/
│       ├── config/             # Configuraciones (DB, roles, estados)
│       ├── controllers/        # Manejadores de rutas
│       ├── db/                 # Schema SQL y migraciones
│       ├── middleware/         # Autenticación y autorización
│       ├── routes/             # Definición de rutas Express
│       └── services/           # Lógica de negocio y acceso a BD
│
└── frontend-reserva-miumg/    # React 19 + Vite
    └── src/
        ├── components/         # Componentes React
        ├── config/             # Configuración (URL de API)
        ├── context/            # AuthContext (estado global de usuario)
        └── services/           # Llamadas HTTP al backend
```

**Stack tecnológico:**
- Backend: Node.js + Express 5 + PostgreSQL (raw SQL con `pg`)
- Frontend: React 19 + Vite + FullCalendar + Axios
- Autenticación: JWT con roles (admin=1, docente=2, usuario=3)
- Estilos: CSS-in-JS (objetos de estilo inline), sin librería UI externa

---

## 2. Backend

### 2.1 Configuraciones globales

#### `src/config/roles.js`

Define los roles del sistema como constantes numéricas:

```js
const ROLES = {
    ADMINISTRADOR: 1,
    DOCENTE: 2,
    USUARIO: 3
};
```

Se usa en toda la app para autorización.

#### `src/config/estadosReserva.js`

Define los 5 estados del ciclo de vida de una reserva y las transiciones permitidas:

| Estado | Constante | Descripción |
|--------|-----------|-------------|
| `pendiente` | `ESTADOS_RESERVA.PENDIENTE` | Creada, esperando aprobación |
| `aprobada` | `ESTADOS_RESERVA.APROBADA` | Aceptada por admin |
| `rechazada` | `ESTADOS_RESERVA.RECHAZADA` | Rechazada por admin con motivo |
| `cancelada` | `ESTADOS_RESERVA.CANCELADA` | Cancelada por admin o propietario |
| `finalizada` | `ESTADOS_RESERVA.FINALIZADA` | Evento ya ocurrió |

**Transiciones válidas:**

```
PENDIENTE → APROBADA | RECHAZADA | CANCELADA
APROBADA  → CANCELADA | FINALIZADA
RECHAZADA → (ninguna)
CANCELADA → (ninguna)
FINALIZADA → (ninguna)
```

**`ESTADOS_ACTIVOS`**: Array `['pendiente', 'aprobada']` — usado para detectar conflictos (solo reservas activas compiten por el mismo horario).

---

### 2.2 Middleware de autenticación

#### `src/middleware/auth.js`

Dos middlewares:

- **`authenticate`**: Extrae el token JWT del header `Authorization: Bearer <token>`, lo verifica con `jwt.verify()`, busca al usuario en BD por `decoded.userId` y lo adjunta en `req.user`.
- **`authorize(...roles)`**: Recibe roles permitidos y verifica que `req.user.role_id` esté incluido. Retorna 403 si no.

---

### 2.3 Validador de reservas (`ReservationValidator`)

#### `src/services/reservationValidator.js`

**Propósito**: Centraliza TODA la lógica de validación de reservas. Es la única fuente de verdad para reglas de negocio.

| Función | Propósito |
|---------|-----------|
| `validateTimes(inicio, fin)` | Valida formato, que inicio < fin, horario universitario (7:00-22:00), duración mínima (30 min), máxima (8h), y que no sea en el pasado |
| `checkReservationConflict(recursoId, inicio, fin, excludeId?)` | **Función clave**. Busca reservas activas (pendiente/aprobada) del mismo recurso cuyos intervalos se intersecten. La intersección se detecta con `inicio < $fin AND fin > $inicio`. Si `excludeId` se pasa, excluye esa reserva (útil al editar). |
| `validateResourceAvailability(recursoId)` | Verifica que el recurso exista, esté activo (`esta_activo = true`) y no esté en mantenimiento (`MAINTENANCE`/`OUT_OF_SERVICE`) |
| `validateCreateReservation(req)` | Valida campos requeridos del body y llama a `validateTimes()` |
| `validatePermissionToCreate(req)` | Solo admin puede crear para otros; cada uno puede crear para sí mismo |
| `validatePermissionToModify(reserva, user)` | Admin o propietario pueden modificar |
| `validateStatusTransition(current, target, user)` | Verifica que la transición de estado sea válida según la matriz de transiciones, y que solo admin pueda aprobar/rechazar |

**Lógica de detección de conflictos (`checkReservationConflict`):**

La función usa esta query SQL:

```sql
WHERE r.recurso_id = $1
  AND r.estado = ANY($arrayIdx::text[])  -- solo 'pendiente','aprobada'
  AND r.inicio < $3   -- el nuevo inicio es antes del fin existente
  AND r.fin > $2      -- el nuevo fin es después del inicio existente
```

Esto captura TODOS los solapamientos posibles:

| Existente | Nuevo | ¿Conflicto? |
|-----------|-------|-------------|
| 08:00-10:00 | 09:00-11:00 | ✅ (interseca) |
| 08:00-10:00 | 08:30-09:00 | ✅ (dentro) |
| 08:00-10:00 | 07:00-08:30 | ✅ (interseca inicio) |
| 08:00-10:00 | 08:00-10:00 | ✅ (idéntico) |
| 08:00-10:00 | 10:00-12:00 | ❌ (toca borde, no interseca) |
| 08:00-10:00 | 06:00-08:00 | ❌ (toca borde) |

El `deleted_at IS NULL` asegura que solo se consideren reservas activas (no eliminadas lógicamente).

---

### 2.4 Servicio de reservas (`ReservaService`)

#### `src/services/reservaService.js`

Capa de acceso a datos. Todas las funciones reciben y devuelven objetos planos. Usa el pool de `pg` para queries parametrizadas (protege contra SQL injection).

**Métodos principales:**

| Método | SQL | Descripción |
|--------|-----|-------------|
| `findAll(filters)` | SELECT con JOINs + LEFT JOINs para auditores | Lista todas las reservas activas, con filtros opcionales (estado, recurso, usuario, tipo, fecha) |
| `findByUsuario(userId)` | SELECT con filtro por usuario_id | Reservas de un usuario, orden descendente |
| `findById(id)` | SELECT con filtro por id | Una reserva con todos los JOINs (incluye nombres de quien aprobó/rechazó/canceló) |
| `create(data)` | INSERT con RETURNING * | Crea reserva en estado `pendiente`, guarda `created_by` |
| `update(id, fields)` | UPDATE dinámico | Modifica notas/motivo/horario de reserva pendiente |
| `approve(id, adminId)` | UPDATE estado + aprobado_por | Admin aprueba |
| `reject(id, adminId, motivo)` | UPDATE estado + rechazado_por + rechazo_motivo | Admin rechaza con motivo |
| `cancel(id, userId, motivo)` | UPDATE estado + cancelado_por + cancelacion_motivo | Admin o propietario cancelan |
| `finalize(id)` | UPDATE a finalizada (solo desde aprobada) | Marca como ocurrida |
| `softRemove(id)` | UPDATE deleted_at = NOW() | Borrado lógico (no elimina el registro) |
| `remove(id)` | DELETE físico | Solo para limpieza, no usado desde UI |
| `checkAvailability(recursoId, fecha)` | SELECT con filtro por fecha | Slots ocupados de un recurso en una fecha específica |
| `findConflicts(recursoId, inicio, fin, excludeId?)` | SELECT con detección de solapamiento | Similar a `checkReservationConflict` del validator |

**SELECT_BASE** incluye JOIN con:
- `recursos` — nombre, ubicación, tipo del recurso
- `usuarios` — nombre, email del solicitante
- `usuarios ap` — nombre de quien aprobó (LEFT JOIN)
- `usuarios rej` — nombre de quien rechazó (LEFT JOIN)
- `usuarios canc` — nombre de quien canceló (LEFT JOIN)

---

### 2.5 Controlador de reservas (`ReservaController`)

#### `src/controllers/reservaController.js`

Orquesta las peticiones HTTP: valida entrada con el `ReservationValidator`, llama al `ReservaService`, y estructura la respuesta.

| Endpoint | Función | Descripción |
|----------|---------|-------------|
| `GET /` | `getTodasLasReservas` | Admin: lista con filtros (query params) |
| `GET /all` | `getAllReservasPublic` | Cualquier user autenticado: lista completa (para calendario) |
| `GET /:id` | `getReserva` | Detalle de una reserva (admin o propietario) |
| `GET /usuario/:userId` | `getMisReservas` | Reservas de un usuario específico |
| `POST /` | `crearReserva` | Crear: valida → verifica disponibilidad → verifica conflictos → crea → devuelve con JOINs |
| `PUT /:id` | `updateReserva` | Modificar notas/horario (solo pendientes, admin o propietario) |
| `PATCH /:id/approve` | `aprobarReserva` | Admin: aprueba (verifica conflictos activos antes) |
| `PATCH /:id/reject` | `rechazarReserva` | Admin: rechaza con motivo obligatorio |
| `PATCH /:id/cancel` | `cancelarReserva` | Admin o propietario: cancelan |
| `DELETE /:id` | `eliminarReserva` | Soft delete (marca deleted_at) |
| `GET /availability` | `checkAvailability` | Query params `recurso_id` + `fecha`: devuelve slots ocupados |

**Formato de respuesta consistente:**

- Éxito: `res.json(data)` — el objeto/s array directamente
- Error: `res.status(code).json({ error, details? })`

---

### 2.6 Rutas de reservas

#### `src/routes/reservaRoutes.js`

Define el orden de las rutas (importante: `/availability` y `/all` van ANTES de `/:id` para evitar que Express interprete "availability" como un id).

```js
GET    /availability          → authenticate, checkAvailability
GET    /all                   → authenticate, getAllReservasPublic
GET    /                      → authenticate, authorize(ADMIN), getTodasLasReservas
POST   /                      → authenticate, crearReserva
GET    /:id                   → authenticate, getReserva
PUT    /:id                   → authenticate, updateReserva
PATCH  /:id/approve           → authenticate, authorize(ADMIN), aprobarReserva
PATCH  /:id/reject            → authenticate, authorize(ADMIN), rechazarReserva
PATCH  /:id/cancel            → authenticate, cancelarReserva
GET    /usuario/:usuario_id   → authenticate, getMisReservas
DELETE /:id                   → authenticate, eliminarReserva
```

---

### 2.7 Base de datos

#### `src/db/init.sql`

**Tabla `reservas`** — campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL PK | Identificador único |
| `usuario_id` | INTEGER FK → usuarios | Solicitante |
| `recurso_id` | INTEGER FK → recursos | Recurso reservado |
| `inicio` | TIMESTAMP | Fecha/hora inicio |
| `fin` | TIMESTAMP | Fecha/hora fin |
| `notas` | TEXT | Notas del solicitante |
| `motivo` | TEXT | Motivo académico |
| `estado` | VARCHAR(50) | CHECK: pendiente, aprobada, rechazada, cancelada, finalizada |
| `rechazo_motivo` | TEXT | Motivo de rechazo (admin) |
| `cancelacion_motivo` | TEXT | Motivo de cancelación |
| `aprobado_por` | INTEGER FK → usuarios | Quién aprobó |
| `rechazado_por` | INTEGER FK → usuarios | Quién rechazó |
| `cancelado_por` | INTEGER FK → usuarios | Quién canceló |
| `created_by` | INTEGER FK → usuarios | Quién creó |
| `updated_by` | INTEGER FK → usuarios | Última modificación |
| `deleted_at` | TIMESTAMP | Soft delete |
| `created_at` | TIMESTAMP DEFAULT NOW() | Creación |
| `updated_at` | TIMESTAMP DEFAULT NOW() | Actualización |

**Restricciones:**
- `valid_times CHECK (fin > inicio)` — evita intervalos inválidos

**Índices:**
- `idx_reservas_usuario` — búsquedas por usuario
- `idx_reservas_recurso` — búsquedas por recurso
- `idx_reservas_estado` — filtrado por estado
- `idx_reservas_disponibilidad` — **índice parcial** sobre `(recurso_id, inicio, fin) WHERE estado IN ('pendiente', 'aprobada')` — optimiza las consultas de disponibilidad

#### Migración: `src/db/migrate-reservas.sql`

Agrega columnas de auditoría, cambia el CHECK de estado a los 5 nuevos valores, actualiza registros existentes (`confirmada` → `aprobada`), elimina el antiguo constraint `no_overlap` (que usaba UNIQUE en vez de lógica de intervalos), y crea índices optimizados.

---

## 3. Frontend

### 3.1 Servicios frontend

#### `src/services/reservaService.js`

Cliente Axios para el endpoint `/api/reservas`. Cada función:
1. Toma parámetros específicos
2. Hace la petición HTTP con el token JWT en el header (interceptor)
3. Retorna `response.data`

| Función | Método HTTP | Endpoint |
|---------|-------------|----------|
| `getReservas(filters)` | GET | `/` (admin) |
| `getAllReservas()` | GET | `/all` (cualquier user) |
| `getReserva(id)` | GET | `/:id` |
| `getMisReservas(userId)` | GET | `/usuario/:userId` |
| `crearReserva(data)` | POST | `/` |
| `updateReserva(id, data)` | PUT | `/:id` |
| `aprobarReserva(id)` | PATCH | `/:id/approve` |
| `rechazarReserva(id, motivo)` | PATCH | `/:id/reject` |
| `cancelarReserva(id, motivo)` | PATCH | `/:id/cancel` |
| `eliminarReserva(id)` | DELETE | `/:id` |
| `checkAvailability(recursoId, fecha)` | GET | `/availability` |

#### `src/services/recursoService.js`

Cliente Axios para `/api/recursos`:

| Función | Método | Endpoint |
|---------|--------|----------|
| `getRecursos(filters)` | GET | `/` |
| `getRecursosActivos()` | GET | `/activos` |
| `getRecurso(id)` | GET | `/:id` |
| `createRecurso(data)` | POST | `/` |
| `updateRecurso(id, data)` | PUT | `/:id` |
| `cambiarEstado(id, estado)` | PATCH | `/:id/status` |
| `toggleActivo(id)` | PATCH | `/:id/active` |

---

### 3.2 `ReservaForm`

**Propósito**: Único formulario de creación de reservas. Se usa desde calendario (click en fecha) y desde botón "Nueva Reserva" en el Header.

**Props:**

| Prop | Tipo | Descripción |
|------|------|-------------|
| `visible` | boolean | Controla si se muestra el panel lateral |
| `onClose` | function | Cierra el formulario |
| `formData` | object | `{ recurso_id, fecha, hora_inicio, hora_fin, motivo }` |
| `onChange` | function | Actualiza formData desde el padre |
| `recursos` | array | Lista de recursos disponibles |
| `errorValidacion` | string | Mensaje de error a mostrar |
| `onSubmit` | function | Handler de submit (definido en el dashboard padre) |
| `user` | object | Usuario autenticado |

**Comportamiento:**

1. Al seleccionar recurso + fecha, llama automáticamente a `checkAvailability()` del backend.
2. Muestra los horarios ocupados en un bloque amarillo informativo.
3. Los selects de hora marcan en rojo las opciones ocupadas y las deshabilitan.
4. Tiene un `useRef(submitRef)` que previene doble submit.
5. Muestra spinner (`Loader2`) mientras se envía.
6. Se renderiza como panel lateral (slide-out) de 400px.

**Disponibilidad en tiempo real:** cuando cambia `formData.recurso_id` o `formData.fecha`, se dispara un efecto que consulta `GET /availability` y actualiza `horasOcupadas`. Usa `useEffect` con cleanup para evitar race conditions.

---

### 3.3 `ReservaModal`

**Propósito**: Modal de detalle de reserva. Muestra información completa y botones de acción según el rol.

**Props:**

| Prop | Tipo | Descripción |
|------|------|-------------|
| `reserva` | object | Datos de la reserva (con extendedProps del calendario) |
| `onClose` | function | Cierra el modal |
| `user` | object | Usuario autenticado |
| `onApprove` | function | Handler para aprobar (solo admin) |
| `onReject` | function | Handler para rechazar (solo admin) |
| `onCancel` | function | Handler para cancelar (admin o propietario) |

**Comportamiento por rol:**

| Rol | Botones visibles |
|-----|-----------------|
| Admin | Aprobar, Rechazar (con textarea para motivo), Cancelar |
| Docente | Cancelar (si es propietario de una pendiente/aprobada) |
| Usuario | Cancelar (si es propietario de una pendiente/aprobada) |

**Estados visuales del badge:**

| Estado | Color fondo | Color texto |
|--------|-------------|-------------|
| Pendiente | `#fef9c3` (amarillo) | `#a16207` |
| Aprobada | `#dcfce7` (verde) | `#15803d` |
| Rechazada | `#fee2e2` (rojo) | `#b91c1c` |
| Cancelada | `#f1f5f9` (gris) | `#475569` |

También muestra trazos de auditoría:
- "Aprobado por [nombre]" si fue aprobada
- "Rechazado por [nombre]" si fue rechazada (más el motivo)
- "Cancelado por [nombre]" si fue cancelada (más el motivo)

---

### 3.4 `CalendarView`

**Propósito**: Calendario mensual usando FullCalendar.

**Props:**

| Prop | Tipo | Descripción |
|------|------|-------------|
| `eventos` | array | Eventos formateados para FullCalendar |
| `onDateClick` | function | Click en una fecha → abre formulario |
| `onEventClick` | function | Click en un evento → abre modal de detalle |

**Colores de eventos (por estado):**

| Estado | bgColor | borderColor | textColor |
|--------|---------|-------------|-----------|
| Pendiente | `#fef9c3` | `#eab308` | `#854d0e` |
| Aprobada | `#dcfce7` | `#22c55e` | `#166534` |
| Rechazada | `#fee2e2` | `#ef4444` | `#991b1b` |
| Cancelada | `#f1f5f9` | `#94a3b8` | `#475569` |

Incluye una leyenda visual arriba del calendario.

**Plugins de FullCalendar usados:** `dayGridPlugin` (vista mensual), `interactionPlugin` (clicks).

---

### 3.5 `Dashboard` (Admin)

**Panel de administración completo.** Es la pantalla principal para `role_id === 1`.

**Estructura:**
```
Sidebar | Header | Section (contenido dinámico) | ReservaForm (panel lateral) | ReservaModal
```

**Secciones (vistaActiva):**

| Vista | Contenido |
|-------|-----------|
| `calendario` | `CalendarView` con todas las reservas |
| `recursos` | `ResourcesView` (CRUD de recursos) |
| `usuarios` | `AdminUsers` (gestión de usuarios) |
| `reservas` | Lista plana de todas las reservas |

**Datos:** Carga `getReservas()` (admin) + `getRecursosActivos()` al montar.

**Handlers:**
- `handleCrearReserva`: envía a `POST /` con `usuario_id = user.id`
- `handleApprove`: llama a `aprobarReserva(id)` y recarga
- `handleReject`: llama a `rechazarReserva(id, motivo)` y recarga
- `handleCancel`: llama a `cancelarReserva(id, motivo)` y recarga

**Botón Actualizar:** visible en todas las vistas, llama a `cargarDatos()`.

---

### 3.6 `DocenteDashboard`

Panel para `role_id === 2`. Similar al admin pero con menos secciones.

**Secciones:**

| Vista | Contenido |
|-------|-----------|
| `calendario` | `CalendarView` con todas las reservas (via `getAllReservas()`) |
| `reservas` | Lista de sus propias reservas (via `getMisReservas()`) |
| `recursos` | Lista de recursos con botón "Reservar" que precarga el recurso en el formulario |

**Diferencias con Dashboard (admin):**
- Usa `getAllReservas()` en vez de `getReservas()` (no requiere ser admin)
- No tiene botones de aprobar/rechazar en el modal
- `handleCancel` llama a `cancelarReserva(id, 'Cancelado por el docente')`
- Sidebar personalizado con 3 ítems

---

### 3.7 `UsuarioDashboard`

Panel para `role_id === 3`. Interfaz más simple con calendario y lista de reservas.

**Secciones:**

| Vista | Contenido |
|-------|-----------|
| `calendario` | `CalendarView` con todas las reservas |
| `reservas` | Lista de sus reservas con opción de cancelar |

**Sidebar:** Integrado directamente (no usa el componente Sidebar genérico, tiene navegación propia con íconos).

**Características:**
- Botón "Nueva Reserva" en el sidebar
- `ReservaForm` se renderiza como panel fijo a la derecha (position: fixed)
- Modal de detalle con opción "Cancelar Reserva" si está pendiente o aprobada
- Muestra motivo de rechazo si la reserva fue rechazada

---

### 3.8 `Header`

Barra superior con:
- Título y subtítulo dinámicos según la vista activa
- Nombre del usuario autenticado
- Botón "Nueva Reserva" (solo visible si `onNuevaReserva` está definido)
- Botón "Cerrar sesión"

---

## 4. Flujo completo de creación de reserva

### Desde el calendario (cualquier rol):

```
1. Usuario hace click en una fecha del calendario
   → CalendarView.onDateClick()
   → setFormData({...formData, fecha: arg.dateStr})
   → setMostrarFormulario(true)

2. Se abre ReservaForm (panel lateral)
   → useEffect detecta recurso_id + fecha
   → GET /availability?recurso_id=X&fecha=YYYY-MM-DD
   → Muestra horarios ocupados en amarillo
   → Deshabilita opciones ocupadas en selects

3. Usuario llena el formulario

4. Submit → handleCrearReserva (en el Dashboard padre)
   → Valida frontend: inicio < fin
   → POST /reservas { usuario_id, recurso_id, inicio, fin, notes, motivo }
   → Backend: validateCreateReservation() → validateTimes()
   → Backend: validateResourceAvailability() → ¿recurso activo?
   → Backend: checkReservationConflict() → ¿hay solapamiento?
   → Backend: reservaService.create() → INSERT con estado 'pendiente'
   → Si éxito: recarga datos, cierra formulario
   → Si error: muestra mensaje en el formulario
```

### Desde botón "Nueva Reserva":

```
1. Usuario hace click en "Nueva Reserva" (Header o sidebar)
   → setMostrarFormulario(true)

2. Se abre el MISMO ReservaForm (mismos componentes, mismas validaciones)

3. Mismo flujo de submit (misma función handleCrearReserva)

4. Mismo endpoint (POST /reservas)
```

**No hay duplicación:** el formulario es el mismo componente, la validación es la misma función, el endpoint es el mismo.

---

## 5. Flujo de aprobación/rechazo

### Aprobación:

```
1. Admin hace click en evento del calendario
   → ReservaModal se abre con botón "Aprobar"

2. Admin hace click en "Aprobar"
   → PATCH /reservas/:id/approve
   → Backend: validateStatusTransition(pendiente → aprobada, admin)
   → Backend: checkReservationConflict() → verifica que no haya conflicto al aprobar
   → Backend: reservaService.approve(id, adminId)
   → UPDATE estado='aprobada', aprobado_por=adminId
   → Frontend: recarga eventos, cierra modal
   → Calendario se actualiza: badge cambia a verde
```

### Rechazo:

```
1. Admin hace click en "Rechazar"
   → Se expande textarea para escribir motivo

2. Admin escribe motivo y confirma
   → PATCH /reservas/:id/reject { motivo }
   → Backend: validateStatusTransition(pendiente → rechazada, admin)
   → Backend: valida que motivo no esté vacío
   → Backend: reservaService.reject(id, adminId, motivo)
   → UPDATE estado='rechazada', rechazado_por=adminId, rechazo_motivo=motivo
   → Frontend: recarga, modal se cierra
   → Al abrir la reserva, se ve el motivo de rechazo en rojo
```

### Cancelación:

```
1. Admin o propietario hacen click en "Cancelar Reserva"
   → PATCH /reservas/:id/cancel
   → Backend: validatePermissionToModify() y validateStatusTransition()
   → Backend: reservaService.cancel(id, userId, motivo)
   → UPDATE estado='cancelada', cancelado_por=userId
```

---

## 6. Roles y permisos

| Acción | Admin (1) | Docente (2) | Usuario (3) |
|--------|-----------|-------------|-------------|
| Ver todas las reservas | ✅ GET / | ❌ | ❌ |
| Ver todas (calendario) | ✅ GET /all | ✅ GET /all | ✅ GET /all |
| Ver sus reservas | ✅ | ✅ | ✅ |
| Ver detalle de reserva | ✅ (cualquiera) | ✅ (propias) | ✅ (propias) |
| Crear reserva | ✅ (para sí o para otros) | ✅ (solo para sí) | ✅ (solo para sí) |
| Modificar reserva pendiente | ✅ (cualquiera) | ✅ (propias) | ✅ (propias) |
| Aprobar reserva | ✅ | ❌ | ❌ |
| Rechazar reserva | ✅ | ❌ | ❌ |
| Cancelar reserva | ✅ (cualquiera) | ✅ (propias) | ✅ (propias) |
| Eliminar (soft delete) | ✅ (cualquiera) | ✅ (propias) | ✅ (propias) |

---

## 7. Reglas de negocio

**Tiempo:**
- Horario universitario: 07:00 a 22:00
- Duración mínima: 30 minutos
- Duración máxima: 8 horas
- `inicio` debe ser < `fin`
- No se permiten reservas en tiempo pasado (mismo día)

**Disponibilidad:**
- No se permiten solapamientos con reservas activas (pendiente/aprobada)
- No se permite reservar recursos en mantenimiento (`MAINTENANCE`) o fuera de servicio (`OUT_OF_SERVICE`)
- No se permite reservar recursos desactivados (`esta_activo = false`)

**Estados:**
- Al crear: siempre `pendiente` (incluso admin)
- Transiciones controladas por matriz (ver 2.1)
- Solo admin puede transicionar a `aprobada` o `rechazada`
- Admin o propietario pueden transicionar a `cancelada`

**Auditoría:**
- Cada cambio de estado registra quién lo hizo (columna `*_por`)
- Cada cancelación/rechazo guarda el motivo
- `created_by` registra quién creó (útil cuando admin crea para otro)
- `deleted_at` para soft delete (no se pierde el registro)

---

## 8. API endpoints

### Reservas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/reservas/availability?recurso_id=X&fecha=YYYY-MM-DD` | Sí | Slots ocupados de un recurso en una fecha |
| `GET` | `/api/reservas/all` | Sí | Todas las reservas (para calendario público) |
| `GET` | `/api/reservas` | Admin | Todas las reservas con filtros |
| `GET` | `/api/reservas/:id` | Sí | Detalle de una reserva |
| `GET` | `/api/reservas/usuario/:userId` | Sí | Reservas de un usuario |
| `POST` | `/api/reservas` | Sí | Crear reserva |
| `PUT` | `/api/reservas/:id` | Sí | Modificar reserva (solo pendiente) |
| `PATCH` | `/api/reservas/:id/approve` | Admin | Aprobar |
| `PATCH` | `/api/reservas/:id/reject` | Admin | Rechazar (body: `{ motivo }`) |
| `PATCH` | `/api/reservas/:id/cancel` | Sí | Cancelar |
| `DELETE` | `/api/reservas/:id` | Sí | Soft delete |

### Recursos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/recursos/activos` | No | Recursos activos (público) |
| `GET` | `/api/recursos` | Sí | Todos los recursos con filtros |
| `GET` | `/api/recursos/:id` | Admin | Detalle de recurso |
| `POST` | `/api/recursos` | Admin | Crear recurso |
| `PUT` | `/api/recursos/:id` | Admin | Actualizar recurso |
| `PATCH` | `/api/recursos/:id/status` | Admin | Cambiar estado |
| `PATCH` | `/api/recursos/:id/active` | Admin | Activar/desactivar |

### Auth

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/google` | Login con Google |
| `POST` | `/api/auth/register` | Registro email |
| `POST` | `/api/auth/login` | Login email |
| `GET` | `/api/auth/me` | Perfil actual |
| `POST` | `/api/auth/forgot-password` | Solicitar reseteo |
| `POST` | `/api/auth/reset-password/:token` | Resetear password |

### Usuarios

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/usuarios` | Admin | Listar usuarios |
| `PUT` | `/api/usuarios/:id` | Admin | Actualizar usuario |
