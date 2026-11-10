const app = document.getElementById('app-content');
const breadcrumb = document.getElementById('breadcrumb-current');
const sidebar = document.getElementById('sidebar');

const ICONS = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',
  book:'<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5z"/><path d="M4 4.5v18M8 6h8M8 10h7"/>',
  search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
  calendar:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9h18"/>',
  clipboard:'<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6m-6 4h6m-6 4h3"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  external:'<path d="M14 3h7v7m-11 4L21 3"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2"/>',
  moon:'<path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v5m0-8h.01"/>'
};
function icon(name,size=18){
  return '<svg viewBox="0 0 24 24" width="'+size+'" height="'+size+'" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[name]||ICONS.info)+'</svg>';
}
function esc(value){
  return String(value).replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function routeName(){
  const route=(location.hash||'#overview').slice(1);
  return route==='icd'?'icd':'overview';
}
function setActiveNav(route){
  document.querySelectorAll('[data-route]').forEach(node=>node.classList.toggle('active',node.dataset.route===route));
}
function renderOverview(){
  return '<div class="page-heading"><div><div class="eyebrow">NEURODESK · СПРАВОЧНИК</div><h1>МКБ-10 без лишнего поиска</h1><p class="lead">Быстрый доступ к российской Международной классификации болезней: найди код по названию диагноза или проверь расшифровку по коду.</p></div></div>'+
  '<section class="icd-home-hero"><div class="icd-home-copy"><span class="hero-kicker">РОССИЙСКАЯ КЛАССИФИКАЦИЯ</span><h2>Нужный код — за несколько секунд.</h2><p>Поиск по коду, названию и формулировке диагноза. Каталог включает классы, блоки, рубрики и подрубрики классификации.</p><a class="button button-primary" href="#icd">Открыть справочник '+icon('arrow',14)+'</a></div><div class="icd-home-mark" aria-hidden="true"><span>МКБ</span><strong>10</strong><small>ICD · RU</small></div></section>'+
  '<div class="icd-home-grid"><article class="card card-pad"><div class="resource-mark">'+icon('search')+'</div><h3>Поиск по названию</h3><p>Например: мигрень, радикулопатия, эпилепсия или инсульт.</p></article><article class="card card-pad"><div class="resource-mark">'+icon('clipboard')+'</div><h3>Поиск по коду</h3><p>Введи полный код или его часть: G43, I63.9, M54.16.</p></article><article class="card card-pad"><div class="resource-mark">'+icon('book')+'</div><h3>Вся классификация</h3><p>22 класса с переходом к нужному разделу и поиском по диагнозам.</p></article></div>'+
  '<p class="source-citation">Справочник помогает находить классификационные формулировки. Выбор кода для медицинской документации требует проверки клинического контекста и действующих нормативных правил.</p>';
}
function renderICD(){
  const chapters=[
    ['I','A00–B99','Некоторые инфекционные и паразитарные болезни','A00'],
    ['II','C00–D48','Новообразования','C00'],
    ['III','D50–D89','Болезни крови и отдельные нарушения иммунного механизма','D50'],
    ['IV','E00–E90','Болезни эндокринной системы, расстройства питания и нарушения обмена веществ','E00'],
    ['V','F00–F99','Психические расстройства и расстройства поведения','F00'],
    ['VI','G00–G99','Болезни нервной системы','G00'],
    ['VII','H00–H59','Болезни глаза и его придаточного аппарата','H00'],
    ['VIII','H60–H95','Болезни уха и сосцевидного отростка','H60'],
    ['IX','I00–I99','Болезни системы кровообращения','I00'],
    ['X','J00–J99','Болезни органов дыхания','J00'],
    ['XI','K00–K93','Болезни органов пищеварения','K00'],
    ['XII','L00–L99','Болезни кожи и подкожной клетчатки','L00'],
    ['XIII','M00–M99','Болезни костно-мышечной системы и соединительной ткани','M00'],
    ['XIV','N00–N99','Болезни мочеполовой системы','N00'],
    ['XV','O00–O99','Беременность, роды и послеродовой период','O00'],
    ['XVI','P00–P96','Отдельные состояния перинатального периода','P00'],
    ['XVII','Q00–Q99','Врождённые аномалии, деформации и хромосомные нарушения','Q00'],
    ['XVIII','R00–R99','Симптомы, признаки и отклонения от нормы','R00'],
    ['XIX','S00–T98','Травмы, отравления и другие последствия воздействия внешних причин','S00'],
    ['XX','V01–Y98','Внешние причины заболеваемости и смертности','V01'],
    ['XXI','Z00–Z99','Факторы, влияющие на состояние здоровья и обращения за медицинской помощью','Z00'],
    ['XXII','U00–U99','Коды для специальных целей','U00']
  ];
  return '<div class="page-heading"><div><div class="eyebrow">ПОИСКОВЫЙ КАТАЛОГ</div><h1>Международная классификация болезней · 10-й пересмотр</h1><p class="lead">Ищи по коду, названию или части формулировки. Результаты загружаются из российского нормативно-справочного набора МКБ-10.</p></div><span class="date-chip">15 038 записей в исходном наборе</span></div>'+
  '<section class="card card-pad icd-search-card"><label class="icd-search-label" for="icd-query">Что ищем?</label><div class="icd-search-row"><span class="icd-search-icon">'+icon('search',20)+'</span><input id="icd-query" type="search" autocomplete="off" placeholder="Например, G43.1 или мигрень" aria-describedby="icd-search-help"><button id="icd-clear" class="button button-outline" type="button">Очистить</button></div><p id="icd-search-help" class="source-citation">Вводи минимум 2 символа. Поиск поддерживает русские названия и коды с точкой.</p><div id="icd-status" class="icd-status" role="status" aria-live="polite">Начни вводить запрос — результаты появятся здесь.</div><div id="icd-results" class="icd-results"></div></section>'+
  '<section class="icd-chapters-section"><div class="section-head"><div><div class="eyebrow">СТРУКТУРА КЛАССИФИКАЦИИ</div><h2>Классы МКБ-10</h2></div><span class="soft-chip">22 класса</span></div><div class="icd-chapters-grid">'+
  chapters.map(c=>'<button class="icd-chapter" type="button" data-icd-chapter="'+c[3]+'"><span class="icd-chapter-number">'+c[0]+'</span><span class="icd-chapter-copy"><strong>'+esc(c[2])+'</strong><small>'+c[1]+'</small></span>'+icon('arrow',15)+'</button>').join('')+
  '</div></section><section class="icd-source-note"><strong>Источник и версия данных</strong><p>Российский нормативно-справочный набор МКБ-10 (OID 1.2.643.5.1.13.13.11.1005), 15 038 записей. Опубликованное обновление набора датировано 25.10.2021; версия содержит изменения по письму Минздрава РФ от 12.11.2020 № 13-2/753. Перед применением в документации проверяй действующую редакцию.</p><a href="https://data.apicrafter.ru/tables/nsimz/3720" target="_blank" rel="noopener noreferrer">Паспорт набора и происхождение данных '+icon('external',13)+'</a></section>';
}
function bindICD(){
  const input=document.getElementById('icd-query');
  const status=document.getElementById('icd-status');
  const results=document.getElementById('icd-results');
  const clear=document.getElementById('icd-clear');
  let timer=null,controller=null,sequence=0;
  const api='https://api.crftr.net/open/rawapi/v3/nsimz/3720';
  function normalize(payload){
    const items=Array.isArray(payload)?payload:(payload?._items||payload?.items||payload?.results||[]);
    return items.map(item=>({
      code:String(item.table_field_MKB_CODE||item.MKB_CODE||item.code||''),
      name:String(item.table_field_MKB_NAME||item.MKB_NAME||item.name||item.title||''),
      parent:String(item.table_field_ID_PARENT||''),
      actual:String(item.table_field_ACTUAL??'')
    })).filter(item=>item.code||item.name);
  }
  function show(items){
    if(!items.length){results.innerHTML='';status.textContent='По этому запросу ничего не найдено. Попробуй другую формулировку или проверь код.';return;}
    status.textContent='Найдено записей: '+items.length+'. Показаны совпадения из российского справочника.';
    results.innerHTML=items.slice(0,100).map(item=>'<article class="icd-result"><div class="icd-result-code">'+esc(item.code||'—')+'</div><div class="icd-result-main"><strong>'+esc(item.name||'Без названия')+'</strong>'+(item.parent?'<small>Родительская запись: '+esc(item.parent)+'</small>':'')+'</div>'+(item.actual==='0'?'<span class="icd-old-tag">Неактуальная запись</span>':'')+'</article>').join('');
  }
  async function search(){
    const query=input.value.trim();
    const current=++sequence;
    if(query.length<2){if(controller)controller.abort();results.innerHTML='';status.textContent='Начни вводить минимум 2 символа.';return;}
    if(controller)controller.abort();
    controller=new AbortController();
    status.textContent='Ищем в российском справочнике…';
    try{
      const response=await fetch(api+'?searchInput='+encodeURIComponent(query),{headers:{Accept:'application/json'},signal:controller.signal});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const payload=await response.json();
      if(current!==sequence)return;
      show(normalize(payload));
    }catch(error){
      if(error.name==='AbortError'||current!==sequence)return;
      results.innerHTML='<div class="icd-api-fallback"><strong>Сервис данных сейчас не ответил.</strong><p>Можно открыть официальный браузер ВОЗ: в нём доступен поиск по коду и названию. Российские формулировки и национальные дополнения могут отличаться.</p><a href="https://icd.who.int/browse10/2019/en" target="_blank" rel="noopener noreferrer">Открыть браузер МКБ-10 ВОЗ '+icon('external',13)+'</a></div>';
      status.textContent='Внешний источник временно недоступен.';
    }
  }
  input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,260);});
  clear.addEventListener('click',()=>{input.value='';results.innerHTML='';status.textContent='Начни вводить минимум 2 символа.';input.focus();});
  document.querySelectorAll('[data-icd-chapter]').forEach(button=>button.addEventListener('click',()=>{
    input.value=button.dataset.icdChapter;
    search();
    input.focus();
  }));
}
const PAGES={overview:{title:'Главная',render:renderOverview},icd:{title:'МКБ-10',render:renderICD}};
function render(){
  const route=routeName(),page=PAGES[route];
  setActiveNav(route);
  breadcrumb.textContent=page.title;
  app.innerHTML=page.render();
  if(route==='icd')bindICD();
  sidebar.classList.remove('open');
  document.title=page.title+' — NeuroDesk';
}
function navigate(route){location.hash=route;}
document.addEventListener('click',event=>{
  const nav=event.target.closest('[data-route]');
  if(nav){event.preventDefault();navigate(nav.dataset.route);}
});
window.addEventListener('hashchange',render);
document.getElementById('mobile-menu').addEventListener('click',()=>sidebar.classList.toggle('open'));
document.getElementById('theme-toggle').addEventListener('click',()=>{
  document.body.classList.toggle('dark');
  const dark=document.body.classList.contains('dark');
  localStorage.setItem('neurodesk-theme',dark?'dark':'light');
  document.getElementById('theme-toggle').innerHTML=icon(dark?'moon':'sun');
});
function applyTheme(){
  const dark=localStorage.getItem('neurodesk-theme')==='dark';
  document.body.classList.toggle('dark',dark);
  document.getElementById('theme-toggle').innerHTML=icon(dark?'moon':'sun');
}
document.querySelectorAll('[data-icon]').forEach(node=>node.innerHTML=icon(node.dataset.icon));
applyTheme();
render();
