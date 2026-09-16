# Turnero

Sistema de reserva de turnos online, pensado para vender a emprendimientos como
producto economico: usa **Google Sheets como base de datos** (sin costo de
hosting de base de datos) y se despliega gratis en **Vercel**.

Cada cliente (emprendimiento) tiene su propia planilla de Google Sheets y su
propio deploy de la app, configurados con variables de entorno distintas. El
codigo es el mismo para todos los clientes.

## Que incluye

- **Landing publica** (`/`): el cliente final elige dia y horario disponible,
  carga sus datos y confirma el turno. Recibe un link unico para gestionar su
  turno despues.
- **Gestion del turno** (`/turno/[token]`): el cliente puede reprogramar o
  cancelar su turno con el link que recibio, sin necesidad de crear una cuenta.
- **Panel de administracion** (`/admin`): protegido con contrasena, el dueño
  del negocio carga los horarios semanales de atencion, bloquea feriados o
  agrega refuerzos puntuales, y ve/cancela/reprograma los turnos reservados.

## Como funciona la disponibilidad

En la planilla de Google Sheets, el admin no carga cada turno disponible a
mano: define una **plantilla semanal** (por ejemplo "Lunes a Viernes de 9 a
18") y el sistema genera automaticamente los turnos bookeables segun la
duracion configurada (ej. 30 minutos), descontando los turnos ya reservados.
Para casos puntuales existen **excepciones**: bloquear un dia (feriado) o
agregar un refuerzo de horario fuera de lo habitual.

La planilla tiene 4 pestañas:

| Pestaña       | Contenido                                                        |
| ------------- | ----------------------------------------------------------------- |
| `Config`      | Nombre del negocio, duracion del turno, zona horaria, anticipacion |
| `Horarios`    | Plantilla semanal recurrente (dia de semana + rango horario)      |
| `Excepciones` | Bloqueos o refuerzos para una fecha puntual                       |
| `Turnos`      | Los turnos reservados (se crean solos, no se editan a mano)       |

Todo esto se gestiona desde el panel `/admin`, no hace falta tocar la planilla
directamente (aunque se puede, es una planilla comun).

## Puesta en marcha para un cliente nuevo

### 1. Crear la planilla de Google Sheets

Crea una planilla nueva en Google Sheets (puede estar vacia, el sistema crea
las pestañas solo). Copia su ID desde la URL:

```
https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
```

### 2. Crear una cuenta de servicio de Google Cloud

1. Anda a [Google Cloud Console](https://console.cloud.google.com/) y crea un
   proyecto (uno por cliente, o uno solo reutilizado para todos).
2. Habilita la **Google Sheets API** para ese proyecto.
3. Anda a "Credenciales" > "Crear credenciales" > "Cuenta de servicio".
4. Una vez creada, entra a la cuenta de servicio > pestaña "Claves" > "Agregar
   clave" > JSON. Se descarga un archivo con `client_email` y `private_key`.
5. Comparti la planilla del paso 1 con el `client_email` de la cuenta de
   servicio, con permiso de **Editor**.

### 3. Configurar las variables de entorno

Copia `.env.example` a `.env.local` y completa:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=  # el client_email del JSON
GOOGLE_PRIVATE_KEY=            # el private_key del JSON (con los \n tal cual)
GOOGLE_SHEET_ID=               # el ID de la planilla
ADMIN_PASSWORD=                # contrasena para /admin
SESSION_SECRET=                # string aleatorio largo (ej: openssl rand -hex 32)
TIMEZONE=America/Argentina/Buenos_Aires
```

### 4. Instalar dependencias e inicializar la planilla

```bash
npm install
npm run setup:sheet
```

Esto crea las 4 pestañas con sus encabezados en la planilla.

### 5. Correr en local

```bash
npm run dev
```

Abri `http://localhost:3000` para la vista publica y
`http://localhost:3000/admin` para el panel de administracion. Entra al panel
y carga los horarios semanales de atencion antes de compartir el link con
clientes.

### 6. Deploy a Vercel (gratis)

1. Sube el repo a GitHub (o usa el mismo repo para todos los clientes con
   distintos proyectos de Vercel apuntando a la misma rama).
2. En [Vercel](https://vercel.com), importa el repo y crea un proyecto nuevo
   por cliente.
3. Carga las mismas variables de entorno del paso 3 en la configuracion del
   proyecto de Vercel.
4. Deploy. Cada cliente queda con su propia URL (se le puede conectar un
   dominio propio despues).

## Costos

- **Hosting**: Vercel tiene un plan gratuito mas que suficiente para un
  negocio chico/mediano.
- **Base de datos**: Google Sheets, gratis. La Google Sheets API tiene cuota
  gratuita de 60 lecturas/escrituras por minuto por proyecto, de sobra para
  este uso.
- **Dominio propio**: opcional, es el unico costo real si el cliente lo
  quiere.

## Estructura del proyecto

```
app/
  page.tsx                  Landing publica (reservar turno)
  turno/[token]/page.tsx    Ver / reprogramar / cancelar un turno
  admin/login/page.tsx      Login del admin
  admin/page.tsx            Panel de administracion
  api/                      Endpoints (disponibilidad, turnos, admin)
components/admin/           Componentes del panel de administracion
lib/
  sheets.ts                 Capa de acceso a Google Sheets
  availability.ts           Calculo de horarios disponibles
  booking.ts                Helpers de reserva (ids, validacion de slot)
  auth.ts                   Sesion de admin (JWT en cookie)
scripts/setup-sheet.ts      Inicializa las pestañas de la planilla
```
