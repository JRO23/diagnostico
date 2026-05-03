-- =====================================================
-- BASE DE DATOS EMPRESARIAL 2020-2024
-- Tabla principal para Supabase / PostgreSQL
-- =====================================================
-- INSTRUCCIONES: Copia y pega este SQL en el SQL Editor de Supabase
-- (Menú izquierdo → SQL Editor → New query)
-- =====================================================

-- 1. Eliminar tabla si ya existe (útil para re-crear)
DROP TABLE IF EXISTS public.base_datos;

-- 2. Crear tabla principal
CREATE TABLE public.base_datos (
  -- Clave primaria auto-generada
  id                                              BIGSERIAL PRIMARY KEY,

  -- ── Identificación corporativa ───────────────────
  nit                                             TEXT,
  razon_social                                    TEXT,

  -- ── Clasificación y geografía ────────────────────
  punto_entrada                                   TEXT,
  departamento                                    TEXT,
  zona                                            TEXT,
  sector                                          TEXT,
  tamano                                          TEXT,
  ciiu                                            TEXT,
  ano                                             SMALLINT,
  empresas_5_anos                                 SMALLINT,

  -- ── Referencia UVT ───────────────────────────────
  uvt                                             NUMERIC(20, 6),

  -- ══ ACTIVOS ══════════════════════════════════════
  -- Activos Corrientes
  efectivo_y_equivalentes_al_efectivo             NUMERIC(20, 2),
  cuentas_comerciales_por_cobrar_corrientes       NUMERIC(20, 2),
  inventarios_corrientes                          NUMERIC(20, 2),
  otros_activos_financieros_corrientes            NUMERIC(20, 2),
  activos_corrientes_totales                      NUMERIC(20, 2),
  -- Activos No Corrientes
  propiedades_planta_y_equipo                     NUMERIC(20, 2),
  activos_intangibles_distintos_plusvalia         NUMERIC(20, 2),
  inversiones_en_subsidiarias                     NUMERIC(20, 2),
  cuentas_por_cobrar_no_corrientes                NUMERIC(20, 2),
  total_activos_no_corrientes                     NUMERIC(20, 2),
  -- Total Activos
  total_de_activos                                NUMERIC(20, 2),

  -- ══ PASIVOS ══════════════════════════════════════
  -- Pasivos Corrientes
  cuentas_por_pagar_comerciales_corrientes        NUMERIC(20, 2),
  otros_pasivos_financieros_corrientes            NUMERIC(20, 2),
  pasivos_por_impuestos_corrientes                NUMERIC(20, 2),
  pasivos_corrientes_totales                      NUMERIC(20, 2),
  -- Pasivos No Corrientes
  cuentas_por_pagar_no_corrientes                 NUMERIC(20, 2),
  pasivo_por_impuestos_diferidos                  NUMERIC(20, 2),
  otros_pasivos_financieros_no_corrientes         NUMERIC(20, 2),
  total_pasivos_no_corrientes                     NUMERIC(20, 2),
  -- Total Pasivos
  total_pasivos                                   NUMERIC(20, 2),

  -- ══ PATRIMONIO ═══════════════════════════════════
  capital_emitido                                 NUMERIC(20, 2),
  prima_de_emision                                NUMERIC(20, 2),
  superavit_por_revaluacion                       NUMERIC(20, 2),
  otras_reservas                                  NUMERIC(20, 2),
  ganancias_acumuladas                            NUMERIC(20, 2),
  patrimonio_total                                NUMERIC(20, 2),
  total_de_patrimonio_y_pasivos                   NUMERIC(20, 2),

  -- ══ ESTADO DE RESULTADOS ══════════════════════════
  ingresos_de_actividades_ordinarias              NUMERIC(20, 2),
  costo_de_ventas                                 NUMERIC(20, 2),
  ganancia_bruta                                  NUMERIC(20, 2),
  gastos_de_administracion                        NUMERIC(20, 2),
  gastos_de_ventas                                NUMERIC(20, 2),
  ganancia_perdida_por_actividades_de_operacion   NUMERIC(20, 2),
  otros_igresos_ingros_financieron                NUMERIC(20, 2),
  otros_ingresos                                  NUMERIC(20, 2),
  ingresos_financieros                            NUMERIC(20, 2),
  otros_gastos                                    NUMERIC(20, 2),
  costos_financieros                              NUMERIC(20, 2),
  ganancia_perdida_antes_de_impuestos             NUMERIC(20, 2),
  ingreso_gasto_por_impuestos                     NUMERIC(20, 2),
  ganancia_perdida                                NUMERIC(20, 2),

  -- ── Metadatos ────────────────────────────────────
  created_at                                      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Deshabilitar RLS (acceso propio, sin seguridad)
ALTER TABLE public.base_datos DISABLE ROW LEVEL SECURITY;

-- 4. Índices para consultas frecuentes (mejora el rendimiento)
CREATE INDEX idx_base_datos_ano        ON public.base_datos(ano);
CREATE INDEX idx_base_datos_nit        ON public.base_datos(nit);
CREATE INDEX idx_base_datos_sector     ON public.base_datos(sector);
CREATE INDEX idx_base_datos_depto      ON public.base_datos(departamento);
CREATE INDEX idx_base_datos_tamano     ON public.base_datos(tamano);

-- 5. Confirmación
SELECT 'Tabla base_datos creada correctamente con ' || COUNT(*) || ' columnas.' AS resultado
FROM information_schema.columns
WHERE table_name = 'base_datos' AND table_schema = 'public';
