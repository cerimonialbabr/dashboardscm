(() => {
  "use strict";
  const cfg = window.DASHBOARD_CONFIG || {};
  const $ = id => document.getElementById(id);
  let currentData = null;

  const demo = {
    atualizadoEm: new Date().toISOString(),
    calendario: [
      {titulo:"Formatura semanal",inicio:new Date().toISOString(),fim:new Date(Date.now()+3600000).toISOString(),diaInteiro:false},
      {titulo:"Reunião de coordenação",inicio:new Date(Date.now()+86400000*3).toISOString(),fim:new Date(Date.now()+86400000*3+3600000).toISOString(),diaInteiro:false}
    ],
    jira: [
      {responsavel:"SO Nilton",espaco:"Aniversário do 6º ETA",espacoChave:"AD6E",tarefa:"Confirmar autoridades",prazo:new Date(Date.now()+86400000).toISOString().slice(0,10),prioridade:"Alta",atrasada:false},
      {responsavel:"Cap Ranyer",espaco:"Concerto Aniversário da OSFAB",espacoChave:"CADO",tarefa:"Revisar roteiro",prazo:new Date(Date.now()+86400000*2).toISOString().slice(0,10),prioridade:"Média",atrasada:false}
    ],
    prazos: [
      {responsavel:"SO Nilton",espaco:"Aniversário do 6º ETA",espacoChave:"AD6E",tarefa:"Confirmar autoridades",prazo:new Date(Date.now()+86400000).toISOString().slice(0,10)}
    ],
    viaturas: [
      {inicio:"08:00",fim:"10:00",responsavel:"Cap Ranyer",setor:"SCM",missao:"Apoio ao GABAER",status:"APROVADO"}
    ],
    mensagens: [
      {mensagem:"Reunião da equipe às 15h.",tipo:"IMPORTANTE"},
      {mensagem:"Atualize as tarefas concluídas no Jira.",tipo:"NORMAL"}
    ],
    avisos:[]
  };

  function updateClock(){
    const now = new Date();
    $("clock").textContent = now.toLocaleTimeString("pt-BR");
    $("date").textContent = now.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
  }

  function esc(v){return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
  function parseDate(v){ if(!v) return null; const d=new Date(v+"T12:00:00"); return isNaN(d)?null:d; }
  function shortDate(v){
    const d=parseDate(v); if(!d) return "Sem prazo";
    const today=new Date(); today.setHours(0,0,0,0);
    const diff=Math.round((d-today)/86400000);
    if(diff===0)return "Hoje"; if(diff===1)return "Amanhã"; if(diff<0)return `${Math.abs(diff)}d atrasada`;
    return d.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}).replace(".","");
  }

  function renderCalendar(events){
    const now=new Date(), year=now.getFullYear(), month=now.getMonth();
    $("calendarMonth").textContent=now.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
    const first=new Date(year,month,1), start=new Date(year,month,1-first.getDay());
    const names=["DOM","SEG","TER","QUA","QUI","SEX","SÁB"];
    let html=names.map(n=>`<div class="weekday">${n}</div>`).join("");
    for(let i=0;i<42;i++){
      const d=new Date(start); d.setDate(start.getDate()+i);
      const sameMonth=d.getMonth()===month;
      const today=d.toDateString()===now.toDateString();
      const dateKey=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
      const dayEvents=(events||[]).filter(ev=>{
        const e=new Date(ev.inicio); return !isNaN(e) && [e.getFullYear(),String(e.getMonth()+1).padStart(2,"0"),String(e.getDate()).padStart(2,"0")].join("-")===dateKey;
      }).slice(0,3);
      html+=`<div class="day ${sameMonth?"":"outside"} ${today?"today":""}">
        <div class="day-number">${d.getDate()}</div>
        ${dayEvents.map(ev=>`<span class="event" title="${esc(ev.titulo)}">${esc(ev.titulo)}</span>`).join("")}
      </div>`;
    }
    $("calendar").innerHTML=html;
  }

  function renderJira(items){
    $("jiraCount").textContent=`${(items||[]).length} abertas`;
    $("jiraBody").innerHTML=(items||[]).slice(0,8).map(x=>{
      const p=(x.prioridade||"").toLowerCase();
      const cls=p.includes("alta")||p.includes("highest")||p.includes("high")?"priority-high":p.includes("média")||p.includes("medium")?"priority-medium":"priority-low";
      return `<tr class="${cls} ${x.atrasada?"overdue":""}">
       <td title="${esc(x.responsavel)}">${esc(x.responsavel||"Não atribuído")}</td>
       <td title="${esc(x.espaco)}">${esc(x.espaco||"—")}</td>
       <td title="${esc(x.tarefa)}">${esc(x.tarefa)}</td>
       <td>${esc(shortDate(x.prazo))}</td></tr>`;
    }).join("") || `<tr><td colspan="4"><div class="empty">Nenhuma tarefa aberta.</div></td></tr>`;
  }

  function renderVehicles(items){
    $("vehicleList").innerHTML=(items||[]).slice(0,6).map(x=>`<div class="list-item">
      <div class="when">${esc(x.inicio||"--:--")}–${esc(x.fim||"--:--")}</div>
      <div class="main"><div class="title">${esc(x.missao||x.destino||"Reserva")}</div>
      <div class="sub">${esc(x.responsavel||"")} ${x.setor?"• "+esc(x.setor):""}</div></div>
      <span class="badge">${esc(x.status||"")}</span></div>`).join("") || `<div class="empty">Nenhuma reserva para hoje.</div>`;
  }

  function renderDeadlines(items){
    $("deadlineList").innerHTML=(items||[]).slice(0,10).map(x=>`<div class="list-item">
      <div class="when">${esc(shortDate(x.prazo))}</div>
      <div class="main"><div class="title">${esc(x.tarefa)}</div>
      <div class="sub">${esc(x.responsavel||"Não atribuído")} ${x.espaco?"• "+esc(x.espaco):""}</div></div>
      <span class="badge">${esc(x.prioridade||"")}</span></div>`).join("") || `<div class="empty">Nenhum prazo cadastrado.</div>`;
  }

  function renderMessages(items){
    $("messageList").innerHTML=(items||[]).slice(0,6).map(x=>`<div class="message ${(x.tipo||"").toLowerCase()}">${esc(x.mensagem)}</div>`).join("") || `<div class="empty">Nenhuma mensagem ativa.</div>`;
  }

  function render(data){
    currentData=data;
    renderCalendar(data.calendario);
    renderJira(data.jira);
    renderVehicles(data.viaturas);
    renderDeadlines(data.prazos);
    renderMessages(data.mensagens);
    const warning=(data.avisos||[]).join(" • ");
    $("status").textContent=`Atualizado: ${new Date(data.atualizadoEm||Date.now()).toLocaleTimeString("pt-BR")}${warning?" • "+warning:""}`;
  }

  function loadJsonp(){
    const url=cfg.API_URL||"";
    if(!url || url.includes("SUBSTITUIR_")){
      if(cfg.USE_DEMO_WHEN_UNCONFIGURED) render(demo);
      $("status").textContent="Modo demonstração — configure API_URL em config.js";
      return;
    }
    const callback="dashboardCallback_"+Date.now();
    const script=document.createElement("script");
    const timer=setTimeout(()=>{cleanup(); fallback("Tempo esgotado ao consultar a API.");},20000);
    function cleanup(){clearTimeout(timer);delete window[callback];script.remove();}
    function fallback(msg){if(!currentData && cfg.USE_DEMO_WHEN_UNCONFIGURED)render(demo);$("status").textContent=msg;}
    window[callback]=(payload)=>{cleanup(); if(payload&&payload.ok!==false)render(payload);else fallback(payload&&payload.erro?payload.erro:"Falha na API.");};
    script.onerror=()=>{cleanup();fallback("Não foi possível carregar a API.");};
    script.src=url+(url.includes("?")?"&":"?")+"callback="+callback+"&t="+Date.now();
    document.body.appendChild(script);
  }

  updateClock(); setInterval(updateClock,1000);
  loadJsonp(); setInterval(loadJsonp,Math.max(1,Number(cfg.REFRESH_MINUTES||3))*60000);
})();
