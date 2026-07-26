-- ============================================================================
-- Guía de Ajuste de Rendimiento PostgreSQL — EVM Database
-- ============================================================================
-- Este script es una GUÍA DE REFERENCIA, NO se ejecuta automáticamente.
-- Contiene recomendaciones de configuración, ejemplos de EXPLAIN ANALYZE,
-- y estrategias de optimización según buenas prácticas DBA.
--
-- Cumplimiento: 04-BASE-DE-DATOS.md + Skill PostgreSQL Database Engineering
-- Versión: PostgreSQL 15+
-- ============================================================================

-- ============================================================================
-- 1. CONFIGURACIÓN DE POSTGRESQL (postgresql.conf / ALTER SYSTEM)
-- ============================================================================
-- La configuración óptima depende del hardware disponible.
-- Para el contenedor Docker actual (postgres:15-alpine) con recursos limitados:

-- 1.1 Memoria Compartida (shared_buffers: ~25% de la RAM disponible)
ALTER SYSTEM SET shared_buffers = '256MB';

-- 1.2 Caché del sistema de archivos (effective_cache_size: ~50-75% de la RAM)
ALTER SYSTEM SET effective_cache_size = '512MB';

-- 1.3 Memoria para operaciones de sort/hash (work_mem: por operación, no global)
--     Valor conservador para evitar que queries complejas consuman toda la RAM
ALTER SYSTEM SET work_mem = '16MB';

-- 1.4 Memoria para mantenimiento (VACUUM, CREATE INDEX)
ALTER SYSTEM SET maintenance_work_mem = '128MB';

-- 1.5 Costo de I/O (ajustar a SSD: 1.1, HDD: 4.0)
ALTER SYSTEM SET random_page_cost = 1.1;

-- 1.6 Concurrencia de I/O (SSD moderno: 200, HDD: 2)
ALTER SYSTEM SET effective_io_concurrency = 200;

-- 1.7 Configuración de WAL para evitar I/O intensivo
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET max_wal_size = '1GB';
ALTER SYSTEM SET min_wal_size = '256MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;

-- 1.8 Estadísticas de queries (para pg_stat_statements)
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- 1.9 Paralelismo (para consultas analíticas)
ALTER SYSTEM SET max_parallel_workers_per_gather = 2;
ALTER SYSTEM SET max_parallel_workers = 4;
ALTER SYSTEM SET parallel_setup_cost = 1000;
ALTER SYSTEM SET parallel_tuple_cost = 0.1;

-- NOTA: ALTER SYSTEM requiere RECARGAR configuración:
-- SELECT pg_reload_conf();
--
-- Algunos parámetros (shared_buffers, max_connections) requieren reinicio:
-- SELECT pg_reload_conf();  -- Para parámetros que soportan reload
-- Reinicio del contenedor para los que requieren restart

-- ============================================================================
-- 2. EXPLAIN ANALYZE — PLANES DE EJECUCIÓN
-- ============================================================================
-- Los planes de ejecución muestran cómo PostgreSQL ejecuta cada query.
-- Buscar:
--   ❌ Sequential Scan en tablas grandes → falta índice
--   ❌ actual rows ≠ planned rows       → estadísticas desactualizadas
--   ❌ actual time muy alto             → optimizar query/índices
--   ✅ Index Scan / Index Only Scan     → buen uso de índices
--   ✅ Bitmap Heap Scan                 → aceptable para muchos registros

-- 2.1 Query: Listar actividades de un proyecto (el JOIN más frecuente)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    a.id,
    a.name,
    a.bac,
    a.planned_percentage,
    a.actual_percentage,
    a.actual_cost,
    a.created_at
FROM activities a
WHERE a.project_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
ORDER BY a.created_at DESC;

-- EXPECTED: Index Scan using idx_activities_project_created
-- Este índice compuesto cubre project_id + created_at DESC
-- Si aparece Sequential Scan, el índice no se está usando.

-- 2.2 Query: Proyectos con indicadores EVM resumidos
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    p.id,
    p.name,
    COUNT(a.id) AS total_activities,
    SUM(a.bac) AS total_bac,
    SUM(a.actual_cost) AS total_actual_cost,
    AVG(a.actual_percentage) AS avg_actual_percentage,
    AVG(a.planned_percentage) AS avg_planned_percentage
FROM projects p
LEFT JOIN activities a ON a.project_id = p.id
GROUP BY p.id, p.name
ORDER BY p.created_at DESC;

-- EXPECTED:
--   - Hash Join (activities LEFT JOIN projects)
--   - Index Scan on idx_activities_project_id para el JOIN
--   - Sort por created_at usando idx_projects_created_at_desc

