# EVM Dashboard — Backend

Sistema de Earned Value Management (EVM) para seguimiento de proyectos. Backend en Python con FastAPI y PostgreSQL.

---

## 📋 Requisitos

- **Python 3.13+**
- **PostgreSQL 16** (vía Docker o instalación local)
- **Docker Desktop** (opcional, para PostgreSQL)
- **Git**

---

## 🚀 Inicialización Rápida

### 1. Clonar el repositorio

```bash
git clone https://github.com/JohnJairo1024/trycore-evm.git
cd trycore-evm
```

### 2. Inicializar la base de datos

**Opción A — Con Docker (recomendado):**

```bash
docker compose up -d
```

Esto levanta PostgreSQL 16 con las credenciales:

| Variable | Valor |
|---|---|
| Host | `localhost` |
| Puerto | `5432` |
| Base de datos | `evm_database` |
| Usuario | `postgres` |
| Contraseña | `postgres123` |

Los scripts del DBA se ejecutan automáticamente:
- `scripts/init-db.sql` — crea esquema y tablas
- `scripts/seed-data.sql` — inserta 4 proyectos y 14 actividades con UUIDs fijos
- `scripts/dba-performance-tuning.sql` — crea índices optimizados
- `scripts/monitoring-queries.sql` — consultas de monitoreo

**Opción B — Con PostgreSQL local:**

```bash
# Conectar a PostgreSQL y ejecutar los scripts en orden
psql -U postgres < scripts/init-db.sql
psql -U postgres -d evm_database < scripts/seed-data.sql
psql -U postgres -d evm_database < scripts/dba-performance-tuning.sql
```

### 3. Crear entorno virtual e instalar dependencias

```bash
cd evm-api
python -m venv venv

# Windows:
venv\Scripts\activate

# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Configurar variables de entorno

El backend se configura automáticamente:

| Variable | Default | Propósito |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./evm.db` | Conexión a BD (dev local) |
| `DATABASE_URL` (producción) | `postgresql+asyncpg://postgres:postgres123@localhost:5432/evm_database` | Conexión PostgreSQL |

Para desarrollo local con SQLite no se necesita configurar nada. Para usar PostgreSQL, establecer:

```bash
# Windows (PowerShell):
$env:DATABASE_URL="postgresql+asyncpg://postgres:postgres123@localhost:5432/evm_database"

# Windows (CMD):
set DATABASE_URL=postgresql+asyncpg://postgres:postgres123@localhost:5432/evm_database

# Linux / macOS:
export DATABASE_URL="postgresql+asyncpg://postgres:postgres123@localhost:5432/evm_database"
```

### 5. Ejecutar migraciones (si no se usó Docker)

```bash
cd evm-api
alembic upgrade head
```

### 6. Iniciar el servidor

```bash
cd evm-api
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

O usando el script:

```bash
.\run.bat
```

### 7. Verificar

| Recurso | URL |
|---|---|
| API | http://127.0.0.1:8000 |
| Swagger UI | http://127.0.0.1:8000/api-docs |
| OpenAPI JSON | http://127.0.0.1:8000/openapi.json |

---

## 🧪 Tests

```bash
cd evm-api
pytest -v
```

Los tests usan SQLite en memoria, no requieren PostgreSQL.

---

## 📁 Estructura del Proyecto

```
trycore-evm/
├── evm-api/                    # Backend FastAPI
│   ├── app/
│   │   ├── api/v1/            # Endpoints REST
│   │   ├── core/              # Config, database, logging
│   │   ├── models/            # SQLAlchemy ORM
│   │   ├── schemas/           # Pydantic (request/response)
│   │   └── services/          # Lógica de negocio (EVM Calculator)
│   ├── migrations/            # Alembic (versionado de BD)
│   ├── tests/                 # Tests unitarios y de integración
│   ├── alembic.ini
│   ├── pytest.ini
│   └── requirements.txt
├── scripts/                   # Scripts DBA (NO modificar)
│   ├── init-db.sql
│   ├── seed-data.sql
│   ├── dba-performance-tuning.sql
│   └── monitoring-queries.sql
├── docker-compose.yml         # PostgreSQL 16 + scripts DBA
├── run.bat                    # Script de inicio (Windows)
├── stop.bat                   # Script de detención (Windows)
├── AI_PROCESS.md              # Documentación del proceso con IA
└── README.md
```

---

## 🌳 GitFlow

| Rama | Propósito |
|---|---|
| `main` | Código en producción |
| `develop` | Integración de features |
| `feature/*` | Features en desarrollo |
| `release/*` | Preparación de release |

### Convención de commits

Los mensajes deben ser descriptivos y en imperativo:

```
Add EVM calculation service with real-time metrics
Fix CPI edge case when AC is zero
Update test fixtures with improved async session handling
```

---

## 📐 Decisiones de Arquitectura

| Decisión | Detalle |
|---|---|
| **ADR-001** | Los cálculos EVM viven en el backend (EVMCalculator), no en BD ni frontend |
| **ADR-002** | Los indicadores EVM no se almacenan, se calculan en tiempo real |
| **Base de datos** | PostgreSQL 16 en producción, SQLite en memoria para tests |
| **ORM** | SQLAlchemy 2.0 async con asyncpg (PostgreSQL) / aiosqlite (tests) |
| **Migraciones** | Alembic con revisiones versionadas |

Ver `docs/architecture/` y `AI_PROCESS.md` para más detalles.

---

## 📊 Endpoints de la API

### Proyectos
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/projects` | Listar proyectos (paginado) |
| `POST` | `/api/v1/projects` | Crear proyecto |
| `GET` | `/api/v1/projects/{id}` | Obtener proyecto |
| `PUT` | `/api/v1/projects/{id}` | Actualizar proyecto |
| `DELETE` | `/api/v1/projects/{id}` | Eliminar proyecto |
| `GET` | `/api/v1/projects/{id}/evm` | Indicadores EVM del proyecto |

### Actividades
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/projects/{project_id}/activities` | Listar actividades |
| `POST` | `/api/v1/projects/{project_id}/activities` | Crear actividad |
| `GET` | `/api/v1/activities/{id}` | Obtener actividad |
| `PUT` | `/api/v1/activities/{id}` | Actualizar actividad |
| `DELETE` | `/api/v1/activities/{id}` | Eliminar actividad |
| `GET` | `/api/v1/activities/{id}/evm` | Indicadores EVM de la actividad |

---

## 🧮 Fórmulas EVM

| Indicador | Fórmula | Interpretación |
|---|---|---|
| PV | `BAC × Planned% / 100` | Planned Value |
| EV | `BAC × Actual% / 100` | Earned Value |
| CV | `EV − AC` | > 0: Under budget, < 0: Over budget |
| SV | `EV − PV` | > 0: Ahead, < 0: Behind |
| CPI | `EV / AC` | > 1: Under budget, < 1: Over budget |
| SPI | `EV / PV` | > 1: Ahead, < 1: Behind |
| EAC | `BAC / CPI` | Estimate at Completion |
| VAC | `BAC − EAC` | > 0: Under budget, < 0: Over budget |


<img width="1458" height="729" alt="image" src="https://github.com/user-attachments/assets/bf78dc34-43e3-4e81-bd5c-b988c621180e" />

<img width="1312" height="458" alt="image" src="https://github.com/user-attachments/assets/ea25634f-a53d-40bc-b3c4-f0ee64129e60" />

---

## 📝 Licencia

Proyecto académico — Entrega de evaluación técnica.
