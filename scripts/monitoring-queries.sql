-- ============================================================================
-- Monitoreo de Base de Datos — EVM Database
-- PostgreSQL 15+
-- ============================================================================
-- Script de consultas para monitoreo y diagnóstico en producción.
-- Estas consultas ayudan al DBA a identificar cuellos de botella,
-- queries lentas, bloqueos y problemas de rendimiento.
--
-- Requiere: pg_stat_statements (habilitado en init-db.sql)
-- ============================================================================

-- ============================================================================
-- 1. ESTADO GENERAL DEL SISTEMA
-- ============================================================================

-- 1.1 Versión de PostgreSQL y uptime
SELECT
    version(),
    pg_postmaster_start_time() AS server_start,
    ROUND(EXTRACT(EPOCH FROM NOW() - pg_postmaster_start_time()) / 3600, 2) AS uptime_hours;

-- 1.2 Bases de datos y tamaños
SELECT
    d.datname AS database_name,
    pg_size_pretty(pg_database_size(d.datname)) AS size,
    ROUND(pg_database_size(d.datname) * 100.0 / NULLIF(SUM(pg_database_size(d.datname)) OVER (), 0), 2) AS pct_of_total,
    d.datconnlimit AS connection_limit,
    (SELECT count(*) FROM pg_stat_activity WHERE datname = d.datname) AS active_connections
FROM pg_database d
WHERE d.datistemplate = false
ORDER BY pg_database_size(d.datname) DESC;

-- 1.3 Conexiones activas detalladas
SELECT
    pid,
    usename AS user,
    application_name AS app,
    client_addr,
    state,
    wait_event_type,
    wait_event,
    ROUND(EXTRACT(EPOCH FROM (NOW() - query_start))::numeric, 2) AS query_duration_seconds,
    ROUND(EXTRACT(EPOCH FROM (NOW() - state_change))::numeric, 2) AS state_duration_seconds,
    LEFT(query, 200) AS query_preview
FROM pg_stat_activity
WHERE datname = 'evm_database'
  AND pid <> pg_backend_pid()
ORDER BY query_start DESC NULLS LAST;

-- ============================================================================
-- 2. RENDIMIENTO DE CONSULTAS (pg_stat_statements)
-- ============================================================================

-- 2.1 Top 10 queries por tiempo total de ejecución
SELECT
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    ROUND(mean_exec_time::numeric, 2) AS avg_time_ms,
    calls,
    ROUND((total_exec_time / 1000)::numeric, 2) AS total_time_seconds,
    ROUND(rows::numeric / NULLIF(calls, 0), 2) AS avg_rows,
    ROUND(shared_blks_hit * 100.0 / NULLIF(shared_blks_hit + shared_blks_read, 0), 2) AS cache_hit_pct,
    LEFT(query, 150) AS query_preview
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = 'evm_database')
ORDER BY total_exec_time DESC
LIMIT 10;

-- 2.2 Top 10 queries por tiempo promedio (queries lentas individuales)
SELECT
    ROUND(mean_exec_time::numeric, 2) AS avg_time_ms,
    calls,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    ROUND(max_exec_time::numeric, 2) AS max_time_ms,
    rows,
    ROUND(shared_blks_hit * 100.0 / NULLIF(shared_blks_hit + shared_blks_read, 0), 2) AS cache_hit_pct,
    LEFT(query, 150) AS query_preview
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = 'evm_database')
  AND calls > 10  -- Ignorar queries poco frecuentes
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 2.3 Top 10 queries más frecuentes
SELECT
    calls,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    ROUND(mean_exec_time::numeric, 2) AS avg_time_ms,
    ROUND(rows::numeric / NULLIF(calls, 0), 2) AS avg_rows_per_call,
    LEFT(query, 120) AS query_preview
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = 'evm_database')
ORDER BY calls DESC
LIMIT 10;

-- 2.4 Queries que leen más datos (I/O intensivo)
SELECT
    calls,
    ROUND(mean_exec_time::numeric, 2) AS avg_time_ms,
    shared_blks_read AS blocks_read,
    local_blks_read AS local_blocks_read,
    temp_blks_read AS temp_blocks_read,  -- ⚠️ Uso de disco temporal
    LEFT(query, 120) AS query_preview
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = 'evm_database')
ORDER BY shared_blks_read DESC
LIMIT 10;

-- ⚠️ temp_blks_read > 0 indica que work_mem es insuficiente para la query
-- Solución: aumentar work_mem o simplificar la query

-- ============================================================================
-- 3. USO DE ÍNDICES
-- ============================================================================

-- 3.1 Índices no utilizados (candidatos a eliminación)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS times_used,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    (SELECT SUBSTRING(pg_get_indexdef(indexrelid) FROM 15)) AS index_definition
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelid NOT IN (
      -- Excluir índices de PK y únicos (necesarios para integridad)
      SELECT indexrelid FROM pg_index WHERE indisprimary OR indisunique
  )
