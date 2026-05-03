const SUPA_URL = 'https://dbavetpuukqujhgbiitw.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiYXZldHB1dWtxdWpoZ2JpaXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgxNzgwMiwiZXhwIjoyMDkzMzkzODAyfQ.aeEhx4gvzedIEHNDvuDadrrPEsfCfe3IKTU10ganOxc';
const HEADERS = { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' };

let selectedCIIU = null, ciuuList = [], activeCharts = {};

async function rpc(fn, params={}) {
  const r = await fetch(`${SUPA_URL}/rest/v1/rpc/${fn}`, { method:'POST', headers: HEADERS, body: JSON.stringify(params) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function fmt(n, d=1) {
  if (n==null||isNaN(n)) return '—';
  const abs=Math.abs(n);
  if(abs>=1e12) return (n/1e12).toFixed(d)+'B';
  if(abs>=1e9) return (n/1e9).toFixed(d)+'MM';
  if(abs>=1e6) return (n/1e6).toFixed(d)+'M';
  if(abs>=1e3) return (n/1e3).toFixed(d)+'K';
  return n.toFixed(d);
}
function pct(n,d=1){ return n==null||isNaN(n)?'—':(n*100).toFixed(d)+'%'; }
function color(v){ return v>=70?'#10b981':v>=45?'#f59e0b':'#ef4444'; }
function scoreLabel(v){ return v>=70?'Saludable':v>=45?'Moderado':'En Riesgo'; }

function toggleAllYears(){
  const cbs=document.querySelectorAll('.year-chip input');
  const allChecked=[...cbs].every(c=>c.checked);
  cbs.forEach(c=>c.checked=!allChecked);
}

function clearCiiu(){
  selectedCIIU=null;
  document.getElementById('ciiu-search').value='';
  document.getElementById('ciiu-selected').classList.add('hidden');
  document.getElementById('ciiu-search').closest('.filter-section').querySelector('.search-box').style.display='';
}

function getYears(){
  return [...document.querySelectorAll('.year-chip input:checked')].map(c=>+c.value).sort();
}

function destroyChart(id){ if(activeCharts[id]){ activeCharts[id].destroy(); delete activeCharts[id]; } }
function mkChart(id,cfg){ destroyChart(id); activeCharts[id]=new Chart(document.getElementById(id).getContext('2d'),cfg); return activeCharts[id]; }

async function loadCIIUs(){
  try {
    const data = await rpc('get_ciiu_list');
    ciuuList = data;
    renderDropdown('');
  } catch(e){ console.error('Error cargando CIIUs',e); }
}

function renderDropdown(q){
  const dd=document.getElementById('ciiu-dropdown');
  const qLow=(q||'').toLowerCase();
  const filtered=(!qLow
    ? ciuuList
    : ciuuList.filter(c=>c.ciiu_code && c.ciiu_code.toLowerCase().includes(qLow))
  ).slice(0,80);
  if(!filtered.length){ dd.innerHTML='<div class="ciiu-option" style="color:#94a3b8">Sin resultados para "'+q+'"</div>'; dd.classList.remove('hidden'); return; }
  dd.innerHTML=filtered.map(c=>{
    const code=c.ciiu_code||'';
    const hi=qLow?code.replace(new RegExp('('+qLow.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')', 'gi'),'<mark style="background:rgba(59,130,246,.35);color:#fff;border-radius:2px">$1</mark>'):code;
    return `<div class="ciiu-option" onclick="selectCiiu('${code.replace(/'/g,"\\'")}')"><strong>${hi}</strong><br><span>${c.empresa_count} empresas</span></div>`;
  }).join('');
  dd.classList.remove('hidden');
  dd.style.position='absolute';
  document.getElementById('ciiu-search').parentElement.style.position='relative';
}

function selectCiiu(code){
  selectedCIIU=code;
  document.getElementById('ciiu-search').value='';
  document.getElementById('ciiu-dropdown').classList.add('hidden');
  document.getElementById('ciiu-selected-text').textContent=code.length>50?code.substring(0,50)+'…':code;
  document.getElementById('ciiu-selected').classList.remove('hidden');
}

const ciuuSearchEl=document.getElementById('ciiu-search');
ciuuSearchEl.addEventListener('input',e=>renderDropdown(e.target.value.trim()));
ciuuSearchEl.addEventListener('focus',()=>{ if(!selectedCIIU) renderDropdown(ciuuSearchEl.value.trim()); });
ciuuSearchEl.addEventListener('keydown',e=>{
  const dd=document.getElementById('ciiu-dropdown');
  const items=dd.querySelectorAll('.ciiu-option');
  const active=dd.querySelector('.ciiu-option.hovered');
  if(e.key==='ArrowDown'){ e.preventDefault(); const next=active?active.nextElementSibling:items[0]; if(next){ active&&active.classList.remove('hovered'); next.classList.add('hovered'); next.scrollIntoView({block:'nearest'}); } }
  else if(e.key==='ArrowUp'){ e.preventDefault(); const prev=active?active.previousElementSibling:items[items.length-1]; if(prev){ active&&active.classList.remove('hovered'); prev.classList.add('hovered'); prev.scrollIntoView({block:'nearest'}); } }
  else if(e.key==='Enter'&&active){ active.click(); }
  else if(e.key==='Escape'){ dd.classList.add('hidden'); }
});
document.addEventListener('click',e=>{ if(!e.target.closest('.filter-section')) document.getElementById('ciiu-dropdown').classList.add('hidden'); });

function showTab(name,btn){
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.add('hidden'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+name).classList.remove('hidden');
  btn.classList.add('active');
}

async function runAnalysis(){
  const years=getYears();
  if(!selectedCIIU){ alert('Selecciona un CIIU'); return; }
  if(!years.length){ alert('Selecciona al menos un año'); return; }
  document.getElementById('welcome-state').classList.add('hidden');
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('loading-state').classList.remove('hidden');
  try {
    const [data,ctx]=await Promise.all([
      rpc('get_sector_data',{p_ciiu:selectedCIIU,p_start_year:Math.min(...years),p_end_year:Math.max(...years)}),
      rpc('get_sector_context',{p_year:Math.max(...years)})
    ]);
    renderDashboard(data,ctx,years);
  } catch(e){
    alert('Error consultando datos: '+e.message);
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('welcome-state').classList.remove('hidden');
  }
}

function renderDashboard(data,ctx,years){
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  const lastRow=data[data.length-1]||{};
  const anos=data.map(d=>d.ano);
  document.getElementById('dash-ciiu-badge').textContent=selectedCIIU.substring(0,10);
  document.getElementById('dash-title').textContent=selectedCIIU.length>70?selectedCIIU.substring(0,70)+'…':selectedCIIU;
  document.getElementById('dash-subtitle').textContent=`${anos[0]} – ${anos[anos.length-1]} | ${data.reduce((s,d)=>Math.max(s,d.num_empresas||0),0)} empresas máx.`;
  const _kR=computeRatios(lastRow);
  document.getElementById('dash-kpis').innerHTML=[
    {v:fmt(lastRow.sum_ingresos),l:'Ingresos '+lastRow.ano,c:'#3b82f6'},
    {v:pct(_kR.rentabilidad.margenNeto),l:'Margen Neto',c:(_kR.rentabilidad.margenNeto||0)>0?'#10b981':'#ef4444'},
    {v:pct(_kR.rentabilidad.roa),l:'ROA',c:'#8b5cf6'},
    {v:(_kR.liquidez.razonCorriente!=null?_kR.liquidez.razonCorriente.toFixed(2):'—')+'x',l:'Liquidez',c:'#f59e0b'}
  ].map(k=>`<div class="kpi-card"><div class="kpi-value" style="color:${k.c}">${k.v}</div><div class="kpi-label">${k.l}</div></div>`).join('');
  renderSalud(data,anos);
  renderDupont(data,anos);
  renderProspectiva(data,anos);
  renderAtractivo(data,ctx,lastRow);
}

/* ── SALUD ── */
function calcSaludScore(row){
  const r=computeRatios(row);
  return calcScore(r);
}

function renderSalud(data,anos){
  const last=data[data.length-1]||{};
  const lastR=computeRatios(last);
  const score=calcSaludScore(last);
  document.getElementById('score-salud-val').textContent=score;
  document.getElementById('score-salud-val').style.color=color(score);
  document.getElementById('score-salud-label').textContent=scoreLabel(score);
  document.getElementById('score-salud-label').style.color=color(score);
  const liq=lastR.liquidez.razonCorriente||0;
  const end=lastR.endeudamiento.razonEndeudamiento||0;
  const mar=(lastR.rentabilidad.margenNeto||0)*100;
  const roa=(lastR.rentabilidad.roa||0)*100;
  mkChart('chart-gauge-salud',gaugeChart(score));
  mkChart('chart-radar-salud',{type:'radar',data:{labels:['Liquidez','Solvencia','Margen Neto','ROA','Margen Bruto'],datasets:[{label:'Score',data:[Math.min(liq/2*100,100),Math.max(100-(end*100),0),Math.min(Math.max(mar*4,0),100),Math.min(Math.max(roa*5,0),100),Math.min((lastR.rentabilidad.margenBruto||0)*200,100)],fill:true,backgroundColor:'rgba(59,130,246,0.15)',borderColor:'#3b82f6',pointBackgroundColor:'#3b82f6'}]},options:{...radarOpts}});
  mkChart('chart-salud-trend',{type:'line',data:{labels:anos,datasets:[
    {label:'Liquidez',data:data.map(d=>{const r=computeRatios(d);return+(r.liquidez.razonCorriente||0).toFixed(2);}),borderColor:'#3b82f6',tension:.4,yAxisID:'y'},
    {label:'Endeudamiento',data:data.map(d=>{const r=computeRatios(d);return+(r.endeudamiento.razonEndeudamiento||0).toFixed(2);}),borderColor:'#ef4444',tension:.4,yAxisID:'y'},
    {label:'Margen Neto %',data:data.map(d=>{const r=computeRatios(d);return+((r.rentabilidad.margenNeto||0)*100).toFixed(2);}),borderColor:'#10b981',tension:.4,yAxisID:'y2'}
  ]},options:{...lineOpts,scales:{y:{...axisY,title:{display:true,text:'Ratio',color:'#94a3b8'}},y2:{...axisY,position:'right',title:{display:true,text:'%',color:'#94a3b8'},grid:{display:false}}}}});

  /* ── Indicadores por categoría ── */
  renderIndRows('ind-liquidez',[
    buildIndRows(data,anos,'Razón Corriente','Act. Corrientes / Pas. Corrientes',r=>r.liquidez.razonCorriente,v=>x(v),v=>colorVal(v,1.5,1)),
    buildIndRows(data,anos,'Prueba Ácida','(Act. Corr. - Inventarios) / Pas. Corr.',r=>r.liquidez.pruebaAcida,v=>x(v),v=>colorVal(v,1,0.7))
  ]);
  renderIndRows('ind-actividad',[
    buildIndRows(data,anos,'Rot. Cartera (v)','Ingresos / Cuentas por Cobrar',r=>r.actividad.rotCarteraV,v=>n(v)+' v',v=>colorVal(v,6,3)),
    buildIndRows(data,anos,'Días Cartera','365 / Rot. Cartera',r=>r.actividad.rotCarteraD,v=>n(v)+' d',v=>v==null?'#94a3b8':v<=60?'#10b981':v<=90?'#f59e0b':'#ef4444'),
    buildIndRows(data,anos,'Rot. Inventario (v)','Costo Ventas / Inventarios',r=>r.actividad.rotInventV,v=>n(v)+' v',v=>colorVal(v,6,3)),
    buildIndRows(data,anos,'Días Inventario','365 / Rot. Inventario',r=>r.actividad.rotInventD,v=>n(v)+' d',v=>v==null?'#94a3b8':v<=60?'#10b981':v<=90?'#f59e0b':'#ef4444'),
    buildIndRows(data,anos,'Rot. Pago (v)','Costo Ventas / Cuentas por Pagar',r=>r.actividad.rotPagoV,v=>n(v)+' v',null),
    buildIndRows(data,anos,'Días Pago','365 / Rot. Pago',r=>r.actividad.rotPagoD,v=>n(v)+' d',null),
    buildIndRows(data,anos,'Ciclo de Caja','Días Inv. + Días Cartera - Días Pago',r=>r.actividad.cicloCaja,v=>n(v)+' d',v=>v==null?'#94a3b8':v<=30?'#10b981':v<=60?'#f59e0b':'#ef4444'),
    buildIndRows(data,anos,'Rot. Activos','Ingresos / Activos Totales',r=>r.actividad.rotActivos,v=>x(v),v=>colorVal(v,1,0.5)),
    buildIndRows(data,anos,'Capital de Trabajo','Act. Corrientes - Pas. Corrientes',r=>r.actividad.capitalTrabajo,v=>M(v),v=>v==null?'#94a3b8':v>=0?'#10b981':'#ef4444')
  ]);
  renderIndRows('ind-rentabilidad',[
    buildIndRows(data,anos,'ROE','Ganancia / Patrimonio',r=>r.rentabilidad.roe,v=>p(v),v=>colorVal(v,0.1,0.05)),
    buildIndRows(data,anos,'ROA','Ganancia / Activos',r=>r.rentabilidad.roa,v=>p(v),v=>colorVal(v,0.05,0.02)),
    buildIndRows(data,anos,'Margen Bruto','Ganancia Bruta / Ingresos',r=>r.rentabilidad.margenBruto,v=>p(v),v=>colorVal(v,0.3,0.15)),
    buildIndRows(data,anos,'Margen EBIT','Ganancia Operacional / Ingresos',r=>r.rentabilidad.margenEBIT,v=>p(v),v=>colorVal(v,0.1,0.05)),
    buildIndRows(data,anos,'Margen Neto','Ganancia Neta / Ingresos',r=>r.rentabilidad.margenNeto,v=>p(v),v=>colorVal(v,0.1,0.05))
  ]);
  renderIndRows('ind-endeudamiento',[
    buildIndRows(data,anos,'Razón Endeudamiento','Pasivos / Activos',r=>r.endeudamiento.razonEndeudamiento,v=>p(v),v=>v==null?'#94a3b8':v<=0.5?'#10b981':v<=0.7?'#f59e0b':'#ef4444'),
    buildIndRows(data,anos,'Estructura Capital','Pasivos / Patrimonio',r=>r.endeudamiento.estructuraCapital,v=>x(v),v=>v==null?'#94a3b8':v<=1?'#10b981':v<=2?'#f59e0b':'#ef4444'),
    buildIndRows(data,anos,'Cobertura Intereses','EBIT / Costos Financieros',r=>r.endeudamiento.coberturaIntereses,v=>x(v),v=>colorVal(v,3,1.5)),
    buildIndRows(data,anos,'Apalancamiento','Patrimonio / Activos',r=>r.endeudamiento.apalancamiento,v=>p(v),v=>colorVal(v,0.4,0.3))
  ]);

  document.getElementById('table-salud').innerHTML=buildTable(
    ['Año','Empresas','Razón Corr.','Prueba Ácida','Endeudamiento','Margen Neto','ROA','ROE'],
    data.map(d=>{
      const r=computeRatios(d);
      return[d.ano,d.num_empresas,x(r.liquidez.razonCorriente),x(r.liquidez.pruebaAcida),p(r.endeudamiento.razonEndeudamiento),p(r.rentabilidad.margenNeto),p(r.rentabilidad.roa),p(r.rentabilidad.roe)];
    })
  );
}

/* ── DUPONT ── */
function renderDupont(data,anos){
  const last=data[data.length-1]||{};
  const dp=computeRatios(last).dupont;
  const mn=dp.margenNeto||0, ra=dp.rotActivos||0, em=dp.multiplicadorCapital||0, roe=dp.roeDupont||0;
  document.getElementById('dupont-formula').innerHTML=`
    <div class="dupont-box"><div class="dupont-box-label">ROE</div><div class="dupont-box-value" style="color:#3b82f6">${pct(roe)}</div><div class="dupont-box-name">Retorno s/Patrimonio</div></div>
    <div class="dupont-op">=</div>
    <div class="dupont-box"><div class="dupont-box-label">Margen Neto</div><div class="dupont-box-value" style="color:#10b981">${pct(mn)}</div><div class="dupont-box-name">Rentabilidad</div></div>
    <div class="dupont-op">×</div>
    <div class="dupont-box"><div class="dupont-box-label">Rot. Activos</div><div class="dupont-box-value" style="color:#f59e0b">${ra.toFixed(2)}x</div><div class="dupont-box-name">Eficiencia</div></div>
    <div class="dupont-op">×</div>
    <div class="dupont-box"><div class="dupont-box-label">Multiplicador</div><div class="dupont-box-value" style="color:#8b5cf6">${em.toFixed(2)}x</div><div class="dupont-box-name">Apalancamiento</div></div>`;
  const raArr=data.map(d=>+(computeRatios(d).dupont.rotActivos||0).toFixed(3));
  const emArr=data.map(d=>+(computeRatios(d).dupont.multiplicadorCapital||0).toFixed(3));
  const mnArr=data.map(d=>+((computeRatios(d).dupont.margenNeto||0)*100).toFixed(2));
  const roeArr=data.map(d=>+((computeRatios(d).rentabilidad.roe||0)*100).toFixed(2));
  const roeDpArr=data.map(d=>+((computeRatios(d).dupont.roeDupont||0)*100).toFixed(2));
  mkChart('chart-dupont-components',{type:'bar',data:{labels:anos,datasets:[{label:'Margen Neto %',data:mnArr,backgroundColor:'rgba(16,185,129,.7)',yAxisID:'y'},{label:'Rot. Activos x',data:raArr,backgroundColor:'rgba(245,158,11,.7)',yAxisID:'y2'},{label:'Multiplicador x',data:emArr,backgroundColor:'rgba(139,92,246,.7)',yAxisID:'y2'}]},options:{...barOpts,scales:{y:{...axisY,title:{display:true,text:'%',color:'#94a3b8'}},y2:{...axisY,position:'right',grid:{display:false},title:{display:true,text:'x',color:'#94a3b8'}}}}});
  mkChart('chart-roe-trend',{type:'line',data:{labels:anos,datasets:[{label:'ROE Directo %',data:roeArr,borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,0.1)',fill:true,tension:.4},{label:'ROE DuPont %',data:roeDpArr,borderColor:'#8b5cf6',borderDash:[4,4],tension:.4}]},options:{...lineOpts,scales:{y:{...axisY}}}});
  document.getElementById('table-dupont').innerHTML=buildTable(
    ['Año','Margen Neto','Rot. Activos','Multiplicador','ROE DuPont','ROE Directo'],
    data.map(d=>{
      const r=computeRatios(d);
      return[d.ano,pct(r.dupont.margenNeto),r.dupont.rotActivos.toFixed(2)+'x',r.dupont.multiplicadorCapital.toFixed(2)+'x',pct(r.dupont.roeDupont),pct(r.rentabilidad.roe)];
    })
  );
}

/* ── PROSPECTIVA ── */
function cagr(first,last,n){ if(!first||first<=0||!last||n<=0) return null; return Math.pow(last/first,1/n)-1; }

function renderProspectiva(data,anos){
  if(data.length<2){ document.getElementById('tab-prospectiva').innerHTML='<div class="card"><p style="color:#94a3b8;text-align:center;padding:40px">Se necesitan al menos 2 años para calcular prospectiva.</p></div>'; return; }
  const n=data.length-1;
  const cagrIng=cagr(data[0].sum_ingresos,data[n].sum_ingresos,n);
  const cagrAct=cagr(data[0].sum_activos,data[n].sum_activos,n);
  const cagrGan=cagr(Math.abs(data[0].sum_ganancia||0.01),Math.abs(data[n].sum_ganancia||0.01),n)*(data[n].sum_ganancia>=0?1:-1);
  document.getElementById('cagr-cards').innerHTML=[
    {icon:'💰',v:cagrIng,l:'CAGR Ingresos'},{icon:'🏗️',v:cagrAct,l:'CAGR Activos'},{icon:'📈',v:cagrGan,l:'CAGR Ganancia'}
  ].map(c=>`<div class="cagr-card"><div class="cagr-icon">${c.icon}</div><div class="cagr-value" style="color:${c.v==null?'#94a3b8':c.v>=0?'#10b981':'#ef4444'}">${c.v==null?'—':(c.v*100).toFixed(1)+'%'}</div><div class="cagr-label">${c.l}</div></div>`).join('');
  mkChart('chart-ingresos-trend',{type:'line',data:{labels:anos,datasets:[{label:'Ingresos',data:data.map(d=>d.sum_ingresos||0),borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,0.1)',fill:true,tension:.4}]},options:{...lineOpts,plugins:{...lineOpts.plugins,tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}},scales:{y:{...axisY,ticks:{callback:v=>fmt(v)}}}}});
  mkChart('chart-margen-trend',{type:'line',data:{labels:anos,datasets:[{label:'Margen Neto %',data:data.map(d=>+((d.avg_margen_neto||0)*100).toFixed(2)),borderColor:'#10b981',backgroundColor:'rgba(16,185,129,0.1)',fill:true,tension:.4},{label:'Margen Bruto %',data:data.map(d=>d.sum_ingresos?+((d.sum_ganancia_bruta/d.sum_ingresos)*100).toFixed(2):0),borderColor:'#f59e0b',tension:.4}]},options:{...lineOpts,scales:{y:{...axisY,ticks:{callback:v=>v+'%'}}}}});
  const sIng=cagrIng==null?50:Math.min(Math.max(50+cagrIng*200,0),100);
  const sAct=cagrAct==null?50:Math.min(Math.max(50+cagrAct*150,0),100);
  const sMar=(()=>{const mar=data.map(d=>d.avg_margen_neto||0);const trend=mar[mar.length-1]-mar[0];return Math.min(Math.max(50+trend*300,0),100);})();
  const total=Math.round(sIng*0.4+sAct*0.3+sMar*0.3);
  document.getElementById('prospectiva-score-wrap').innerHTML=[
    {n:'Crecimiento Ingresos',s:sIng,c:'#3b82f6'},{n:'Expansión de Activos',s:sAct,c:'#8b5cf6'},{n:'Mejora de Márgenes',s:sMar,c:'#10b981'}
  ].map(d=>`<div class="pros-dim"><div class="pros-dim-name">${d.n}</div><div class="pros-bar-track"><div class="pros-bar-fill" style="width:${d.s}%;background:${d.c}"></div></div><div class="pros-dim-score" style="color:${d.c}">${Math.round(d.s)}/100</div></div>`).join('')
  +`<div class="pros-dim" style="grid-column:1/-1;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3)"><div class="pros-dim-name">Score de Prospectiva Total</div><div class="pros-bar-track"><div class="pros-bar-fill" style="width:${total}%;background:linear-gradient(90deg,#3b82f6,#8b5cf6)"></div></div><div class="pros-dim-score" style="color:#3b82f6;font-size:1.5rem">${total}/100 — ${scoreLabel(total)}</div></div>`;
}

/* ── ATRACTIVO ── */
function renderAtractivo(data,ctx,lastRow){
  const n=data.length-1;
  const cagrIng=cagr(data[0]?.sum_ingresos,data[n]?.sum_ingresos,n)||0;
  const _aR=computeRatios(lastRow);
  const roa=(_aR.rentabilidad.roa||0), mar=(_aR.rentabilidad.margenNeto||0), emp=lastRow.num_empresas||0;
  const sTam=Math.min(Math.max(Math.log10(Math.abs(lastRow.sum_ingresos||1)+1)/12*100,0),100);
  const sCre=Math.min(Math.max(50+cagrIng*200,0),100);
  const sRent=Math.min(Math.max(50+roa*300,0),100);
  const sDim=Math.min(Math.max(Math.log10(emp+1)/3*100,0),100);
  const total=Math.round(sTam*0.25+sCre*0.3+sRent*0.3+sDim*0.15);
  document.getElementById('score-atractivo-val').textContent=total;
  document.getElementById('score-atractivo-val').style.color=color(total);
  document.getElementById('score-atractivo-label').textContent=scoreLabel(total);
  document.getElementById('score-atractivo-label').style.color=color(total);
  mkChart('chart-gauge-atractivo',gaugeChart(total,'#8b5cf6'));
  if(ctx&&ctx.length){
    const topCtx=ctx.slice(0,20);
    const isTarget=topCtx.findIndex(c=>c.ciiu_code===selectedCIIU);
    const colors=topCtx.map((_,i)=>i===isTarget?'rgba(139,92,246,0.9)':'rgba(59,130,246,0.5)');
    mkChart('chart-sector-comparison',{type:'bar',data:{labels:topCtx.map(c=>c.ciiu_code.substring(0,20)),datasets:[{label:'Ingresos Totales',data:topCtx.map(c=>c.total_ingresos||0),backgroundColor:colors}]},options:{...barOpts,indexAxis:'y',plugins:{...barOpts.plugins,tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}},scales:{x:{...axisY,ticks:{callback:v=>fmt(v)}},y:{...axisY,ticks:{font:{size:9}}}}}});
  }
  document.getElementById('atractivo-dimensions').innerHTML=`<div class="atractivo-dimensions">${[
    {n:'🏗️ Tamaño del Sector',s:sTam,c:'#3b82f6',v:fmt(lastRow.sum_ingresos)},
    {n:'📈 Crecimiento (CAGR)',s:sCre,c:'#10b981',v:(cagrIng*100).toFixed(1)+'%'},
    {n:'💰 Rentabilidad (ROA)',s:sRent,c:'#8b5cf6',v:pct(roa)},
    {n:'🏢 Densidad Empresas',s:sDim,c:'#f59e0b',v:emp+' emp.'}
  ].map(d=>`<div class="atr-dim"><div class="atr-dim-name">${d.n}</div><div class="atr-dim-bar"><div class="atr-dim-fill" style="width:${d.s}%;background:${d.c}"></div></div><div class="atr-dim-val" style="color:${d.c}">${d.v} · ${Math.round(d.s)}/100</div></div>`).join('')}</div>`;
}

/* ── CHART HELPERS ── */
Chart.defaults.color='#94a3b8'; Chart.defaults.font.family='Inter';
const axisY={grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#94a3b8',font:{size:10}}};
const lineOpts={responsive:true,plugins:{legend:{labels:{color:'#94a3b8',boxWidth:12,font:{size:10}}},tooltip:{mode:'index',intersect:false}},scales:{y:{...axisY}}};
const barOpts={responsive:true,plugins:{legend:{labels:{color:'#94a3b8',boxWidth:12,font:{size:10}}},tooltip:{mode:'index',intersect:false}},scales:{x:{...axisY},y:{...axisY}}};
const radarOpts={responsive:true,plugins:{legend:{display:false}},scales:{r:{grid:{color:'rgba(255,255,255,0.08)'},ticks:{color:'#94a3b8',backdropColor:'transparent',font:{size:9}},pointLabels:{color:'#94a3b8',font:{size:10}},min:0,max:100}}};

function gaugeChart(score,col='#3b82f6'){
  const rem=100-score, sc=color(score);
  return {type:'doughnut',data:{datasets:[{data:[score,rem],backgroundColor:[sc,'rgba(255,255,255,0.06)'],borderWidth:0,circumference:270,rotation:225}]},options:{responsive:false,cutout:'78%',plugins:{legend:{display:false},tooltip:{enabled:false}}}};
}

function buildTable(headers,rows){
  return `<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

// Init
loadCIIUs();
