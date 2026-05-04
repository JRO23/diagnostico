-- ACTUALIZAR get_sector_data con los campos correctos para todos los indicadores
-- Ejecutar en Supabase → SQL Editor

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
  sum_ganancia_operacional numeric,
  sum_ganancia_bruta       numeric,
  sum_ganancia_antes_imp   numeric,
  sum_activos              numeric,
  sum_act_corrientes       numeric,
  sum_pasivos              numeric,
  sum_pas_corrientes       numeric,
  sum_patrimonio           numeric,
  sum_costo_ventas         numeric,
  sum_gastos_admin         numeric,
  sum_gastos_ventas        numeric,
  sum_costos_financieros   numeric,
  sum_cuentas_cobrar       numeric,
  sum_inventarios          numeric,
  sum_cuentas_pagar        numeric
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT
    ano,
    COUNT(DISTINCT nit)                                          AS num_empresas,
    SUM(ingresos_de_actividades_ordinarias)                      AS sum_ingresos,
    SUM(ganancia_perdida)                                        AS sum_ganancia,
    SUM(ganancia_perdida_por_actividades_de_operacion)           AS sum_ganancia_operacional,
    SUM(ganancia_bruta)                                          AS sum_ganancia_bruta,
    SUM(ganancia_perdida_antes_de_impuestos)                     AS sum_ganancia_antes_imp,
    SUM(total_de_activos)                                        AS sum_activos,
    SUM(activos_corrientes_totales)                              AS sum_act_corrientes,
    SUM(total_pasivos)                                           AS sum_pasivos,
    SUM(pasivos_corrientes_totales)                              AS sum_pas_corrientes,
    SUM(patrimonio_total)                                        AS sum_patrimonio,
    SUM(costo_de_ventas)                                         AS sum_costo_ventas,
    SUM(gastos_de_administracion)                                AS sum_gastos_admin,
    SUM(gastos_de_ventas)                                        AS sum_gastos_ventas,
    SUM(costos_financieros)                                      AS sum_costos_financieros,
    SUM(cuentas_comerciales_por_cobrar_corrientes)               AS sum_cuentas_cobrar,
    SUM(inventarios_corrientes)                                  AS sum_inventarios,
    SUM(cuentas_por_pagar_comerciales_corrientes)                AS sum_cuentas_pagar
  FROM base_datos
  WHERE ciiu = p_ciiu AND ano BETWEEN p_start_year AND p_end_year
  GROUP BY ano
  ORDER BY ano;
$$;

GRANT EXECUTE ON FUNCTION get_sector_data(text,int,int) TO anon, authenticated;
SELECT 'get_sector_data actualizada OK' AS resultado;
