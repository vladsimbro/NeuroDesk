import {SCALE_DEFS,calculate} from './calculator-models.js';

const items=document.getElementById('calc-items');
const details=document.getElementById('calc-detail');
const query=document.getElementById('calc-search');
const filters=document.getElementById('calc-filters');
const count=document.getElementById('calc-count');
let category='Все',active=null,lastResult=null;
const escapeHtml=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const groups=['Все','Риск','Инсульт','Сознание','Мышцы','Боль','Общие'];
filters.innerHTML=groups.map(g=>'<button class="calc-filter'+(g===category?' active':'')+'" type="button" data-group="'+g+'" aria-pressed="'+(g===category)+'">'+g+'</button>').join('');
function list(){
 const term=query.value.toLocaleLowerCase('ru-RU').trim().replace(/ё/g,'е');
 const match=SCALE_DEFS.filter(s=>(category==='Все'||s.group===category)&&[s.title,s.subtitle,s.group,s.detail].join(' ').toLocaleLowerCase('ru-RU').replace(/ё/g,'е').includes(term));
 count.textContent='Найдено инструментов: '+match.length+' из '+SCALE_DEFS.length;
 items.innerHTML=match.map((s,i)=>'<button type="button" data-tool="'+s.id+'" class="calc-card'+(active===s.id?' active':'')+'"><span class="calc-card-number">'+String(i+1).padStart(2,'0')+'</span><span class="calc-card-info"><span class="calc-card-group">'+escapeHtml(s.group)+'</span><strong>'+escapeHtml(s.title)+'</strong><small>'+escapeHtml(s.subtitle)+'</small></span><span class="calc-card-chevron" aria-hidden="true">↗</span></button>').join('')||'<p class="calc-empty">Ничего не найдено. Попробуй другой запрос.</p>';
}
function fieldMarkup(f){
 const label='<label class="calc-field-title" for="calc-'+f.key+'">'+escapeHtml(f.label)+'</label>';
 if(f.type==='select')return '<div class="calc-field">'+label+'<select id="calc-'+f.key+'" name="'+f.key+'" required><option value="" disabled selected>Выбери вариант</option>'+f.options.filter(pair=>pair[0]!=='').map(pair=>'<option value="'+escapeHtml(pair[0])+'">'+escapeHtml(pair[1])+'</option>').join('')+'</select></div>';
 return '<div class="calc-field">'+label+'<input type="number" id="calc-'+f.key+'" name="'+f.key+'" min="'+f.min+'" max="'+f.max+'" step="'+(f.step??1)+'" inputmode="decimal" required placeholder="Введи значение"></div>';
}
function openTool(id,focus=true){
 const tool=SCALE_DEFS.find(s=>s.id===id);
 if(!tool)return;
 active=id;lastResult=null;list();
 details.innerHTML='<div class="calc-tool-header"><span class="calc-tool-category">'+escapeHtml(tool.group)+'</span><h2>'+escapeHtml(tool.title)+'</h2><p>'+escapeHtml(tool.detail)+'</p></div>'+
  '<form id="calc-form" novalidate><div class="calc-fields">'+tool.fields.map(fieldMarkup).join('')+'</div><div class="calc-form-actions"><button type="submit" class="calc-primary-button">Рассчитать</button><button type="reset" class="calc-secondary-button">Сбросить</button></div></form>'+
  '<div class="calc-result" id="calc-result" role="status" aria-live="polite"><span>Результат появится здесь после заполнения формы.</span></div>'+
  '<div class="calc-tool-notice"><strong>Ограничения</strong><p>'+escapeHtml(tool.note)+'</p></div>'+
  '<div class="calc-tool-sources"><strong>Первоисточники и методика</strong>'+tool.sources.map(s=>'<a href="'+escapeHtml(s[1])+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(s[0])+' ↗</a>').join('')+'</div>';
 const form=document.getElementById('calc-form'),result=document.getElementById('calc-result');
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const data=Object.fromEntries(new FormData(form).entries());
  try{
   for(const f of tool.fields)if(!data[f.key])throw Error('Заполни поле: '+f.label+'.');
   const outcome=calculate(id,data);
   lastResult=outcome;
   result.classList.remove('is-error');
   result.innerHTML='<span class="calc-result-eyebrow">РЕЗУЛЬТАТ</span><strong class="calc-result-value">'+escapeHtml(outcome.value)+'</strong><b>'+escapeHtml(outcome.label)+'</b><p>'+escapeHtml(outcome.note)+'</p><button type="button" id="calc-copy">Скопировать результат</button>';
   document.getElementById('calc-copy').addEventListener('click',()=>copyResult(tool,outcome));
  }catch(error){
   lastResult=null;result.classList.add('is-error');result.innerHTML='<strong>Нельзя рассчитать</strong><p>'+escapeHtml(error.message)+'</p>';
  }
 });
 form.addEventListener('reset',()=>{lastResult=null;result.classList.remove('is-error');result.innerHTML='<span>Результат появится здесь после заполнения формы.</span>';});
 const url=new URL(location.href);url.searchParams.set('tool',id);history.replaceState(null,'',url.pathname+url.search+url.hash);
 if(focus){
  if(window.matchMedia('(max-width:900px)').matches)details.scrollIntoView({behavior:'smooth',block:'start'});
  else details.querySelector('h2')?.setAttribute('tabindex','-1'),details.querySelector('h2')?.focus({preventScroll:true});
 }
}
async function copyResult(tool,outcome){
 const message=tool.title+'\n'+outcome.value+' — '+outcome.label+'\n'+outcome.note+'\nNeuroDesk: справочный результат, требует клинической оценки.';
 try{
  await navigator.clipboard.writeText(message);
  const b=document.getElementById('calc-copy');if(b)b.textContent='Скопировано';
 }catch(error){
  const b=document.getElementById('calc-copy');if(b)b.textContent='Не удалось скопировать';
 }
}
items.addEventListener('click',e=>{const b=e.target.closest('[data-tool]');if(b)openTool(b.dataset.tool);});
filters.addEventListener('click',e=>{
 const b=e.target.closest('[data-group]');if(!b)return;
 category=b.dataset.group;
 filters.querySelectorAll('[data-group]').forEach(n=>{n.classList.toggle('active',n===b);n.setAttribute('aria-pressed',String(n===b));});
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