-- 2.3 Query: Actividades retrasadas (con índice parcial)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    a.name,
    a.bac,
    a.planned_percentage,
    a.actual_percentage,
    (a.planned_percentage - a.actual_percentage) AS delay_percentage,
    a.actual_cost
FROM activities a
WHERE a.project_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
  AND a.actual_percentage < a.planned_percentage
ORDER BY (a.planned_percentage - a.actual_percentage) DESC;

-- EXPECTED: Index Scan using idx_activities_delayed (partial index)
-- El índice parcial idx_activities_delayed filtra previamente las actividades
-- que cumplen actual_percentage < planned_percentage.

-- 2.4 Query: Proyectos modificados recientemente (sincronización)
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, updated_at
FROM projects
WHERE updated_at > NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC;

-- EXPECTED: Index Scan Backward using idx_projects_updated_at_desc

-- ============================================================================
-- 3. DETECCIÓN DE N+1 QUERIES (ANTIPATRÓN)
-- ============================================================================
-- El antipatrón N+1 ocurre cuando se hace 1 query para obtener N registros
-- y luego N queries adicionales (uno por cada registro).
--
-- 🔴 MAL (N+1): Código similar a:
--   projects = db.query("SELECT * FROM projects")
--   for project in projects:
--       activities = db.query("SELECT * FROM activities WHERE project_id = ?")
--
-- 🟢 BIEN (JOIN único):
--   SELECT p.*, json_agg(a.*) as activities
--   FROM projects p
--   LEFT JOIN activities a ON a.project_id = p.id
--   GROUP BY p.id;

-- 3.1 Query óptima: Proyectos con sus actividades (1 solo viaje)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    p.id AS project_id,
    p.name AS project_name,
    p.description,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', a.id,
                'name', a.name,
                'bac', a.bac,
                'planned_percentage', a.planned_percentage,
                'actual_percentage', a.actual_percentage,
                'actual_cost', a.actual_cost
            )
            ORDER BY a.created_at DESC
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::jsonb
    ) AS activities
FROM projects p
LEFT JOIN activities a ON a.project_id = p.id
GROUP BY p.id, p.name, p.description
ORDER BY p.created_at DESC;

-- 3.2 Query óptima: EVM por proyecto (todo en 1 query)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    p.id,
    p.name,
    COUNT(a.id) AS total_activities,
    SUM(a.bac) AS total_bac,
    SUM(a.bac * a.actual_percentage / 100.0) AS earned_value,
    SUM(a.bac * a.planned_percentage / 100.0) AS planned_value,
    SUM(a.actual_cost) AS actual_cost,
    SUM(a.actual_cost) - SUM(a.bac * a.actual_percentage / 100.0) AS cost_variance,
    SUM(a.bac * a.actual_percentage / 100.0) - SUM(a.bac * a.planned_percentage / 100.0) AS schedule_variance
FROM projects p
JOIN activities a ON a.project_id = p.id
GROUP BY p.id, p.name;

-- ============================================================================
-- 4. CUANTIFICACIÓN DE RENDIMIENTO (BEFORE / AFTER)
-- ============================================================================
-- NOTA: Estos son EJEMPLOS. Ejecutar localmente para mediciones reales.

-- 4.1 BEFORE: Sin índices adicionales
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM activities
WHERE actual_percentage < planned_percentage
  AND project_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

-- EXPECTED: Bitmap Heap Scan + Filter on actual_percentage < planned_percentage
-- (no puede usar el índice directamente si no existe el índice parcial)

-- 4.2 AFTER: Con índice parcial idx_activities_delayed
-- El mismo query ahora usa:
-- Index Scan using idx_activities_delayed (solo filas que cumplen la condición)
-- Beneficio: menos filas leídas = menos I/O = más rápido

-- 4.3 BEFORE: Sin covering index para cálculos EVM
EXPLAIN (ANALYZE, BUFFERS)
SELECT a.bac, a.actual_percentage, a.planned_percentage, a.actual_cost, a.name
FROM activities a
WHERE a.project_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- EXPECTED: Index Scan on idx_activities_project_id + Table access by indexed rowid
-- PostgreSQL necesita ir a la tabla para obtener bac, actual_percentage, etc.

-- 4.4 AFTER: Index Only Scan (covering index)
-- Con idx_activities_evm_calc, todas las columnas están en el índice
-- EXPECTED: Index Only Scan usando idx_activities_evm_calc
-- Beneficio: nunca toca la tabla principal = significativamente más rápido

-- ============================================================================
-- 5. ESTRATEGIA DE VACUUM Y MANTENIMIENTO
-- ============================================================================

