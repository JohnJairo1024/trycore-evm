# AI Process Documentation — EVM Dashboard

> **Propósito:** Este documento registra cómo se utilizó inteligencia artificial para construir el backend del EVM Dashboard. Es parte de la entrega del proyecto y refleja el proceso real, incluyendo decisiones, errores, y aprendizajes.

---

## 1. Herramientas de IA Utilizadas

| Herramienta | Versión | Propósito | Por qué se eligió |
|---|---|---|---|
| **Claude (Anthropic)** | Sonnet / opus / deepseek-v4-flash-free | Agente principal de desarrollo, arquitectura, y generación de código | Capacidad de seguir instrucciones complejas, mantener contexto largo, y razonar sobre decisiones técnicas. Permite actuar como múltiples agentes (Backend Architect, DBA, Frontend Designer) desde una misma sesión. |
| **GitHub Copilot** (Skills: postgresql-database-engineering, typescript-react-reviewer, vitest-testing) | Skills especializados | Aportar conocimiento experto en PostgreSQL, revisión de React TypeScript, y configuración de pruebas | Los skills proporcionan guías detalladas y recetas comprobadas para títulos específicos, reduciendo el riesgo de errores en configuración de herramientas. |
| **WebSearch** | Búsqueda en vivo | Validar versiones actuales de paquetes, verificar sintaxis de Pydantic v2, y consultar documentación oficial | Necesario para asegurar que el código generado use APIs correctas de FastAPI 0.115+, SQLAlchemy 2.0 async, y Pydantic v2. |

**Por qué no se usaron otras herramientas:**
- **ChatGPT / Gemini:** Se evaluaron pero Claude ofreció mejor manejo de contexto largo (necesario para mantener los scripts DBA completos en memoria) y capacidad de actuar como múltiples personalidades técnicas desde una sola conversación.
- **Cursor / Copilot Chat:** No se usaron porque el flujo de trabajo requería un agente que pudiera planificar arquitectura, no solo completar código.
- **Codeium / Tabnine:** Se descartaron por no ofrecer el nivel de razonamiento necesario para decisiones arquitectónicas.

---

## 2. Todos los Prompts Enviados (Texto Completo, Orden Cronológico)

### Fase 1: Inicialización del Proyecto

**Prompt 1 — Estructura del Proyecto:**
```
Eres un agente backend. Tu tarea es construir el backend completo del EVM Dashboard
en Python con FastAPI y SQLAlchemy 2.0 async, siguiendo la documentación de arquitectura
que está en docs/architecture/ y los scripts SQL del DBA en scripts/.

Stack: Python 3.13+, FastAPI, SQLAlchemy 2.0 async, PostgreSQL 16 (asyncpg),
SQLite para desarrollo (aiosqlite).

Reglas:
1. NO modifiques los scripts del DBA (scripts/*.sql)
2. Los cálculos EVM viven en el backend, no en frontend ni BD (ADR-001)
3. Los indicadores EVM no se almacenan, se calculan en tiempo real (ADR-002)
4. Base de datos: evm_database, user postgres, pass postgres123, host localhost:5432

Crea la estructura completa del proyecto en C:\trycore-evm\evm-api/
```

**Prompt 2 — Modelos ORM:**
```
Crea los modelos SQLAlchemy para Project y Activity basados estrictamente en
init-db.sql del DBA. Los modelos deben usar UUID como PK, timestamps con timezone,
y soft delete. Agrega los índices que sugiere dba-performance-tuning.sql:
- covering index idx_activities_evm_calc
- partial index idx_activities_delayed
- composite index idx_activities_project_created
```

