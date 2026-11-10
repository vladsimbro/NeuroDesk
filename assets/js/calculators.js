import {SCALE_DEFS,calculate} from './calculator-models.js';
import {CALCULATOR_GUIDES} from './calculator-guides.js';
import {renderCalculatorFields,completionState,missingField,displayScoreProgress} from './calculator-workspace.js';

const items=document.getElementById('calc-items');
const details=document.getElementById('calc-detail');
const query=document.getElementById('calc-search');
const filters=document.getElementById('calc-filters');
const count=document.getElementById('calc-count');
let category='Все',active=null;
const escapeHtml=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const groups=['Все','Риск','Инсульт','Сознание','Мышцы','Боль','Общие'];
filters.innerHTML=groups.map(g=>'<button class="calc-filter'+(g===category?' active':'')+'" type="button" data-group="'+g+'" aria-pressed="'+(g===category)+'">'+g+'</button>').join('');
function list(){
 const term=query.value.toLocaleLowerCase('ru-RU').trim().replace(/ё/g,'е');
 const match=SCALE_DEFS.filter(s=>(category==='Все'||s.group===category)&&[s.title,s.subtitle,s.group,s.detail].join(' ').toLocaleLowerCase('ru-RU').replace(/ё/g,'е').includes(term));
 count.textContent='Найдено инструментов: '+match.length+' из '+SCALE_DEFS.length;
 items.innerHTML=match.map((s,i)=>'<button type="button" data-tool="'+s.id+'" aria-pressed="'+(active===s.id)+'" class="calc-card'+(active===s.id?' active':'')+'"><span class="calc-card-number">'+String(i+1).padStart(2,'0')+'</span><span class="calc-card-info"><span class="calc-card-group">'+escapeHtml(s.group)+'</span><strong>'+escapeHtml(s.title)+'</strong><small>'+escapeHtml(s.subtitle)+'</small></span><span class="calc-card-chevron" aria-hidden="true">↗</span></button>').join('')||'<p class="calc-empty">Ничего не найдено. Попробуй другой запрос.</p>';
}
function guideMarkup(tool){
 const guide=CALCULATOR_GUIDES[tool.id];
 if(!guide)return '';
 return '<details class="calc-help-panel"'+(['gcs','fourat','rass','mrc'].includes(tool.id)?' open':'')+'><summary><span>Порядок оценки и важные критерии</span><span class="calc-help-marker" aria-hidden="true">+</span></summary><ol>'+guide.steps.map(step=>'<li>'+escapeHtml(step)+'</li>').join('')+'</ol></details>';
}
function resultMarkup(tool,outcome){
 const rows=outcome.breakdown.map(row=>'<div class="calc-breakdown-row"><dt>'+escapeHtml(row.label)+'</dt><dd>'+escapeHtml(row.value)+'</dd></div>').join('');
 // Separate a numeric metric from its physical unit, instead of flowing both into a heading.
 // Keeping them in distinct blocks prevents Safari text enlargement from collapsing the report.
 const measure=/^(\d+(?:[.,]\d+)?)\s*(мм рт\. ст\.|кг\/м²|%)$/.exec(outcome.value);
 const metric=measure?measure[1].replace('.',','):outcome.value;
 const unit=measure?'<span class="calc-result-unit">'+escapeHtml(measure[2])+'</span>':'';
 const longValue=metric.length>12?' calc-result-metric--long':'';
 return '<header class="calc-result-main"><span class="calc-result-eyebrow">РАССЧИТАННЫЙ ПОКАЗАТЕЛЬ</span><strong class="calc-result-metric'+longValue+' calc-result-value">'+escapeHtml(metric)+'</strong>'+unit+'<span class="calc-result-label">'+escapeHtml(outcome.label)+'</span></header>'+
 displayScoreProgress(tool,outcome,escapeHtml)+
 '<section class="calc-result-section"><h3>Что означает результат</h3><p class="calc-result-summary">'+escapeHtml(outcome.summary)+'</p></section>'+
 '<section class="calc-result-section"><h3>Как получено</h3><dl class="calc-breakdown">'+rows+'</dl></section>'+
 '<section class="calc-result-section"><h3>Как интерпретировать</h3><p>'+escapeHtml(outcome.interpretation)+'</p></section>'+
 '<section class="calc-result-caution"><h3>Важные ограничения</h3><p>'+escapeHtml(outcome.note)+'</p></section>'+
 '<button type="button" class="calc-copy" id="calc-copy">Скопировать результат и расшифровку</button>';
}
function showError(result,message,form,tool){
 result.classList.remove('has-result');
 result.classList.add('is-error');
 result.innerHTML='<strong class="calc-error-title">Результат не рассчитан</strong><p>'+escapeHtml(message)+'</p>';
 if(!form||!tool)return;
 const missing=missingField(form,tool);
 if(!missing)return;
 const candidate=form.querySelector('[name="'+missing.key+'"]');
 if(candidate){
  candidate.setAttribute('aria-invalid','true');
  candidate.closest('.calc-field')?.classList.add('calc-field--invalid');
  candidate.focus({preventScroll:true});
  if(window.matchMedia('(max-width:900px)').matches)candidate.closest('.calc-field')?.scrollIntoView({behavior:'smooth',block:'center'});
 }
}
function openTool(id,focus=true){
 const tool=SCALE_DEFS.find(s=>s.id===id);
 if(!tool)return;
 active=id;list();
 details.innerHTML='<div class="calc-tool-header"><span class="calc-tool-category">'+escapeHtml(tool.group)+'</span><h2>'+escapeHtml(tool.title)+'</h2><p>'+escapeHtml(tool.detail)+'</p></div>'+
  guideMarkup(tool)+
  '<form id="calc-form" novalidate aria-label="Параметры для '+escapeHtml(tool.title)+'"><div class="calc-form-progress" id="calc-form-progress" role="status" aria-live="polite"><span>Заполнено <strong id="calc-progress-label">0 из '+tool.fields.length+'</strong> полей</span><progress id="calc-completion" max="'+tool.fields.length+'" value="0" aria-label="Прогресс заполнения"></progress></div>'+renderCalculatorFields(tool,CALCULATOR_GUIDES[tool.id],escapeHtml)+'<div class="calc-form-actions"><button type="submit" class="calc-primary-button">Рассчитать результат</button><button type="reset" class="calc-secondary-button">Очистить форму</button></div></form>'+
  '<section class="calc-report"><h3 class="calc-report-title">Результат и расшифровка</h3><div class="calc-result" id="calc-result" role="status" aria-live="polite"><span>Заполни параметры и нажми «Рассчитать результат».</span></div></section>'+
  '<div class="calc-tool-notice"><strong>Границы применения</strong><p>'+escapeHtml(tool.note)+'</p></div>'+
  '<div class="calc-tool-sources"><strong>Первоисточники и методика</strong>'+tool.sources.map(s=>'<a href="'+escapeHtml(s[1])+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(s[0])+' ↗</a>').join('')+'</div>';
 const form=document.getElementById('calc-form'),result=document.getElementById('calc-result');
 const updateProgress=()=>{
  const {complete,total}=completionState(form,tool);
  document.getElementById('calc-progress-label').textContent=complete+' из '+total;
  document.getElementById('calc-completion').value=complete;
  const box=document.getElementById('calc-form-progress');
  box.classList.toggle('is-complete',complete===total);
 };
 const pending=()=>{result.classList.remove('has-result');result.classList.remove('is-error');result.innerHTML='<span>Параметры изменены. Нажми «Рассчитать результат», чтобы обновить интерпретацию.</span>';};
 const inputChanged=event=>{
  event.target.removeAttribute('aria-invalid');
  const field=event.target.closest('.calc-field');
  field?.classList.remove('calc-field--invalid');
  pending();
  updateProgress();
 };
 form.addEventListener('input',inputChanged);
 form.addEventListener('change',inputChanged);
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const data=Object.fromEntries([...new FormData(form).entries()].map(([key,value])=>[key,typeof value==='string'?value.trim().replace(',','.'):value]));
  try{
   const outcome=calculate(id,data);
   result.classList.remove('is-error');
   result.classList.add('has-result');
   result.innerHTML=resultMarkup(tool,outcome);
   document.getElementById('calc-copy').addEventListener('click',()=>copyResult(tool,outcome));
   if(window.matchMedia('(max-width:900px)').matches)result.scrollIntoView({behavior:'smooth',block:'nearest'});
  }catch(error){showError(result,error.message,form,tool);}
 });
 form.addEventListener('reset',()=>{queueMicrotask(()=>{form.querySelectorAll('[aria-invalid]').forEach(n=>n.removeAttribute('aria-invalid'));form.querySelectorAll('.calc-field--invalid').forEach(n=>n.classList.remove('calc-field--invalid'));result.classList.remove('has-result');result.classList.remove('is-error');result.innerHTML='<span>Заполни параметры и нажми «Рассчитать результат».</span>';updateProgress();});});
 updateProgress();
 const url=new URL(location.href);url.searchParams.set('tool',id);history.replaceState(null,'',url.pathname+url.search+url.hash);
 if(focus){
  if(window.matchMedia('(max-width:900px)').matches)details.scrollIntoView({behavior:'smooth',block:'start'});
  else{const heading=details.querySelector('h2');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});}
 }
}
async function copyResult(tool,outcome){
 const breakdown=outcome.breakdown.map(row=>row.label+': '+row.value).join('\n');
 const message=tool.title+'\n\nРезультат: '+outcome.value+'\n'+outcome.label+'\n\nЧто означает: '+outcome.summary+'\n\nСоставляющие:\n'+breakdown+
 '\n\nИнтерпретация: '+outcome.interpretation+'\n\nОграничения: '+outcome.note+'\n\nNeuroDesk — справочный расчёт; не заменяет клиническую оценку.';
 const button=document.getElementById('calc-copy');
 try{
  await navigator.clipboard.writeText(message);
  if(button)button.textContent='Скопировано';
 }catch(error){
  if(button)button.textContent='Копирование недоступно в этом браузере';
 }
}
items.addEventListener('click',event=>{const button=event.target.closest('[data-tool]');if(button)openTool(button.dataset.tool);});
filters.addEventListener('click',event=>{
 const button=event.target.closest('[data-group]');if(!button)return;
 category=button.dataset.group;
 filters.querySelectorAll('[data-group]').forEach(node=>{node.classList.toggle('active',node===button);node.setAttribute('aria-pressed',String(node===button));});
 list();
});
query.addEventListener('input',list);
document.getElementById('calc-clear-search').addEventListener('click',()=>{query.value='';list();query.focus();});