-- 5.1 Monitorear dead tuples (tuplas muertas por VACUUM)
SELECT
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;

-- 5.2 VACUUM manual (no bloquea lecturas/escrituras)
-- Ejecutar cuando dead_pct > 20%
VACUUM (VERBOSE, ANALYZE) projects;
VACUUM (VERBOSE, ANALYZE) activities;

-- 5.3 VACUUM FREEZE (para prevención de wraparound)
-- Ejecutar en periodos de baja actividad
VACUUM (FREEZE, VERBOSE) projects;
VACUUM (FREEZE, VERBOSE) activities;

-- 5.4 Monitorear antigüedad de transacciones (wraparound prevention)
SELECT
    datname,
    age(datfrozenxid) AS txid_age,
    ROUND(age(datfrozenxid) * 100.0 / NULLIF(
        (SELECT setting::integer FROM pg_settings WHERE name = 'autovacuum_freeze_max_age'),
        0
    ), 2) AS pct_towards_wraparound
FROM pg_database
WHERE datname = 'evm_database';

-- ⚠️ Si pct_towards_wraparound > 80%, ejecutar VACUUM FREEZE urgente

-- 5.5 REINDEX CONCURRENTLY (no bloquea escrituras, PG 12+)
-- Útil cuando hay bloated indexes
REINDEX INDEX CONCURRENTLY idx_activities_project_id;
REINDEX INDEX CONCURRENTLY idx_activities_evm_calc;

-- ============================================================================
-- 6. CONFIGURACIÓN DE CONEXIONES Y POOLING
-- ============================================================================

-- 6.1 Monitorear conexiones activas
SELECT
    count(*) AS total_connections,
    count(*) FILTER (WHERE state = 'active') AS active,
    count(*) FILTER (WHERE state = 'idle') AS idle,
    count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_transaction,
    count(*) FILTER (WHERE wait_event IS NOT NULL) AS waiting
FROM pg_stat_activity
WHERE datname = 'evm_database';

-- 6.2 Configurar límite de conexiones para la aplicación
ALTER SYSTEM SET max_connections = '100';

-- 6.3 Para Supabase/PlanetScale: usar connection pooling transaction mode
-- Puerto 6543 para transaction pooling (Supabase)
-- Puerto 5432 para session pooling (directo)
-- La URL de conexión con pooling sería:
-- postgresql://postgres:postgres123@host:6543/evm_database

-- ============================================================================
-- 7. CACHE HIT RATIO
-- ============================================================================
-- El cache hit ratio ideal es > 99%.
-- Si es menor, aumentar shared_buffers o reducir datos en memoria.

SELECT
    'Cache Hit Ratio' AS metric,
    ROUND(
        SUM(heap_blks_hit) * 100.0 / NULLIF(SUM(heap_blks_hit) + SUM(heap_blks_read), 0),
        2
    ) AS value_pct
FROM pg_statio_user_tables
WHERE schemaname = 'public'

UNION ALL

SELECT
    'Index Cache Hit Ratio' AS metric,
    ROUND(
        SUM(idx_blks_hit) * 100.0 / NULLIF(SUM(idx_blks_hit) + SUM(idx_blks_read), 0),
        2
    ) AS value_pct
FROM pg_statio_user_indexes
WHERE schemaname = 'public';

-- ============================================================================
-- 8. RECOMENDACIONES FINALES
-- ============================================================================
--
-- Para el volumen actual (decenas de actividades, pocos proyectos),
-- la configuración por defecto de PostgreSQL 15 es suficiente.
-- Las optimizaciones aquí descritas son PREVENTIVAS y escalan
-- cuando el sistema crezca.
--
-- Prioridades de optimización:
--   1. Índices en Foreign Keys ✅ (ya implementado)
--   2. Índices compuestos para queries frecuentes ✅ (ya implementado)
--   3. Índices parciales para filtros específicos ✅ (ya implementado)
--   4. Índices covering para cálculos frecuentes ✅ (ya implementado)
--   5. Configuración de memoria y I/O ⬅️ (ajustar según hardware)
--   6. Monitoreo con pg_stat_statements ⬅️ (ya habilitado)
--   7. VACUUM y mantenimiento regular ⬅️ (autovacuum por defecto)
--
-- Próximos pasos cuando el sistema crezca:
--   - Implementar pgBouncer para pool de conexiones
--   - Crear materialized views para reportes EVM recurrentes
--   - Implementar particionamiento por rango de fechas en activities
--   - Caché en Redis para indicadores EVM si el cálculo en tiempo real
--     supera los 100ms (ver ADR-010)
--
-- ============================================================================