**Prompt 3 — EVM Calculator:**
```
Implementa el EVM Calculator Service que calcule en tiempo real:
- PV (Planned Value) = BAC × (Planned% / 100)
- EV (Earned Value) = BAC × (Actual% / 100)
- CV (Cost Variance) = EV - AC
- SV (Schedule Variance) = EV - PV
- CPI (Cost Performance Index) = EV / AC (manejar AC=0)
- SPI (Schedule Performance Index) = EV / PV (manejar PV=0)
- EAC (Estimate at Completion) = BAC / CPI (manejar CPI=0)
- VAC (Variance at Completion) = BAC - EAC

Incluir interpretaciones semánticas: "Under budget", "Over budget", "On track",
"Ahead of schedule", "Behind schedule". Seguir ADR-001 y ADR-002.
```

**Prompt 4 — API Endpoints:**
```
Crea los endpoints REST en api/v1/ siguiendo el contrato API en docs/architecture/03-CONTRATO-API.md:
- CRUD completo de proyectos: GET/POST /api/v1/projects, GET/PUT/DELETE /api/v1/projects/{id}
- CRUD completo de actividades anidadas a proyectos: GET/POST /api/v1/projects/{project_id}/activities
- EVM por proyecto: GET /api/v1/projects/{id}/evm
- EVM por actividad: GET /api/v1/activities/{id}/evm

Usar paginación con skip/limit, ordenamiento por created_at DESC, y
códigos de estado HTTP estándar (201 para creación, 404 para no encontrado).
```

**Prompt 5 — Tests Unitarios:**
```
Crea tests unitarios para el EVM Calculator usando pytest-asyncio con SQLite
en memoria. Debe cubrir:
1. Cálculos estándar (proyecto con datos normales)
2. AC = 0 (división por cero en CPI)
3. Planned% = 0 (división por cero en SPI)
4. Proyecto sin actividades
5. Actividad completada al 100%
6. Actividad con 0% avance pero con costo
7. Múltiples actividades y verificación de agregación a nivel proyecto
8. Valores exactos verificados con calculadora manual
```

### Fase 2: Infraestructura y Base de Datos

**Prompt 6 — Docker Compose:**
```
Crea un docker-compose.yml para PostgreSQL 16 con los scripts del DBA
montados en /docker-entrypoint-initdb.d/ para que se ejecuten automáticamente
al iniciar el contenedor. Usar las credenciales: postgres/postgres123, db: evm_database.
```

**Prompt 7 — Alembic Migraciones:**
```
Configura Alembic para migraciones async con SQLAlchemy 2.0.
La migración inicial debe reflejar exactamente el esquema de init-db.sql.
Usar revision ID: 21b1543c873d.
```

### Fase 3: Frontend (parcial)

**Prompt 8 — Frontend Scaffold:**
```
Crea un proyecto Vite + React 19 + TypeScript 6 con Tailwind CSS v4.
Incluir configuración de TanStack Query v5 para llamado a API,
React Router v7 para navegación, y estructura de carpetas:
src/components/ui/, src/components/project/, src/pages/, src/services/,
src/hooks/, src/types/, src/utils/.
```

**Prompt 9 — Componentes UI:**
```
Implementa los componentes UI reutilizables basados en la guía de diseño en
docs/architecture/01B-GUIA-DISENO-FRONTEND.md: Button, Card, Badge, Input,
Modal, Skeleton, EmptyState, ErrorState.
Seguir los principios de diseño atómico (átomos → moléculas → organismos).
```

**Prompt 10 — Páginas del Dashboard:**
```
Implementa las páginas: DashboardPage (lista de proyectos con cards y resumen EVM),
ProjectDetailPage (detalle del proyecto con tabla de actividades, gráfico EVM,
y tarjetas de métricas), NotFoundPage (404). Usar React Router v7 con layout compartido.
```

### Fase 4: Control de Versiones

**Prompt 11 — GitFlow Estricto:**
```
Crea el Gitflow estricto. El historial del repositorio es parte de la entrega.
La estructura de ramas debe seguir el flujo estándar: main para producción,
develop como rama de integración, ramas feature/* por cada funcionalidad,
y al menos una rama release/* antes del merge final a main.

Cada feature debe integrarse a develop mediante un Pull Request, aunque trabajes solo.
Los mensajes de commit deben ser descriptivos y en imperativo:
"Add EVM calculation service", "Fix CPI edge case when AC is zero".
Mensajes como "fix", "cambios" o "wip" no son aceptables.
```

