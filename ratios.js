// ratios.js — Cálculo correcto de todos los indicadores financieros
function div(a,b){return(!b||b===0)?null:a/b;}
function n(v,d=2){return v==null||isNaN(v)?'—':Number(v).toFixed(d);}
function p(v,d=1){return v==null||isNaN(v)?'—':(v*100).toFixed(d)+'%';}
function x(v,d=2){return v==null||isNaN(v)?'—':Number(v).toFixed(d)+'x';}
function M(v){if(v==null||isNaN(v))return'—';const a=Math.abs(v);if(a>=1e12)return(v/1e12).toFixed(1)+'B';if(a>=1e9)return(v/1e9).toFixed(1)+'MM';if(a>=1e6)return(v/1e6).toFixed(1)+'M';if(a>=1e3)return(v/1e3).toFixed(1)+'K';return Number(v).toFixed(0);}
function colorVal(v,good,warn){if(v==null)return'#94a3b8';return v>=good?'#10b981':v>=warn?'#f59e0b':'#ef4444';}

function computeRatios(d){
  const s=(v)=>v||0;
  const ingresos=s(d.sum_ingresos);
  const ganancia=s(d.sum_ganancia);
  const activos=s(d.sum_activos);
  const pasivos=s(d.sum_pasivos);
  const patrimonio=s(d.sum_patrimonio);
  const actCorr=s(d.sum_act_corrientes);
  const pasCorr=s(d.sum_pas_corrientes);
  const costoVentas=s(d.sum_costo_ventas);
  const ganBruta=s(d.sum_ganancia_bruta);
  const gasAdmin=s(d.sum_gastos_admin);
  const gasVentas=s(d.sum_gastos_ventas);
  const costFin=s(d.sum_costos_financieros);
  const inventarios=s(d.sum_inventarios);
  const cuentasCobrar=s(d.sum_cuentas_cobrar);
  const cuentasPagar=s(d.sum_cuentas_pagar);

  // Ganancia operacional: campo directo si existe, si no se deriva
  const ganOper = d.sum_ganancia_operacional != null
    ? s(d.sum_ganancia_operacional)
    : (ganBruta - gasAdmin - gasVentas);

  // LIQUIDEZ
  const razonCorriente  = div(actCorr, pasCorr);
  const pruebaAcida     = div(actCorr - inventarios, pasCorr);

  // ACTIVIDAD — rotaciones usan totales del sector
  const rotCarteraV = div(ingresos, cuentasCobrar);
  const rotInventV  = div(costoVentas, inventarios);
  const rotPagoV    = div(costoVentas, cuentasPagar);
  const rotCarteraD = rotCarteraV ? div(365, rotCarteraV) : null;
  const rotInventD  = rotInventV  ? div(365, rotInventV)  : null;
  const rotPagoD    = rotPagoV    ? div(365, rotPagoV)    : null;
  const cicloCaja   = (rotInventD!=null&&rotCarteraD!=null&&rotPagoD!=null)
    ? rotInventD + rotCarteraD - rotPagoD : null;
  const rotActivos  = div(ingresos, activos);
  const capitalTrabajo = actCorr - pasCorr;

  // RENTABILIDAD — todos desde totales del sector
  const roe         = div(ganancia, patrimonio);
  const roa         = div(ganancia, activos);
  // Margen Bruto: derivado desde totales (más robusto que sum_ganancia_bruta con NULLs)
  const margenBruto = ingresos ? div(ingresos - costoVentas, ingresos) : null;
  const margenEBIT  = div(ganOper, ingresos);
  const margenNeto  = div(ganancia, ingresos);

  // ENDEUDAMIENTO
  const razonEndeudamiento  = div(pasivos, activos);
  const estructuraCapital   = div(pasivos, patrimonio);
  const coberturaIntereses  = costFin ? div(ganOper, costFin) : null;
  const apalancamiento      = div(patrimonio, activos);

  // DUPONT
  const multiplicadorCapital = div(activos, patrimonio);
  const roeDupont = (margenNeto!=null&&rotActivos!=null&&multiplicadorCapital!=null)
    ? margenNeto * rotActivos * multiplicadorCapital : null;

  return {
    liquidez:      { razonCorriente, pruebaAcida },
    actividad:     { rotCarteraV, rotInventV, rotPagoV, rotCarteraD, rotInventD, rotPagoD, cicloCaja, rotActivos, capitalTrabajo },
    rentabilidad:  { roe, roa, margenBruto, margenEBIT, margenNeto },
    endeudamiento: { razonEndeudamiento, estructuraCapital, coberturaIntereses, apalancamiento },
    dupont:        { margenNeto, rotActivos, multiplicadorCapital, roeDupont }
  };
}

function calcScore(r){
  const liq=r.liquidez.razonCorriente||0;
  const end=r.endeudamiento.razonEndeudamiento||0;
  const mar=r.rentabilidad.margenNeto||0;
  const roa=r.rentabilidad.roa||0;
  const sL=liq>=2?100:liq>=1.5?80:liq>=1?55:liq>=0.5?30:10;
  const sE=end<=0.3?100:end<=0.5?80:end<=0.7?55:end<=0.85?30:10;
  const sM=mar>=0.15?100:mar>=0.1?80:mar>=0.05?60:mar>=0?35:0;
  const sR=roa>=0.1?100:roa>=0.05?80:roa>=0.02?55:roa>=0?30:0;
  return Math.round(sL*0.25+sE*0.25+sM*0.3+sR*0.2);
}

function renderIndRows(containerId, rows){
  document.getElementById(containerId).innerHTML=rows.map(r=>`
    <div class="ind-row">
      <div class="ind-row-info"><div class="ind-row-name">${r.name}</div><div class="ind-row-desc">${r.desc}</div></div>
      <div class="ind-row-values">${r.vals.map(v=>`<div class="ind-year-val"><div class="ind-year-label">${v.year}</div><div class="ind-year-num" style="color:${v.color}">${v.val}</div></div>`).join('')}</div>
    </div>`).join('');
}

function buildIndRows(data, anos, name, desc, extract, format, goodFn){
  const vals=data.map(d=>{
    const ratios=computeRatios(d);
    const v=extract(ratios);
    const col=goodFn?goodFn(v):'#f1f5f9';
    return{year:d.ano,val:format(v),color:col};
  });
  return{name,desc,vals};
}
