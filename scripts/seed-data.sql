-- ============================================
-- EVM Database — Seed Data
-- ============================================
-- Datos de ejemplo para desarrollo y demostración.
-- Crea 3 proyectos con actividades variadas para mostrar
-- diferentes estados EVM: saludable, alerta, mixto.
-- ============================================

-- ── Proyecto 1: "Plataforma E-commerce" 🟢 Saludable ────────────
-- Este proyecto va bien: CPI > 1, SPI > 1
INSERT INTO projects (id, name, description)
VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'Plataforma E-commerce',
    'Desarrollo de plataforma de comercio electrónico B2C'
);

INSERT INTO activities (id, project_id, name, bac, planned_percentage, actual_percentage, actual_cost)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Diseño UI/UX', 15000.00, 100.00, 100.00, 14000.00),
    ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Backend API', 30000.00, 80.00, 85.00, 24000.00),
    ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Frontend React', 25000.00, 60.00, 70.00, 16000.00),
    ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Integración pagos', 20000.00, 40.00, 35.00, 6500.00),
    ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Testing QA', 10000.00, 20.00, 15.00, 1200.00);

-- ── Proyecto 2: "App Mobile Bancaria" 🔴 En Alerta ──────────────
-- Este proyecto va mal: CPI < 1, SPI < 1
INSERT INTO projects (id, name, description)
VALUES (
    'a2000000-0000-0000-0000-000000000002',
    'App Mobile Bancaria',
    'Aplicación móvil para banca digital'
);

INSERT INTO activities (id, project_id, name, bac, planned_percentage, actual_percentage, actual_cost)
VALUES
    ('b2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Arquitectura', 20000.00, 100.00, 100.00, 22000.00),
    ('b2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Módulo Auth', 18000.00, 80.00, 60.00, 16000.00),
    ('b2000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 'Módulo Transferencias', 25000.00, 60.00, 35.00, 14000.00),
    ('b2000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 'Dashboard Financiero', 22000.00, 40.00, 20.00, 8000.00),
    ('b2000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000002', 'Notificaciones Push', 12000.00, 20.00, 10.00, 3000.00);

-- ── Proyecto 3: "Migración Cloud" 🟡 Mixto ──────────────────────
-- Este proyecto tiene CPI < 1 (sobre costo) pero SPI > 1 (adelantado)
INSERT INTO projects (id, name, description)
VALUES (
    'a3000000-0000-0000-0000-000000000003',
    'Migración Cloud',
    'Migración de infraestructura on-premise a AWS'
);

INSERT INTO activities (id, project_id, name, bac, planned_percentage, actual_percentage, actual_cost)
VALUES
    ('b3000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Assessment', 10000.00, 100.00, 100.00, 12000.00),
    ('b3000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000003', 'Migración Bases de Datos', 35000.00, 70.00, 85.00, 32000.00),
    ('b3000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'Migración Aplicaciones', 40000.00, 50.00, 65.00, 30000.00),
    ('b3000000-0000-0000-0000-000000000004', 'a3000000-0000-0000-0000-000000000003', 'Seguridad y Compliance', 20000.00, 30.00, 25.00, 5000.00);

-- ── Proyecto 4: "CRM Interno" 📭 Vacío ──────────────────────────
-- Este proyecto no tiene actividades (para probar estado empty)
INSERT INTO projects (id, name, description)
VALUES (
    'a4000000-0000-0000-0000-000000000004',
    'CRM Interno',
    'Sistema CRM para el equipo de ventas — recién creado'
);