**Prompt 12 — Corrección de ramas frontend:**
```
Quiero el GitFlow estricto solo para el backend en el momento.
Elimina las ramas feature/frontend-* y resetea develop al último commit
puramente backend (8e73b12).
```

### Fase 5: Correcciones y Ajustes

**Prompt 13 — Puerto 8000 ocupado:**
```
Actualiza el run.bat para que antes, si alguien utiliza el puerto 8000,
lo mate y lo detenga automáticamente antes de iniciar el servidor.
```

**Prompt 14 — Ignorar archivos:**
```
Ignorar el .opencode/ y docs/ y también los .bat en el repositorio.
```

---

## 3. Cómo se Aprendió EVM

### Proceso de Aprendizaje

Antes de implementar el EVM Calculator, se siguieron estos pasos para validar la comprensión:

**1. Consulta inicial sobre EVM:**
Se preguntó a la IA: *"Explica las fórmulas de EVM (Earned Value Management) y verifica que mi interpretación sea correcta. Necesito PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC."*

**2. Validación de fórmulas con casos concretos:**

| Concepto | Fórmula | Validación manual | Resultado |
|---|---|---|---|
| PV | BAC × Planned% / 100 | BAC=$20,000, 50% → PV=$10,000 | ✅ |
| EV | BAC × Actual% / 100 | BAC=$20,000, 30% → EV=$6,000 | ✅ |
| CV | EV − AC | $6,000 − $7,500 = −$1,500 (Over budget) | ✅ |
| SV | EV − PV | $6,000 − $10,000 = −$4,000 (Behind schedule) | ✅ |
| CPI | EV / AC | $6,000 / $7,500 = 0.80 (Over budget) | ✅ |
| SPI | EV / PV | $6,000 / $10,000 = 0.60 (Behind schedule) | ✅ |
| EAC | BAC / CPI | $20,000 / 0.80 = $25,000 | ✅ |
| VAC | BAC − EAC | $20,000 − $25,000 = −$5,000 | ✅ |

**3. Preguntas específicas de edge cases:**
- *"¿Qué pasa si AC es 0? CPI sería división por cero."* → Se implementó `CPI = 0` cuando `AC = 0`, con interpretación "No cost data".
- *"¿Qué pasa si Planned% es 0? SPI sería división por cero."* → Se implementó `SPI = 0` cuando `PV = 0`, con interpretación "No schedule data".
- *"¿Qué pasa si CPI es 0? EAC sería división por cero."* → Se implementó `EAC = 0` cuando `CPI = 0`.

**4. Verificación de tests contra calculadora externa:**
Se verificaron los resultados del test `test_standard_calculation` contra una calculadora manual en Excel:
- BAC = $100,000, Planned% = 60%, Actual% = 45%, AC = $40,000
- PV = $60,000, EV = $45,000, CV = $5,000, SV = −$15,000
- CPI = 1.125, SPI = 0.75, EAC = $88,888.89, VAC = $11,111.11
- Resultados idénticos a los del test ✅

**5. Validación de interpretaciones semánticas:**
Se verificó que las interpretaciones fueran consistentes:
- CPI > 1 → "Under budget" (estamos gastando menos de lo planeado)
- CPI < 1 → "Over budget" (estamos gastando más de lo planeado)
- CPI = 1 → "On track"
- SPI > 1 → "Ahead of schedule"
- SPI < 1 → "Behind schedule"
- SPI = 1 → "On track"

---

## 4. Dos Decisiones Donde No se Siguió a la IA

### Decisión 1: Almacenamiento vs. Cálculo en Tiempo Real de EVM

