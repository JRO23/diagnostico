-- ══════════════════════════════════════════════════════════
-- FUNCIONES DE ANÁLISIS SECTORIAL
-- Ejecutar en: Supabase → SQL Editor → New query
-- ══════════════════════════════════════════════════════════

-- 1. Lista de CIIUs con conteo de empresas
CREATE OR REPLACE FUNCTION get_ciiu_list()
RETURNS TABLE(ciiu_code text, empresa_count bigint)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT ciiu, COUNT(DISTINCT nit) as empresa_count
  FROM base_datos
  WHERE ciiu IS NOT NULL AND ciiu != ''
  GROUP BY ciiu
  ORDER BY ciiu;
$$;

-- 2. Datos agregados por año para un CIIU específico
CREATE OR REPLACE FUNCTION get_sector_data(
  p_ciiu       text,
  p_start_year int DEFAULT 2020,
  p_end_year   int DEFAULT 2024
)
RETURNS TABLE(
  ano                      smallint,
  num_empresas             bigint,
  sum_ingresos             numeric,
  sum_ganancia             numeric,
  sum_activos              numeric,
  sum_pasivos              numeric,
  sum_patrimonio           numeric,
  sum_act_corrientes       numeric,
  sum_pas_corrientes       numeric,
  sum_costo_ventas         numeric,
  sum_ganancia_bruta       numeric,
  sum_ganancia_operacional numeric,
  sum_gastos_admin         numeric,
  sum_gastos_ventas        numeric,
  sum_costos_financieros   numeric,
  sum_ganancia_antes_imp   numeric,
  sum_inventarios          numeric,
  sum_cuentas_cobrar       numeric,
  sum_cuentas_pagar        numeric,
  avg_margen_neto          numeric,
  avg_roa                  numeric,
  avg_roe                  numeric,
  avg_liquidez             numeric,
  avg_endeudamiento        numeric
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT
    ano,
    COUNT(DISTINCT nit)                                                        AS num_empresas,
    SUM(ingresos_de_actividades_ordinarias)                                    AS sum_ingresos,
    SUM(ganancia_perdida)                                                      AS sum_ganancia,
    SUM(total_de_activos)                                                      AS sum_activos,
    SUM(total_pasivos)                                                         AS sum_pasivos,
    SUM(patrimonio_total)                                                      AS sum_patrimonio,
    SUM(activos_corrientes_totales)                                            AS sum_act_corrientes,
    SUM(pasivos_corrientes_totales)                                            AS sum_pas_corrientes,
    SUM(costo_de_ventas)                                                       AS sum_costo_ventas,
    SUM(ganancia_bruta)                                                        AS sum_ganancia_bruta,
    SUM(ganancia_perdida_por_actividades_de_operacion)                         AS sum_ganancia_operacional,
    SUM(gastos_de_administracion)                                              AS sum_gastos_admin,
    SUM(gastos_de_ventas)                                                      AS sum_gastos_ventas,
    SUM(costos_financieros)                                                    AS sum_costos_financieros,
    SUM(ganancia_perdida_antes_de_impuestos)                                   AS sum_ganancia_antes_imp,
    SUM(inventarios_corrientes)                                                AS sum_inventarios,
    SUM(cuentas_comerciales_por_cobrar_corrientes)                             AS sum_cuentas_cobrar,
    SUM(cuentas_por_pagar_comerciales_corrientes)                              AS sum_cuentas_pagar,
    AVG(CASE WHEN ingresos_de_actividades_ordinarias <> 0
        THEN ganancia_perdida / ingresos_de_actividades_ordinarias ELSE NULL END) AS avg_margen_neto,
    AVG(CASE WHEN total_de_activos <> 0
        THEN ganancia_perdida / total_de_activos ELSE NULL END)                AS avg_roa,
    AVG(CASE WHEN patrimonio_total <> 0
        THEN ganancia_perdida / patrimonio_total ELSE NULL END)                AS avg_roe,
    AVG(CASE WHEN pasivos_corrientes_totales <> 0
        THEN activos_corrientes_totales / pasivos_corrientes_totales ELSE NULL END) AS avg_liquidez,
    AVG(CASE WHEN total_de_activos <> 0
        THEN total_pasivos / total_de_activos ELSE NULL END)                   AS avg_endeudamiento
  FROM base_datos
  WHERE ciiu = p_ciiu AND ano BETWEEN p_start_year AND p_end_year
  GROUP BY ano
  ORDER BY ano;
$$;

-- 3. Benchmarks globales para comparar en Índice de Atractivo
CREATE OR REPLACE FUNCTION get_sector_context(p_year int)
RETURNS TABLE(
  ciiu_code      text,
  total_ingresos numeric,
  avg_margen     numeric,
  avg_roa        numeric,
  num_empresas   bigint
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT
    ciiu                                                                         AS ciiu_code,
    SUM(ingresos_de_actividades_ordinarias)                                      AS total_ingresos,
    AVG(CASE WHEN ingresos_de_actividades_ordinarias <> 0
        THEN ganancia_perdida / ingresos_de_actividades_ordinarias ELSE NULL END) AS avg_margen,
    AVG(CASE WHEN total_de_activos <> 0
        THEN ganancia_perdida / total_de_activos ELSE NULL END)                  AS avg_roa,
    COUNT(DISTINCT nit)                                                          AS num_empresas
  FROM base_datos
  WHERE ano = p_year AND ciiu IS NOT NULL AND ciiu != ''
  GROUP BY ciiu
  ORDER BY total_ingresos DESC NULLS LAST
  LIMIT 30;
$$;

-- Verificación
SELECT 'Funciones creadas correctamente' AS resultado;

-- ── PERMISOS (necesarios para que el anon key del frontend pueda llamar las funciones) ──
GRANT EXECUTE ON FUNCTION get_ciiu_list() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_sector_data(text, int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_sector_context(int) TO anon, authenticated;
GRANT SELECT ON TABLE public.base_datos TO anon, authenticated;