ORDER BY pg_relation_size(indexrelid) DESC;

-- 3.2 Índices más utilizados
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS times_used,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 10;

-- 3.3 Tamaño de índices vs tablas
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_table_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS indexes_size,
    ROUND(pg_indexes_size(relid) * 100.0 / NULLIF(pg_table_size(relid), 0), 2) AS idx_pct_of_table,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC;

-- ============================================================================
-- 4. BLOQUEOS Y CONTENCIÓN
-- ============================================================================

-- 4.1 Queries bloqueadas (no progresa)
SELECT
    blocked.pid AS blocked_pid,
    blocked.usename AS blocked_user,
    blocked.query AS blocked_query,
    ROUND(EXTRACT(EPOCH FROM (NOW() - blocked.query_start))::numeric, 2) AS blocked_duration_seconds,
    blocker.pid AS blocker_pid,
    blocker.usename AS blocker_user,
    blocker.query AS blocker_query,
    blocked.wait_event_type,
    blocked.wait_event
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocker ON blocker.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE blocked.datname = 'evm_database'
  AND blocked.state = 'active'
ORDER BY blocked.query_start;

-- 4.2 Estadísticas de bloqueos (histórico desde último reset)
SELECT
    datname,
    deadlocks,
    conflicts,
    ROUND(EXTRACT(EPOCH FROM (NOW() - stats_reset))::numeric, 2) AS seconds_since_reset
FROM pg_stat_database
WHERE datname = 'evm_database';

-- 4.3 Conexiones idle in transaction (posibles bloqueos)
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    ROUND(EXTRACT(EPOCH FROM (NOW() - state_change))::numeric, 2) AS idle_seconds,
    LEFT(query, 200) AS last_query
FROM pg_stat_activity
WHERE datname = 'evm_database'
  AND state = 'idle in transaction'
  AND state_change < NOW() - INTERVAL '1 minute'
ORDER BY state_change;

-- ⚠️ idle in transaction prolongado puede bloquear VACUUM
-- y causar acumulación de dead tuples

-- ============================================================================
-- 5. BLOAT (INFLACIÓN) DE TABLAS E ÍNDICES
-- ============================================================================

-- 5.1 Dead tuples por tabla
SELECT
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
    last_autovacuum,
    last_autoanalyze,
    CASE
        WHEN n_dead_tup > 1000
         AND ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) > 20
        THEN '⚠️  NECESITA VACUUM'
        WHEN n_dead_tup > 0 THEN '✅ OK'
        ELSE '✅ SIN DATOS'
    END AS action_needed
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;

-- 5.2 Antigüedad de transacciones (wraparound prevention)
SELECT
    datname,
    age(datfrozenxid) AS txid_age,
    ROUND(age(datfrozenxid) * 100.0 / NULLIF(
        current_setting('autovacuum_freeze_max_age')::integer, 0
    ), 2) AS pct_to_wraparound,
    CASE
        WHEN age(datfrozenxid) > current_setting('autovacuum_freeze_max_age')::integer * 0.8
        THEN '⚠️  ALTO RIESGO - Ejecutar VACUUM FREEZE'
        WHEN age(datfrozenxid) > current_setting('autovacuum_freeze_max_age')::integer * 0.5
        THEN '⚠️  Monitorear'
        ELSE '✅ OK'
    END AS status
FROM pg_database
WHERE datname = 'evm_database';

-- 5.3 Tamaño de tablas y estimación de bloat en índices
-- (Requiere la extensión pgstattuple para medición exacta)
-- Esta es una estimación usando estadísticas del sistema
SELECT
    indexrelid::regclass AS index_name,
    reltuples::bigint AS estimated_rows,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- 6. CACHE HIT RATIO DETALLADO
-- ============================================================================

SELECT
    'Cache Hit Ratio' AS metric_name,
    schemaname,
    tablename,
    ROUND(
        (heap_blks_hit * 100.0) / NULLIF(heap_blks_hit + heap_blks_read, 0),
        2
    ) AS hit_ratio_pct,
    heap_blks_hit AS hits,
    heap_blks_read AS reads
FROM pg_statio_user_tables
WHERE schemaname = 'public'
  AND (heap_blks_hit + heap_blks_read) > 0
ORDER BY hit_ratio_pct ASC;
-- Las tablas con hit_ratio < 99% son candidatas a:
--   - Aumentar shared_buffers
--   - Revisar índices
--   - Revisar patrones de acceso

-- ============================================================================
-- 7. SESIONES Y CONFIGURACIÓN
-- ============================================================================

-- 7.1 Parámetros de configuración actuales (relevantes para rendimiento)
SELECT
    name,
    setting,
    unit,
    pending_restart,
    COALESCE(short_desc, '') AS description