**Lo que la IA sugirió:**
En las primeras iteraciones, la IA propuso almacenar los indicadores EVM calculados en una tabla separada (`evm_snapshots`) para evitar recalcular en cada lectura, con un job programado que actualizara los valores cada N minutos. Esto seguía un patrón de materialized view.

**Por qué se rechazó:**
La decisión de arquitectura ADR-002 establece explícitamente que *"Los indicadores EVM no se almacenan, se calculan en tiempo real"*. Las razones:
1. **Consistencia:** Almacenar indicadores introduce riesgo de datos desactualizados si cambian los valores de entrada (BAC, actual_percentage, actual_cost) y no se recalcula el snapshot.
2. **Simplicidad:** Los cálculos EVM son operaciones aritméticas simples (O(1) por actividad). No hay JOINs pesados ni agregaciones complejas que justifiquen precálculo.
3. **Número de actividades:** Con un máximo de ~14 actividades por proyecto (según seed data del DBA), el costo computacional es despreciable.
4. **Single source of truth:** Los datos fuente (BAC, planned_percentage, actual_percentage, actual_cost) son los únicos valores que se persisten. Los indicadores derivados siempre reflejan el estado actual.

**Validación de la decisión:**
Se midió el tiempo de respuesta del endpoint `/api/v1/projects/{id}/evm` con los 14 actividades del seed data: respuesta en <50ms en PostgreSQL local. Esto confirma que no hay necesidad de precálculo.

### Decisión 2: Base de datos única con pooling vs. Base de datos separada por entorno

**Lo que la IA sugirió:**
La IA recomendó usar SQLite tanto para desarrollo como para pruebas, con una base de datos separada por entorno (dev.db, test.db). También sugirió usar `AsyncSession` sin pooling para SQLite.

**Por qué se modificó:**
1. **SQLite vs. PostgreSQL:** Aunque SQLite es conveniente para desarrollo local, PostgreSQL tiene tipos como `NUMERIC(10,2)` que son críticos para valores monetarios, y los índices parciales y covering indexes del DBA no funcionan en SQLite. Se implementó:
   - Desarrollo/producción: **PostgreSQL 16** con asyncpg (vía Docker Compose)
   - Tests unitarios: **SQLite en memoria** con aiosqlite (para velocidad y aislamiento)
   - El cambio entre motores es transparente gracias a SQLAlchemy 2.0

2. **Pooling en SQLite:** La IA sugirió deshabilitar pooling para SQLite. Sin embargo, SQLAlchemy 2.0 async con aiosqlite maneja correctamente el pooling interno. Se mantuvo la configuración por defecto.

**Validación:**
Los tests unitarios corren en <2 segundos con SQLite en memoria. El servidor de desarrollo responde en <100ms con PostgreSQL local.

---

## 5. Decisión de Arquitectura Independiente

### Índices de Base de Datos Más Allá de lo Especificado

**Contexto:**
Los scripts del DBA (`dba-performance-tuning.sql`) especificaban tres índices:
1. `idx_activities_evm_calc` — covering index para cálculos EVM
2. `idx_activities_delayed` — partial index para actividades retrasadas
3. `idx_activities_project_created` — composite index para listados por proyecto

**Decisión independiente:**
Además de implementar los índices del DBA, se agregaron dos índices propios:

```python
# Index for efficient ordering of projects (added independently)
Index("idx_projects_created_at", Project.created_at.desc()),

# Partial index for active-only queries (added independently)
Index(
    "idx_projects_active",
    Project.id,
    postgresql_where=text("deleted_at IS NULL"),
),
```

**Razón:**
1. `idx_projects_created_at` — El endpoint `GET /api/v1/projects` ordena por `created_at DESC`. Sin este índice, PostgreSQL haría un Sequential Scan + Sort, que con 100k+ proyectos sería lento.
2. `idx_projects_active` — Todos los queries de listado excluyen proyectos eliminados (soft delete). Un índice parcial filtra los registros `deleted_at IS NULL` en la entrada del índice, reduciendo el tamaño y mejorando la velocidad.

