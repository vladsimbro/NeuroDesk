import {ICD_CHAPTERS,createICDIndex,getICDByCode,getAncestors,getChildren,chapterItems,chapterGroups,chapterOf,searchICD,normalizeCode,isCurrent} from './icd-core.js';

const DATA_URL=new URL('../data/icd10-v2.27.json',import.meta.url).href;
const SOURCE_URL='https://nsi.rosminzdrav.ru/dictionaries/1.2.643.5.1.13.13.11.1005/passport/2.27';
const PAGE_SIZE=60;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const encode=value=>encodeURIComponent(value);
const formatCount=n=>n.toLocaleString('ru-RU');

export function bindICD(){
 const input=document.getElementById('icd-query'),clear=document.getElementById('icd-clear');
 const inactive=document.getElementById('icd-include-inactive'),count=document.getElementById('icd-count-label');
 const status=document.getElementById('icd-status'),results=document.getElementById('icd-results'),more=document.getElementById('icd-more-wrap');
 const card=document.querySelector('.icd-search-card'),chapters=document.querySelector('.icd-chapters-grid');
 if(!input||!card||!chapters)return;
 status.insertAdjacentHTML('afterend','<section class="icd-entry-detail" id="icd-entry-detail" aria-label="Карточка кода МКБ-10" hidden></section>');
 chapters.insertAdjacentHTML('beforebegin','<div class="icd-class-toolbar" id="icd-class-toolbar" hidden></div>');
 const detail=document.getElementById('icd-entry-detail'),classToolbar=document.getElementById('icd-class-toolbar');
 let index=null,loading=null,timer=null,shown=PAGE_SIZE,found=[],chapterRange='',selected='';
 let requestId=0;
 const initial=new URL(location.href);
 const initialCode=initial.searchParams.get('code')||'';
 const initialSearch=initial.searchParams.get('icd')||'';
 input.value=initialSearch;

 function updateAddress({push=false}={}){
  const url=new URL(location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('icd');
  if(selected)url.searchParams.set('code',selected);
  if(input.value.trim())url.searchParams.set('icd',input.value.trim());
  if(chapterRange)url.searchParams.set('chapter',chapterRange);
  else url.searchParams.delete('chapter');
  url.hash='icd';
  const address=url.pathname+url.search+url.hash;
  if(address!==location.pathname+location.search+location.hash)history[push?'pushState':'replaceState'](null,'',address);
 }
 function errorMarkup(message){
  return '<div class="icd-api-fallback" role="alert"><strong>Не удалось загрузить МКБ-10.</strong><p>'+esc(message)+'</p><button class="button button-outline" type="button" id="icd-retry">Повторить попытку</button> <a href="'+SOURCE_URL+'" target="_blank" rel="noopener noreferrer">Официальный источник ↗</a></div>';
 }
 async function load(){
  if(index)return index;
  if(loading)return loading;
  status.textContent='Загружаем локальную базу МКБ-10…';
  loading=(async()=>{
   const response=await fetch(DATA_URL);
   if(!response.ok)throw Error('HTTP '+response.status+'. Проверь подключение и обнови страницу.');
   const data=await response.json();
   const ready=createICDIndex(data);
   index=ready;
   count.textContent=formatCount(ready.records.length)+' записей · версия 2.27';
   return ready;
  })();
  try{return await loading;}catch(error){loading=null;throw error;}
 }
 function tags(item){
  let html='';
  if(!isCurrent(item))html+='<span class="icd-old-tag">Неактуальная запись</span>';
  if(item.addlCode==='1')html+='<span class="icd-addl-tag" title="Указатель дополнительного кодирования; проверь правила МКБ-10">Пометка +</span>';
  if(item.addlCode==='2')html+='<span class="icd-addl-tag" title="Указатель дополнительного кодирования; проверь правила МКБ-10">Пометка *</span>';
  return html;
 }
 function itemButton(item,{compact=false}={}){
  const children=index.childrenByParent.get(item.id)?.length||0;
  return '<button type="button" class="icd-result icd-entry-button'+(compact?' icd-entry-compact':'')+'" data-icd-open="'+esc(item.code)+'" aria-label="Открыть запись '+esc(item.code)+': '+esc(item.name)+'"><span class="icd-result-code">'+esc(item.code||'—')+'</span><span class="icd-result-main"><strong>'+esc(item.name||'Без названия')+'</strong><small>'+(children?'Подкатегорий: '+children+' · ':'')+(item.parentId&&index.byId.get(item.parentId)?'Раздел: '+esc(index.byId.get(item.parentId).name):'Классификатор МКБ-10')+'</small></span><span class="icd-result-tags">'+tags(item)+'</span><span class="icd-open-chevron" aria-hidden="true">›</span></button>';
 }
 function renderList(){
  const q=input.value.trim(),filtered=Boolean(q),scope=chapterRange?ICD_CHAPTERS.find(c=>c[1]===chapterRange):null;
  if(!index)return;
  const queryResults=filtered?searchICD(index,q,{includeInactive:inactive.checked,chapterRange}):chapterRange?chapterGroups(index,chapterRange,inactive.checked):[];
  found=queryResults;
  if(!found.length){
   results.innerHTML=filtered||scope?'<div class="icd-empty"><strong>Совпадений не найдено</strong><span>Попробуй другую формулировку или отключи фильтр класса.</span></div>':'<div class="icd-empty icd-start"><strong>Поиск по всей российской МКБ-10</strong><span>Введи код или часть названия либо выбери класс ниже. Каждую запись можно открыть и посмотреть её место в иерархии.</span></div>';
   more.innerHTML='';
  }else{
   results.innerHTML=found.slice(0,shown).map(item=>itemButton(item)).join('');
   more.innerHTML=shown<found.length?'<button class="button button-outline icd-more-button" type="button" id="icd-more">Показать ещё '+Math.min(PAGE_SIZE,found.length-shown)+' из '+formatCount(found.length-shown)+' оставшихся</button>':'';
  }
  if(filtered)status.textContent='Найдено '+formatCount(found.length)+(scope?' в классе '+scope[0]:'')+'.'+(found.length>'0'?' Показано '+formatCount(Math.min(found.length,shown))+'.':'');
  else if(scope)status.textContent='Класс '+scope[0]+' · '+scope[2]+' · '+formatCount(chapterItems(index,scope[1],inactive.checked).length)+' записей. Ниже показаны основные рубрики.';
  else status.textContent='База загружена. Доступно '+formatCount(index.records.length)+' записей. Выбери класс или введи запрос.';
  renderChapterToolbar();
 }
 function renderChapterToolbar(){
  if(!chapterRange){classToolbar.hidden=true;classToolbar.innerHTML='';chapters.querySelectorAll('button').forEach(b=>b.classList.remove('is-active'));return;}
  const chapter=ICD_CHAPTERS.find(c=>c[1]===chapterRange);
  classToolbar.hidden=false;
  classToolbar.innerHTML='<div><span class="icd-class-eyebrow">ВЫБРАН КЛАСС '+esc(chapter?.[0]||'')+'</span><strong>'+esc(chapter?.[2]||'')+'</strong><small>'+esc(chapterRange)+'</small></div><button type="button" id="icd-reset-chapter" class="button button-outline">Все классы</button>';
  chapters.querySelectorAll('[data-icd-chapter]').forEach(b=>{
   const active=b.dataset.icdChapter===chapterRange;
   b.classList.toggle('is-active',active);
   b.setAttribute('aria-pressed',String(active));
  });
 }
 function hierarchyButton(item){
  return '<button type="button" class="icd-path-code" data-icd-open="'+esc(item.code)+'"><b>'+esc(item.code)+'</b> '+esc(item.name)+'</button>';
 }
 function renderDetail(){
  if(!index||!selected){detail.hidden=true;detail.innerHTML='';return;}
  const item=getICDByCode(index,selected);
  if(!item){detail.hidden=true;detail.innerHTML='';return;}
  const ancestors=getAncestors(index,item),children=getChildren(index,item,inactive.checked),chapter=chapterOf(item.code);
  const parent=ancestors.at(-1),siblings=parent?getChildren(index,parent,inactive.checked).filter(x=>x.id!==item.id).slice(0,12):[];
  detail.hidden=false;
  detail.innerHTML='<div class="icd-detail-heading"><div><span class="icd-class-eyebrow">КАРТОЧКА ЗАПИСИ · МКБ-10 РФ</span><h2><span>'+esc(item.code)+'</span> '+esc(item.name)+'</h2></div><button class="icd-detail-dismiss" type="button" id="icd-hide-detail" aria-label="Закрыть карточку">×</button></div>'+
   '<div class="icd-detail-tools"><button type="button" id="icd-copy-code" class="button button-outline">Скопировать код</button><button type="button" id="icd-copy-entry" class="button button-outline">Скопировать код и название</button><button type="button" id="icd-copy-link" class="button button-outline">Ссылка на запись</button></div>'+
   '<div id="icd-copy-feedback" class="icd-copy-feedback" role="status" aria-live="polite"></div>'+
   '<div class="icd-detail-facts"><span><b>Статус:</b> '+(isCurrent(item)?'актуальна в версии 2.27':'неактуальна в версии 2.27')+'</span>'+(item.date?'<span><b>Дата в источнике:</b> '+esc(item.date)+'</span>':'')+(item.addlCode==='1'||item.addlCode==='2'?'<span><b>Признак дополнительного кодирования:</b> '+(item.addlCode==='1'?'+':'*')+'</span>':'')+'</div>'+
   (chapter?'<div class="icd-detail-section"><h3>Класс МКБ-10</h3><button type="button" data-icd-chapter="'+esc(chapter[1])+'" class="icd-path-code"><b>'+esc(chapter[0]+' · '+chapter[1])+'</b> '+esc(chapter[2])+'</button></div>':'')+
   '<div class="icd-detail-section"><h3>Родительские рубрики</h3>'+(ancestors.length?'<div class="icd-path">'+ancestors.map(hierarchyButton).join('<span class="icd-path-separator">›</span>')+'</div>':'<p>В исходном наборе нет родительской записи.</p>')+'</div>'+
   '<div class="icd-detail-section"><h3>Подрубрики <span>'+formatCount(children.length)+'</span></h3>'+(children.length?'<div class="icd-related-list">'+children.slice(0,120).map(x=>itemButton(x,{compact:true})).join('')+'</div>'+(children.length>120?'<p>Показаны первые 120 записей. Для полного списка используй поиск по коду.</p>':''):'<p>В текущей выгрузке дочерних рубрик нет. Это не подтверждает допустимость кода как окончательного диагноза.</p>')+'</div>'+
   (siblings.length?'<div class="icd-detail-section"><h3>Соседние коды</h3><div class="icd-related-list">'+siblings.map(x=>itemButton(x,{compact:true})).join('')+'</div></div>':'')+
   '<p class="icd-detail-caution">Наименования и признаки получены из справочника НСИ. Этот набор не содержит полных примечаний «включено», «исключено» и всех правил кодирования. Для медицинской документации сверяй официальный классификатор и действующие инструкции.</p>'+
   '<a class="icd-detail-source" href="'+SOURCE_URL+'" target="_blank" rel="noopener noreferrer">Открыть паспорт версии 2.27 в НСИ Минздрава ↗</a>';
 }
 function selectCode(code,{push=true,scroll=true}={}){
  const item=index&&getICDByCode(index,code);
  if(!item)return false;
  selected=item.code;
  renderDetail();
  updateAddress({push});
  if(scroll)detail.scrollIntoView({behavior:'smooth',block:'start'});
  return true;
 }
 function setChapter(range){
  if(!ICD_CHAPTERS.some(ch=>ch[1]===range))return;
  chapterRange=range;
  shown=PAGE_SIZE;
  input.value='';
  renderList();
  updateAddress();
  card.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function performSearch(){
  if(!index)return;
  chapterRange='';
  shown=PAGE_SIZE;
  renderList();
  updateAddress();
 }
 async function startup(){
  const id=++requestId;
  try{
   await load();
   if(id!==requestId||!input.isConnected)return;
   const address=new URL(location.href);
   const classValue=address.searchParams.get('chapter')||'';
   chapterRange=ICD_CHAPTERS.some(ch=>ch[1]===classValue)?classValue:'';
   shown=PAGE_SIZE;
   renderList();
   const code=address.searchParams.get('code')||initialCode;
   if(code){
    const ok=selectCode(code,{push:false,scroll:false});
    if(!ok){status.textContent+=' Код из ссылки не найден в версии 2.27.';updateAddress();}
   }
  }catch(error){
   if(id!==requestId)return;
   status.textContent='Ошибка загрузки справочника.';
   results.innerHTML=errorMarkup(error.message);
   more.innerHTML='';
  }
 }
 card.addEventListener('click',event=>{
  const open=event.target.closest('[data-icd-open]');
  if(open&&index){selectCode(open.dataset.icdOpen);return;}
  if(event.target.closest('#icd-more')){shown+=PAGE_SIZE;renderList();return;}
  if(event.target.closest('#icd-retry')){startup();}
 });
 detail.addEventListener('click',async event=>{
  const open=event.target.closest('[data-icd-open]');
  if(open){selectCode(open.dataset.icdOpen);return;}
  const chapterButton=event.target.closest('[data-icd-chapter]');
  if(chapterButton){setChapter(chapterButton.dataset.icdChapter);return;}
  if(event.target.closest('#icd-hide-detail')){
   selected='';renderDetail();updateAddress({push:true});input.focus();return;
  }
  const codeBtn=event.target.closest('#icd-copy-code,#icd-copy-entry,#icd-copy-link');
  if(!codeBtn)return;
  const item=index&&getICDByCode(index,selected);
  if(!item)return;
  const text=codeBtn.id==='icd-copy-code'?item.code:codeBtn.id==='icd-copy-entry'?item.code+' — '+item.name:location.href;
  const output=document.getElementById('icd-copy-feedback');
  try{await navigator.clipboard.writeText(text);output.textContent='Скопировано.';}catch(error){output.textContent='Копирование недоступно. Выдели текст вручную.';}
 });
 chapters.addEventListener('click',event=>{
  const b=event.target.closest('[data-icd-chapter]');
  if(b&&index)setChapter(b.dataset.icdChapter);
 });
 classToolbar.addEventListener('click',event=>{
  if(!event.target.closest('#icd-reset-chapter'))return;
  chapterRange='';input.value='';shown=PAGE_SIZE;renderList();updateAddress();
 });
 input.addEventListener('input',()=>{
  clearTimeout(timer);
  timer=setTimeout(performSearch,180);
 });
 input.addEventListener('keydown',event=>{
  if(event.key==='Enter'){event.preventDefault();clearTimeout(timer);performSearch();const first=results.querySelector('[data-icd-open]');first?.focus();}
 });
 clear.addEventListener('click',()=>{
  clearTimeout(timer);input.value='';chapterRange='';shown=PAGE_SIZE;renderList();updateAddress();input.focus();
 });
 inactive.addEventListener('change',()=>{
  shown=PAGE_SIZE;renderList();renderDetail();
 });
 window.addEventListener('popstate',()=>{
  if(!input.isConnected||!index)return;
  const url=new URL(location.href);
  input.value=url.searchParams.get('icd')||'';
  const range=url.searchParams.get('chapter')||'';
  chapterRange=ICD_CHAPTERS.some(ch=>ch[1]===range)?range:'';
  selected=getICDByCode(index,url.searchParams.get('code')||'')?.code||'';
  shown=PAGE_SIZE;renderList();renderDetail();
 });
 startup();
}