FROM pg_settings
WHERE name IN (
    'shared_buffers',
    'effective_cache_size',
    'work_mem',
    'maintenance_work_mem',
    'random_page_cost',
    'effective_io_concurrency',
    'max_connections',
    'max_parallel_workers',
    'max_parallel_workers_per_gather',
    'wal_buffers',
    'max_wal_size',
    'min_wal_size',
    'checkpoint_completion_target',
    'autovacuum_max_workers',
    'autovacuum_naptime',
    'pg_stat_statements.track',
    'pg_stat_statements.max'
)
ORDER BY name;

-- 7.2 Cuánto tiempo hasta el próximo autovacuum (estimado)
SELECT
    relname,
    n_dead_tup,
    ROUND(
        (current_setting('autovacuum_vacuum_threshold')::bigint
         + current_setting('autovacuum_vacuum_scale_factor')::numeric * n_live_tup
         - n_dead_tup)::numeric,
        2
    ) AS tuples_until_vacuum,
    CASE
        WHEN (current_setting('autovacuum_vacuum_threshold')::bigint
              + current_setting('autovacuum_vacuum_scale_factor')::numeric * n_live_tup
              - n_dead_tup) <= 0
        THEN '⚠️  EJECUTANDO AHORA / REQUIERE VACUUM'
        ELSE '✅ OK'
    END AS status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;

-- ============================================================================
-- 8. DIAGNÓSTICOS RÁPIDOS
-- ============================================================================

-- 8.1 Resumen ejecutivo de salud de la BD
WITH
connections AS (
    SELECT count(*) AS total, count(*) FILTER (WHERE state = 'active') AS active
    FROM pg_stat_activity WHERE datname = 'evm_database'
),
cache AS (
    SELECT ROUND(SUM(heap_blks_hit) * 100.0 / NULLIF(SUM(heap_blks_hit) + SUM(heap_blks_read), 0), 2) AS hit_ratio
    FROM pg_statio_user_tables WHERE schemaname = 'public'
),
bloat AS (
    SELECT count(*) AS bloated_tables
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
      AND n_dead_tup > 1000
      AND (n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0)) > 20
),
locks AS (
    SELECT count(*) AS blocked_queries
    FROM pg_stat_activity
    WHERE datname = 'evm_database'
      AND state = 'active'
      AND pid != pg_backend_pid()
      AND EXISTS (SELECT 1 FROM pg_locks WHERE NOT granted AND pid = pg_stat_activity.pid)
),
slow AS (
    SELECT count(*) AS slow_queries
    FROM pg_stat_activity
    WHERE datname = 'evm_database'
      AND state = 'active'
      AND query_start < NOW() - INTERVAL '30 seconds'
      AND query NOT LIKE '%pg_stat_activity%'
)
SELECT
    NOW() AS check_time,
    c.total AS total_connections,
    c.active AS active_connections,
    ch.hit_ratio AS cache_hit_pct,
    b.bloated_tables AS tables_needing_vacuum,
    l.blocked_queries AS blocked_queries,
    s.slow_queries AS long_running_queries,
    CASE
        WHEN b.bloated_tables > 0 OR l.blocked_queries > 0 OR s.slow_queries > 0
        THEN '⚠️  Se requiere atención'
        WHEN ch.hit_ratio < 99 THEN '⚠️  Cache hit ratio bajo'
        ELSE '✅ Sistema saludable'
    END AS overall_status
FROM connections c, cache ch, bloat b, locks l, slow s;

-- 8.2 Historial de autovacuum
SELECT
    relname,
    relid::regclass AS table_name,
    schemaname,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    vacuum_count,
    autovacuum_count,
    analyze_count,
    autoanalyze_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY last_autovacuum NULLS FIRST;

-- ============================================================================
-- 9. TABLA DE MÉTRICAS CRÍTICAS CON UMBRALES
-- ============================================================================
--
-- Métrica                    | Bueno    | Atención  | Crítico    | Acción
-- ---------------------------|----------|-----------|------------|-------
-- Cache Hit Ratio           | > 99%    | 95-99%    | < 95%      | Aumentar shared_buffers
-- Dead Tuple Ratio          | < 10%    | 10-30%    | > 30%      | VACUUM
-- Conexiones activas        | < 50%    | 50-80%    | > 80%      | Aumentar max_connections o pool
-- Queries lentas (> 1s)     | 0        | 1-5       | > 5        | Optimizar queries/índices
-- Bloqueos activos          | 0        | 1-3       | > 3        | Investigar sesiones bloqueadas
-- Wraparound age            | < 50%    | 50-80%    | > 80%      | VACUUM FREEZE
-- temp_blks_read > 0        | No       | -         | Sí         | Aumentar work_mem
-- Índices no usados         | 0        | 1-3       | > 3        | Evaluar eliminación
--
-- ============================================================================