const mobile=document.getElementById('mobile-menu'),sidebar=document.getElementById('sidebar');
const closeSidebar=()=>{sidebar.classList.remove('open');document.body.classList.remove('sidebar-open');mobile.setAttribute('aria-expanded','false');};
mobile.addEventListener('click',()=>{
 const open=!sidebar.classList.contains('open');sidebar.classList.toggle('open',open);document.body.classList.toggle('sidebar-open',open);mobile.setAttribute('aria-expanded',String(open));
});
document.getElementById('sidebar-close')?.addEventListener('click',closeSidebar);
document.addEventListener('click',e=>{if(document.body.classList.contains('sidebar-open')&&!sidebar.contains(e.target)&&!e.target.closest('#mobile-menu'))closeSidebar();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSidebar();});
document.querySelectorAll('[data-icon]').forEach(node=>{
 const paths={menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',close:'<path d="m18 6-12 12M6 6l12 12"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',book:'<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5z"/><path d="M4 4.5v18M8 6h8M8 10h7"/>',activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>'};
 node.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[node.dataset.icon]||paths.activity)+'</svg>';
});
list();
const chosen=new URLSearchParams(location.search).get('tool');
openTool(SCALE_DEFS.some(t=>t.id===chosen)?chosen:'score2',false);
