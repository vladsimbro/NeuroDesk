import {ICD_CHAPTERS,createICDIndex,getICDByCode,getAncestors,getChildren,chapterItems,chapterGroups,chapterOf,searchICD,isCurrent} from './icd-core.js';
import {getICDSearchHints,suggestICDQueries,getICDTreeRoots,getICDTreeChildren,getICDTreeLineage,ICD_FAVORITES_KEY,ICD_RECENTS_KEY,readCodeList,writeCodeList} from './icd-enhancements.js';

const DATA_URL=new URL('../data/icd10-v2.27.json',import.meta.url).href;
const SOURCE_URL='https://nsi.rosminzdrav.ru/dictionaries/1.2.643.5.1.13.13.11.1005/passport/2.27';
const PAGE_SIZE=60;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatCount=n=>n.toLocaleString('ru-RU');

export function bindICD(){
 const input=document.getElementById('icd-query'),clear=document.getElementById('icd-clear');
 const inactive=document.getElementById('icd-include-inactive'),count=document.getElementById('icd-count-label');
 const status=document.getElementById('icd-status'),results=document.getElementById('icd-results'),more=document.getElementById('icd-more-wrap');
 const card=document.querySelector('.icd-search-card'),chapters=document.querySelector('.icd-chapters-grid');
 if(!input||!card||!chapters)return;
 status.insertAdjacentHTML('afterend',
  '<div class="icd-search-suggestions" id="icd-search-suggestions" aria-live="polite"></div>'+
  '<section class="icd-entry-detail" id="icd-entry-detail" aria-label="Карточка кода МКБ-10" hidden></section>'+
  '<section class="icd-personal"><div class="icd-personal-actions" role="group" aria-label="Личные списки кодов"><button type="button" id="icd-show-favorites" aria-pressed="false">☆ Избранное <span id="icd-favorites-count">0</span></button><button type="button" id="icd-show-recent" aria-pressed="false">Недавние <span id="icd-recents-count">0</span></button></div><div id="icd-personal-content" hidden></div><p class="icd-personal-hint">Здесь сохраняются только коды в этом браузере, без медицинских данных пациентов.</p></section>'+
  '<p class="icd-offline-state" id="icd-offline-state" role="status">Офлайн-доступ: проверяем поддержку браузера…</p>');

 chapters.insertAdjacentHTML('beforebegin','<div class="icd-class-toolbar" id="icd-class-toolbar" hidden></div><section class="icd-tree-panel" id="icd-tree" hidden aria-label="Дерево классификатора"></section>');
 const detail=document.getElementById('icd-entry-detail'),classToolbar=document.getElementById('icd-class-toolbar');
 const treePanel=document.getElementById('icd-tree'),suggestions=document.getElementById('icd-search-suggestions');
 const personal=document.getElementById('icd-personal-content'),favoriteCount=document.getElementById('icd-favorites-count'),recentCount=document.getElementById('icd-recents-count');
 const offlineStatus=document.getElementById('icd-offline-state');
 let favorites=readCodeList(globalThis.localStorage||null,ICD_FAVORITES_KEY),recents=readCodeList(globalThis.localStorage||null,ICD_RECENTS_KEY);
 let personalMode='',treeExpanded=new Set(),treeRange='';

 let index=null,loading=null,timer=null,shown=PAGE_SIZE,found=[],chapterRange='',selected='';
 let requestId=0;
 function persist(key,list){writeCodeList(globalThis.localStorage||null,key,list);}
 function updateCollections(){
  favoriteCount.textContent=String(favorites.length);
  recentCount.textContent=String(recents.length);
  document.getElementById('icd-show-favorites').setAttribute('aria-pressed',String(personalMode==='favorites'));
  document.getElementById('icd-show-recent').setAttribute('aria-pressed',String(personalMode==='recent'));
  if(!personalMode){personal.hidden=true;personal.innerHTML='';return;}
  const codes=personalMode==='favorites'?favorites:recents;
  personal.hidden=false;
  personal.innerHTML='<div class="icd-personal-heading"><strong>'+(personalMode==='favorites'?'Избранные коды':'Недавно открытые')+'</strong><button type="button" id="icd-clear-personal" '+(!codes.length?'disabled':'')+'>Очистить</button></div>'+
   (codes.length&&index?'<div class="icd-personal-codes">'+codes.map(code=>{
    const record=getICDByCode(index,code);
    return record?'<button type="button" data-icd-open="'+esc(record.code)+'"><b>'+esc(record.code)+'</b> '+esc(record.name)+'</button>':'';
   }).join('')+'</div>':'<p class="icd-personal-empty">Пока ничего нет.</p>');
 }
 function recordVisit(code){
  recents=[code,...recents.filter(c=>c!==code)].slice(0,20);
  persist(ICD_RECENTS_KEY,recents);
  updateCollections();
 }
 function toggleFavorite(){
  if(!selected)return;
  favorites=favorites.includes(selected)?favorites.filter(c=>c!==selected):[selected,...favorites].slice(0,30);
  persist(ICD_FAVORITES_KEY,favorites);
  updateCollections();renderDetail();
 }
 function renderSuggestions(query,resultsLength){
  if(!index||!query.trim()){suggestions.innerHTML='';return;}
  const matched=getICDSearchHints(index,query,{includeInactive:inactive.checked,chapterRange});
  const hints=matched.filter(row=>!found.some(item=>item.id===row.item.id));
  const typos=resultsLength===0?suggestICDQueries(index,query):[];
  suggestions.innerHTML=
   (hints.length?'<div class="icd-search-hints"><b>Поисковые ориентиры</b><div>'+hints.map(row=>'<button type="button" data-icd-open="'+esc(row.item.code)+'"><strong>'+esc(row.item.code)+'</strong> · '+esc(row.label)+'</button>').join('')+'</div><small>Это подсказки для навигации, а не рекомендации по выбору кода диагноза.</small></div>':'')+
   (typos.length?'<div class="icd-typos"><b>Возможно, ты искал:</b> '+typos.map(word=>'<button type="button" data-icd-suggest="'+esc(word)+'">'+esc(word)+'</button>').join('')+'</div>':'');
 }
 function renderTree(){
  if(!index||!chapterRange){treePanel.hidden=true;treePanel.innerHTML='';return;}
  if(treeRange!==chapterRange){treeExpanded=new Set();treeRange=chapterRange;}
  const roots=getICDTreeRoots(index,chapterRange,inactive.checked),chapter=ICD_CHAPTERS.find(c=>c[1]===chapterRange);
  let rendered=0;
  const node=(item,depth=0,parents=new Set())=>{
   if(depth>12||parents.has(item.id)||rendered>2500)return '';
   rendered++;
   const children=getICDTreeChildren(index,item,inactive.checked),expanded=treeExpanded.has(item.id);
   const nextParents=new Set(parents);nextParents.add(item.id);
   return '<li class="icd-tree-node"><div class="icd-tree-row'+(selected===item.code?' is-selected':'')+'">'+
    (children.length?'<button type="button" class="icd-tree-toggle" data-icd-expand="'+esc(item.id)+'" aria-label="'+(expanded?'Свернуть':'Развернуть')+' '+esc(item.code)+'" aria-expanded="'+expanded+'">'+(expanded?'⌄':'›')+'</button>':'<span class="icd-tree-spacer" aria-hidden="true"></span>')+
    '<button type="button" class="icd-tree-item" data-icd-open="'+esc(item.code)+'"><b>'+esc(item.code)+'</b><span>'+esc(item.name)+'</span></button>'+
    (children.length?'<small>'+children.length+'</small>':'')+
    '</div>'+(expanded&&children.length?'<ul>'+children.map(child=>node(child,depth+1,nextParents)).join('')+'</ul>':'')+'</li>';
  };
  treePanel.hidden=false;
  treePanel.innerHTML='<div class="icd-tree-heading"><div><span class="icd-class-eyebrow">ИНТЕРАКТИВНОЕ ДЕРЕВО</span><h3>Класс '+esc(chapter?.[0]||'')+' · '+esc(chapter?.[2]||'')+'</h3><p>Раскрывай блоки и подрубрики. Нажми на код, чтобы открыть полную карточку.</p></div><span class="icd-tree-root-count">'+roots.length+' корневых рубрик</span></div>'+
   '<ul class="icd-tree-roots">'+roots.map(root=>node(root)).join('')+'</ul>';
 }
 function revealInTree(item){
  if(!chapterRange||!item)return;
  for(const id of getICDTreeLineage(index,item,chapterRange,inactive.checked))treeExpanded.add(id);
  renderTree();
 }
 async function initOffline(){
  if(!('serviceWorker' in navigator)||!window.isSecureContext){offlineStatus.textContent='Офлайн-доступ требует HTTPS и браузер с поддержкой Service Worker.';return;}
  try{
   await navigator.serviceWorker.register('./sw-icd.js',{scope:'./'});
   await navigator.serviceWorker.ready;
   offlineStatus.textContent='Офлайн-копия МКБ-10 подготовлена в браузере. Доступна после первой успешной загрузки, пока браузер хранит кэш.';
  }catch(e){
   offlineStatus.textContent='Офлайн-копию не удалось подготовить. При наличии сети справочник продолжит работать.';
  }
 }

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
  if(filtered)status.textContent='Найдено '+formatCount(found.length)+(scope?' в классе '+scope[0]:'')+'.'+(found.length>0?' Показано '+formatCount(Math.min(found.length,shown))+'.':'');
  else if(scope)status.textContent='Класс '+scope[0]+' · '+scope[2]+' · '+formatCount(chapterItems(index,scope[1],inactive.checked).length)+' записей. Ниже показаны основные рубрики.';
  else status.textContent='База загружена. Доступно '+formatCount(index.records.length)+' записей. Выбери класс или введи запрос.';
  renderChapterToolbar();
  renderSuggestions(q,found.length);
  renderTree();
  updateCollections();
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
   '<div class="icd-detail-tools"><button type="button" id="icd-toggle-favorite" class="button button-outline" aria-pressed="'+favorites.includes(item.code)+'">'+(favorites.includes(item.code)?'★ В избранном':'☆ В избранное')+'</button><button type="button" id="icd-copy-code" class="button button-outline">Скопировать код</button><button type="button" id="icd-copy-entry" class="button button-outline">Скопировать код и название</button><button type="button" id="icd-copy-link" class="button button-outline">Ссылка на запись</button></div>'+
   '<div id="icd-copy-feedback" class="icd-copy-feedback" role="status" aria-live="polite"></div>'+
   '<div class="icd-detail-facts"><span><b>Статус:</b> '+(isCurrent(item)?'актуальна в версии 2.27':'неактуальна в версии 2.27')+'</span>'+(item.date?'<span><b>Дата в источнике:</b> '+esc(item.date)+'</span>':'')+(item.addlCode==='1'||item.addlCode==='2'?'<span><b>Признак дополнительного кодирования:</b> '+(item.addlCode==='1'?'+':'*')+'</span>':'')+'</div>'+
   (chapter?'<div class="icd-detail-section"><h3>Класс МКБ-10</h3><button type="button" data-icd-chapter="'+esc(chapter[1])+'" class="icd-path-code"><b>'+esc(chapter[0]+' · '+chapter[1])+'</b> '+esc(chapter[2])+'</button></div>':'')+
   '<div class="icd-detail-section"><h3>Родительские рубрики</h3>'+(ancestors.length?'<div class="icd-path">'+ancestors.map(hierarchyButton).join('<span class="icd-path-separator">›</span>')+'</div>':'<p>В исходном наборе нет родительской записи.</p>')+'</div>'+
   '<div class="icd-detail-section"><h3>Подрубрики <span>'+formatCount(children.length)+'</span></h3>'+(children.length?'<div class="icd-related-list">'+children.slice(0,120).map(x=>itemButton(x,{compact:true})).join('')+'</div>'+(children.length>120?'<p>Показаны первые 120 записей. Для полного списка используй поиск по коду.</p>':''):'<p>В текущей выгрузке дочерних рубрик нет. Это не подтверждает допустимость кода как окончательного диагноза.</p>')+'</div>'+
   (siblings.length?'<div class="icd-detail-section"><h3>Соседние коды</h3><div class="icd-related-list">'+siblings.map(x=>itemButton(x,{compact:true})).join('')+'</div></div>':'')+
   '<p class="icd-detail-caution">Наименования и признаки получены из справочника НСИ. Этот набор не содержит полных примечаний «включено», «исключено» и всех правил кодирования. Для медицинской документации сверяй официальный классификатор и действующие инструкции.</p>'+
   '<div class="icd-detail-source-links"><a class="icd-detail-source" href="'+SOURCE_URL+'" target="_blank" rel="noopener noreferrer">Российская база МКБ-10 · версия 2.27 ↗</a><a class="icd-detail-source" href="https://icd.who.int/browse10/2019/en" target="_blank" rel="noopener noreferrer">МКБ-10 ВОЗ 2019 (другая редакция) ↗</a></div>';
 }
 function selectCode(code,{push=true,scroll=true}={}){
  const item=index&&getICDByCode(index,code);
  if(!item)return false;
  selected=item.code;
  recordVisit(selected);
  revealInTree(item);
  renderDetail();
  updateAddress({push});
  if(scroll)detail.scrollIntoView({behavior:'smooth',block:'start'});
  return true;
 }
 function setChapter(range){
  if(!ICD_CHAPTERS.some(ch=>ch[1]===range))return;
  chapterRange=range;
  shown=PAGE_SIZE;
  renderList();
  updateAddress({push:true});
  treePanel.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function performSearch(){
  if(!index)return;
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
   updateCollections();
   initOffline();
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
  if(event.target.closest('#icd-toggle-favorite')){toggleFavorite();return;}
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
  chapterRange='';shown=PAGE_SIZE;renderList();updateAddress({push:true});
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
 suggestions.addEventListener('click',event=>{
  const open=event.target.closest('[data-icd-open]');
  if(open){selectCode(open.dataset.icdOpen);return;}
  const suggested=event.target.closest('[data-icd-suggest]');
  if(suggested){
   input.value=suggested.dataset.icdSuggest;
   performSearch();input.focus();
  }
 });
 treePanel.addEventListener('click',event=>{
  const toggle=event.target.closest('[data-icd-expand]');
  if(toggle){
   const id=toggle.dataset.icdExpand;
   if(treeExpanded.has(id))treeExpanded.delete(id);
   else treeExpanded.add(id);
   renderTree();
   treePanel.querySelector('[data-icd-expand="'+CSS.escape(id)+'"]')?.focus({preventScroll:true});
   return;
  }
  const open=event.target.closest('[data-icd-open]');
  if(open)selectCode(open.dataset.icdOpen);
 });
 const personalActions=document.querySelector('.icd-personal-actions');
 personalActions.addEventListener('click',event=>{
  const favorite=event.target.closest('#icd-show-favorites');
  const recent=event.target.closest('#icd-show-recent');
  if(favorite)personalMode=personalMode==='favorites'?'':'favorites';
  else if(recent)personalMode=personalMode==='recent'?'':'recent';
  else return;
  updateCollections();
 });
 personal.addEventListener('click',event=>{
  const open=event.target.closest('[data-icd-open]');
  if(open){selectCode(open.dataset.icdOpen);return;}
  if(!event.target.closest('#icd-clear-personal'))return;
  if(personalMode==='favorites'){favorites=[];persist(ICD_FAVORITES_KEY,favorites);}
  if(personalMode==='recent'){recents=[];persist(ICD_RECENTS_KEY,recents);}
  updateCollections();renderDetail();
 });
 window.addEventListener('popstate',()=>{
  if(!input.isConnected||!index)return;
  const url=new URL(location.href);
  input.value=url.searchParams.get('icd')||'';
  const range=url.searchParams.get('chapter')||'';
  chapterRange=ICD_CHAPTERS.some(ch=>ch[1]===range)?range:'';
  selected=getICDByCode(index,url.searchParams.get('code')||'')?.code||'';
  shown=PAGE_SIZE;renderList();
  if(selected)revealInTree(getICDByCode(index,selected));
  renderDetail();
 });
 startup();
}