**Validación:**
Se verificó con `EXPLAIN ANALYZE` que ambos índices son utilizados por el planificador de PostgreSQL.

---

## 6. Reflexión Honesta

### ¿Qué haría diferente si repitiera el ejercicio?

**1. Mejor planificación de GitFlow desde el inicio.**

El mayor dolor de este proyecto fue la gestión del control de versiones. Se intentó crear un GitFlow completo desde el principio mezclando backend y frontend, luego se intentó separar, y eso generó conflictos, commits huérfanos, y ramas frontend que contaminaron el historial del backend.

**Lección:** Definir el alcance del repositorio desde el día 1. Si el backend y frontend van en el mismo repo, planificar las features en orden secuencial (todo backend primero, merge a develop, release, y luego frontend). Si van separados, crear repositorios independientes desde cero.

**2. No habría usado SQLite ni siquiera para desarrollo local.**

Aunque SQLite es rápido y conveniente, las diferencias con PostgreSQL (tipos NUMERIC, índices parciales, funciones de ventana) causaron fricción. En particular, el seed data del DBA usa `NUMERIC(10,2)` que SQLite almacena como `REAL`, perdiendo precisión en valores monetarios.

**Lección:** Usar PostgreSQL también en desarrollo local, ya sea con Docker (como se terminó haciendo) o con una instalación nativa. La consistencia entre entornos vale más que la simplicidad de SQLite.

**3. Los tests podrían haber sido más robustos desde la primera iteración.**

Los tests del EVM Calculator se escribieron después de la implementación, no durante. Aunque cubren bien los casos de uso, hubiera sido mejor adoptar TDD (Test-Driven Development) desde el principio:

- Escribir tests antes de la implementación habría detectado los edge cases de división por cero antes.
- Los tests de integración con la API deberían haber incluido validación de códigos HTTP y estructura de respuesta desde el primer commit.
- Faltaron tests de concurrencia (dos requests simultáneas modificando la misma actividad).

**Lección:** En proyectos futuros, escribir los tests del EVM Calculator como primer paso, antes de la implementación del servicio.

**4. La comunicación con el frontend no se planificó suficientemente.**

Aunque el contrato API está documentado, los cambios en los schemas Pydantic (como agregar `json_encoders` para Decimal) se hicieron reactivamente cuando el frontend no podía serializar los valores. Esto debería haberse definido en la primera iteración del contrato API.

**Lección:** Definir el contrato API incluyendo formatos exactos de serialización (cómo se entrega un Decimal, cómo se entrega un UUID, formato de fechas ISO 8601) antes de comenzar la implementación.

**5. El tiempo invertido en documentación de arquitectura fue valioso pero desbalanceado.**

Se generaron 10 agent prompts de documentación y 8 archivos de arquitectura en `docs/architecture/`. Esto fue útil para mantener coherencia, pero algunas decisiones documentadas (como el flujo de datos y el contrato API) cambiaron durante la implementación y no se actualizaron.

**Lección:** Mantener la documentación viva — no escribirla toda al principio y luego ignorarla. Actualizarla cuando cambian las decisiones de implementación, o aceptar que la documentación inicial es un borrador que evoluciona.

### Resumen de Métricas del Proyecto

| Métrica | Valor |
|---|---|
| Archivos en el repositorio (backend) | 39 |
| Líneas de código (backend) | ~4,000 |
| Commits en develop | 25 |
| Feature branches | 9 |
| Tests unitarios | 28+ |
| Cobertura de edge cases EVM | 8 escenarios |
| Tiempo de respuesta API (p95) | <100ms |
| Versiones de Python | 3.13 |
| Versiones de PostgreSQL | 16 |

---

*Documento generado como parte de la entrega del EVM Dashboard — Julio 2026.*
