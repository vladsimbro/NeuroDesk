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
  return ['icd','exam'].includes(route)?route:'overview';
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
 const chapters=[['I','A00–B99','Некоторые инфекционные и паразитарные болезни','A00-B99'],['II','C00–D48','Новообразования','C00-D48'],['III','D50–D89','Болезни крови и отдельные нарушения иммунитета','D50-D89'],['IV','E00–E90','Болезни эндокринной системы и обмена веществ','E00-E90'],['V','F00–F99','Психические расстройства и расстройства поведения','F00-F99'],['VI','G00–G99','Болезни нервной системы','G00-G99'],['VII','H00–H59','Болезни глаза и его придаточного аппарата','H00-H59'],['VIII','H60–H95','Болезни уха и сосцевидного отростка','H60-H95'],['IX','I00–I99','Болезни системы кровообращения','I00-I99'],['X','J00–J99','Болезни органов дыхания','J00-J99'],['XI','K00–K93','Болезни органов пищеварения','K00-K93'],['XII','L00–L99','Болезни кожи и подкожной клетчатки','L00-L99'],['XIII','M00–M99','Болезни костно-мышечной системы и соединительной ткани','M00-M99'],['XIV','N00–N99','Болезни мочеполовой системы','N00-N99'],['XV','O00–O99','Беременность, роды и послеродовой период','O00-O99'],['XVI','P00–P96','Отдельные состояния перинатального периода','P00-P96'],['XVII','Q00–Q99','Врождённые аномалии, деформации и хромосомные нарушения','Q00-Q99'],['XVIII','R00–R99','Симптомы, признаки и отклонения от нормы','R00-R99'],['XIX','S00–T98','Травмы, отравления и другие последствия воздействия внешних причин','S00-T98'],['XX','U00–U85','Коды для специальных целей','U00-U85'],['XXI','V01–Y98','Внешние причины заболеваемости и смертности','V01-Y98'],['XXII','Z00–Z99','Факторы, влияющие на состояние здоровья и обращения за медицинской помощью','Z00-Z99']];
 return '<div class="page-heading"><div><div class="eyebrow">ПОИСКОВЫЙ КАТАЛОГ</div><h1>Международная классификация болезней · 10-й пересмотр</h1><p class="lead">Полный российский классификатор Минздрава: поиск работает прямо на сайте, без стороннего API.</p></div><span class="date-chip">Версия 2.27 · 15 038 записей</span></div>'+
 '<section class="card card-pad icd-search-card"><label class="icd-search-label" for="icd-query">Что ищем?</label><div class="icd-search-row"><span class="icd-search-icon">'+icon('search',20)+'</span><input id="icd-query" type="search" autocomplete="off" placeholder="Например, G43.1 или мигрень" aria-describedby="icd-search-help"><button id="icd-clear" class="button button-outline" type="button">Очистить</button></div><p id="icd-search-help" class="source-citation">Поиск по всем кодам и названиям. Результаты можно раскрыть полностью, включая неактуальные записи.</p><div class="icd-filter-row"><label><input id="icd-include-inactive" type="checkbox"> Показывать неактуальные записи</label><span id="icd-count-label">15 038 записей в базе</span></div><div id="icd-status" class="icd-status" role="status" aria-live="polite">Начни вводить запрос — поиск по локальной базе уже готов.</div><div id="icd-results" class="icd-results"></div><div id="icd-more-wrap" class="icd-more-wrap"></div></section>'+
 '<section class="icd-chapters-section"><div class="section-head"><div><div class="eyebrow">СТРУКТУРА КЛАССИФИКАЦИИ</div><h2>Классы МКБ-10</h2></div><span class="soft-chip">22 класса</span></div><div class="icd-chapters-grid">'+chapters.map(c=>'<button class="icd-chapter" type="button" data-icd-chapter="'+c[3]+'"><span class="icd-chapter-number">'+c[0]+'</span><span class="icd-chapter-copy"><strong>'+esc(c[2])+'</strong><small>'+c[1]+'</small></span>'+icon('arrow',15)+'</button>').join('')+'</div></section>'+
 '<section class="icd-source-note"><strong>Источник и версия данных</strong><p>Российская МКБ-10, версия 2.27 от 02.09.2024 · OID 1.2.643.5.1.13.13.11.1005. В локальной базе сохранены все 15 038 записей, иерархия, признаки актуальности, дополнительные коды и даты изменений. Поиск не зависит от внешнего API.</p><a href="https://nsi.rosminzdrav.ru/dictionaries/1.2.643.5.1.13.13.11.1005/passport/2.27" target="_blank" rel="noopener noreferrer">Паспорт справочника Минздрава '+icon('external',13)+'</a></section>';
}
function bindICD(){
 const input=document.getElementById('icd-query'),status=document.getElementById('icd-status'),results=document.getElementById('icd-results'),clear=document.getElementById('icd-clear'),includeInactive=document.getElementById('icd-include-inactive'),moreWrap=document.getElementById('icd-more-wrap'),countLabel=document.getElementById('icd-count-label');
 const DATA_URL=new URL('../data/icd10-v2.27.json',import.meta.url).href,PAGE_SIZE=100;
 let timer=null,allRecords=[],byId=new Map(),lastMatches=[],visibleCount=PAGE_SIZE,chapterRange='',dataPromise=null;
 const normalize=v=>String(v??'').normalize('NFKC').toLocaleLowerCase('ru-RU').replace(/ё/g,'е').match(/[\p{L}\p{N}]+/gu)?.join(' ')||'';
 const normalizeCode=v=>String(v??'').toUpperCase().replace(/[^A-ZА-Я0-9.]/g,'');
 async function loadData(){
  if(allRecords.length)return allRecords;
  if(dataPromise)return dataPromise;
  status.textContent='Загружаем локальную базу МКБ-10…';
  dataPromise=(async()=>{
   const response=await fetch(DATA_URL,{cache:'no-cache'});
   if(!response.ok)throw new Error('Не удалось загрузить локальную базу: HTTP '+response.status+' ('+DATA_URL+')');
   const payload=await response.json();
   if(payload.version!=='2.27'||payload.records?.length!==15038)throw new Error('Контроль целостности базы не пройден: ожидалось 15 038 записей версии 2.27.');
   allRecords=payload.records.map(r=>({id:r[0],recCode:r[1],code:r[2],name:r[3],parentId:r[4],addlCode:r[5],actual:r[6],date:r[7]}));
   byId=new Map(allRecords.map(x=>[x.id,x]));
   countLabel.textContent=allRecords.length.toLocaleString('ru-RU')+' записей в базе';
   status.textContent='База загружена: '+allRecords.length.toLocaleString('ru-RU')+' записей. Введи хотя бы одну букву или код.';
   return allRecords;
  })();
  try{return await dataPromise;}catch(error){dataPromise=null;throw error;}
 }
 function score(item,nq,cq){const code=normalizeCode(item.code),name=normalize(item.name);if(cq&&code===cq)return 0;if(cq&&code.startsWith(cq))return 1;if(cq&&code.includes(cq))return 2;if(name===nq)return 3;if(name.startsWith(nq))return 4;const i=name.indexOf(nq);return i>=0?5+i/1000:99;}
 function renderResults(){const q=input.value.trim(),nq=normalize(q),cq=normalizeCode(q),visible=lastMatches.slice(0,visibleCount);if(!q&&!chapterRange){results.innerHTML='';moreWrap.innerHTML='';status.textContent='Начни вводить запрос или выбери класс ниже.';return;}if(!lastMatches.length){results.innerHTML='<div class="icd-empty"><strong>Совпадений не найдено</strong><span>Попробуй другой код или формулировку.</span></div>';moreWrap.innerHTML='';status.textContent='Ничего не найдено.';return;}status.textContent='Найдено: '+lastMatches.length.toLocaleString('ru-RU')+'. Показано: '+visible.length.toLocaleString('ru-RU')+'.';results.innerHTML=visible.map(item=>{const parent=byId.get(item.parentId),addl=item.addlCode==='1'?'<span class="icd-addl-tag">Доп. код +</span>':item.addlCode==='2'?'<span class="icd-addl-tag">Доп. код *</span>':'',old=item.actual==='0'?'<span class="icd-old-tag">Неактуальная запись</span>':'';return '<article class="icd-result"><div class="icd-result-code">'+esc(item.code||'—')+'</div><div class="icd-result-main"><strong>'+esc(item.name||'Без названия')+'</strong><small>'+(parent?'Раздел: '+esc(parent.name):'Классификатор МКБ-10')+(item.date?' · дата изменения: '+esc(item.date):'')+'</small></div><div class="icd-result-tags">'+addl+old+'</div></article>';}).join('');moreWrap.innerHTML=visibleCount<lastMatches.length?'<button class="button button-outline icd-more-button" id="icd-more" type="button">Показать ещё '+Math.min(PAGE_SIZE,lastMatches.length-visibleCount)+' · осталось '+(lastMatches.length-visibleCount).toLocaleString('ru-RU')+'</button>':'';const more=document.getElementById('icd-more');if(more)more.addEventListener('click',()=>{visibleCount+=PAGE_SIZE;renderResults();});}
 async function search(){const query=input.value.trim();chapterRange='';if(!query){lastMatches=[];renderResults();return;}try{await loadData();const nq=normalize(query),cq=normalizeCode(query),includeOld=includeInactive.checked;const tokens=nq.split(' ').filter(Boolean);lastMatches=allRecords.filter(x=>{if(!includeOld&&x.actual==='0')return false;const name=normalize(x.name),rec=normalize(x.recCode),code=normalizeCode(x.code);return (tokens.length>0&&tokens.every(token=>name.includes(token)||rec.includes(token)))||(!!cq&&code.includes(cq));});lastMatches.sort((a,b)=>score(a,nq,cq)-score(b,nq,cq)||a.code.localeCompare(b.code,'en',{numeric:true}));visibleCount=PAGE_SIZE;renderResults();}catch(error){results.innerHTML='<div class="icd-api-fallback"><strong>Не удалось загрузить локальный справочник.</strong><p>'+esc(error.message)+'</p><a href="https://nsi.rosminzdrav.ru/dictionaries/1.2.643.5.1.13.13.11.1005/passport/2.27" target="_blank" rel="noopener noreferrer">Открыть официальный паспорт '+icon('external',13)+'</a></div>';status.textContent='Ошибка загрузки данных. Проверь подключение и обнови страницу.';}}
 function runChapter(range){chapterRange=range;input.value=range.split('-')[0];loadData().then(()=>{const [start,end]=range.split('-'),includeOld=includeInactive.checked;lastMatches=allRecords.filter(x=>{const key=normalizeCode(x.code).replace('.','').slice(0,3);return(includeOld||x.actual!=='0')&&key>=start&&key<=end;});lastMatches.sort((a,b)=>a.code.localeCompare(b.code,'en',{numeric:true}));visibleCount=PAGE_SIZE;renderResults();document.querySelector('.icd-search-card').scrollIntoView({behavior:'smooth',block:'start'});}).catch(e=>{status.textContent=e.message;});}
 input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,180);});clear.addEventListener('click',()=>{input.value='';chapterRange='';lastMatches=[];renderResults();input.focus();});includeInactive.addEventListener('change',()=>{if(chapterRange)runChapter(chapterRange);else if(input.value.trim())search();});document.querySelectorAll('[data-icd-chapter]').forEach(b=>b.addEventListener('click',()=>runChapter(b.dataset.icdChapter)));
 loadData().catch(error=>{status.textContent='Ошибка загрузки базы: '+error.message;results.innerHTML='<div class="icd-api-fallback"><strong>База не загрузилась.</strong><p>'+esc(error.message)+'</p><button class="button button-outline" id="icd-retry" type="button">Повторить загрузку</button></div>';document.getElementById('icd-retry')?.addEventListener('click',()=>{dataPromise=null;loadData().catch(e=>{status.textContent=e.message;});});});
}

function renderExam(){
 const muscleRows=[['Плечевой пояс','Отведение плеча'],['Локоть','Сгибание / разгибание'],['Кисть','Разгибание кисти'],['Пальцы','Сгибание пальцев'],['Тазобедренный сустав','Сгибание бедра'],['Колено','Разгибание голени'],['Стопа','Тыльное сгибание'],['Большой палец стопы','Разгибание']];
 const reflexRows=[['Бицепсовый','C5–C6'],['Карпорадиальный','C5–C6'],['Трицепсовый','C7–C8'],['Коленный','L3–L4'],['Ахиллов','S1–S2']];
 const options=(values,selected='')=>'<option value="">Не оценено</option>'+values.map(v=>'<option value="'+v+'" '+(selected===v?'selected':'')+'>'+v+'</option>').join('');
 const sideSelect=(name,label)=>'<label class="exam-field"><span>'+label+'</span><select name="'+name+'">'+options(['0','1','2','3','4','5'])+'</select></label>';
 const pairedRows=(rows,type)=>rows.map((r,i)=>'<div class="exam-measure-row"><div class="exam-measure-name"><strong>'+r[0]+'</strong><small>'+r[1]+'</small></div>'+sideSelect(type+'-'+i+'-right','Справа')+sideSelect(type+'-'+i+'-left','Слева')+'</div>').join('');
 return '<div class="page-heading"><div><div class="eyebrow">ЛОКАЛЬНЫЙ ИНСТРУМЕНТ</div><h1>Неврологический осмотр</h1><p class="lead">Структурированный черновик осмотра с оценкой мышечной силы и рефлексов. Данные сохраняются только в этом браузере.</p></div><span class="date-chip">Локально · без отправки</span></div>'+
 '<div class="exam-layout"><form id="exam-form" class="exam-form" autocomplete="off">'+
 '<section class="card card-pad exam-section"><div class="exam-section-head"><div><div class="eyebrow">01 · КОНТЕКСТ</div><h2>Общие сведения</h2></div><span class="soft-chip">Черновик</span></div><div class="exam-grid"><label class="exam-field"><span>Идентификатор / инициалы</span><input name="patient" maxlength="80" placeholder="Необязательно"></label><label class="exam-field"><span>Дата осмотра</span><input name="date" type="date"></label><label class="exam-field exam-wide"><span>Жалобы</span><textarea name="complaints" rows="2" placeholder="Со слов пациента…"></textarea></label><label class="exam-field exam-wide"><span>Анамнез и важные обстоятельства</span><textarea name="history" rows="3" placeholder="Начало, динамика, сопутствующие обстоятельства…"></textarea></label></div></section>'+
 '<section class="card card-pad exam-section"><div class="exam-section-head"><div><div class="eyebrow">02 · ОБЩИЙ СТАТУС</div><h2>Сознание и черепные нервы</h2></div></div><div class="exam-grid"><label class="exam-field"><span>Сознание</span><select name="consciousness">'+options(['Ясное','Оглушение','Сопор','Кома','Другое'])+'</select></label><label class="exam-field"><span>Ориентировка</span><select name="orientation">'+options(['Сохранена','Нарушена во времени','Нарушена в месте','Нарушена в собственной личности','Не оценена'])+'</select></label><label class="exam-field exam-wide"><span>Черепные нервы (I–XII)</span><textarea name="cranial" rows="3" placeholder="Зрачки, движения глаз, лицо, слух, глотание, язык и другие проверенные функции…"></textarea></label></div></section>'+
 '<section class="card card-pad exam-section"><div class="exam-section-head"><div><div class="eyebrow">03 · ДВИГАТЕЛЬНАЯ СИСТЕМА</div><h2>Мышечная сила</h2></div><span class="soft-chip">MRC · 0–5</span></div><p class="exam-note">Оценивай каждую сторону отдельно. Пустое значение означает, что показатель не оценивался; оно не приравнивается к нулю.</p><div class="exam-measure-head"><span>Группа мышц / движение</span><span>Справа</span><span>Слева</span></div><div class="exam-measures">'+pairedRows(muscleRows,'muscle')+'</div><div class="exam-grid exam-grid-top"><label class="exam-field"><span>Мышечный тонус</span><select name="tone">'+options(['Не изменён','Гипотония','Спастичность','Ригидность','Дистония','Смешанные изменения','Не оценён'])+'</select></label><label class="exam-field"><span>Атрофии / фасцикуляции</span><input name="atrophy" placeholder="Нет / локализация / описание"></label><label class="exam-field exam-wide"><span>Дополнительные двигательные наблюдения</span><textarea name="motorNotes" rows="2" placeholder="Парезы, патологические установки, непроизвольные движения…"></textarea></label></div></section>'+
 '<section class="card card-pad exam-section"><div class="exam-section-head"><div><div class="eyebrow">04 · РЕФЛЕКСЫ</div><h2>Сухожильные рефлексы</h2></div></div><p class="exam-note">Шкала условная: 0 — отсутствует, 1 — снижен, 2 — обычный, 3 — оживлён, 4 — резко повышен / клонус. Учитывай принятую в учреждении шкалу.</p><div class="exam-measure-head"><span>Рефлекс / сегменты</span><span>Справа</span><span>Слева</span></div><div class="exam-measures">'+pairedRows(reflexRows,'reflex')+'</div><div class="exam-grid exam-grid-top"><label class="exam-field"><span>Патологические стопные знаки</span><input name="pathological" placeholder="Бабинский, Оппенгейм и др."></label><label class="exam-field"><span>Клонусы</span><select name="clonus">'+options(['Не выявлены','Справа','Слева','С обеих сторон','Не оценены'])+'</select></label></div></section>'+
 '<section class="card card-pad exam-section"><div class="exam-section-head"><div><div class="eyebrow">05 · ЧУВСТВИТЕЛЬНОСТЬ И КООРДИНАЦИЯ</div><h2>Чувствительность, координация, походка</h2></div></div><div class="exam-grid"><label class="exam-field exam-wide"><span>Чувствительность</span><textarea name="sensation" rows="3" placeholder="Поверхностная, глубокая, распределение нарушений, сторона и уровень…"></textarea></label><label class="exam-field exam-wide"><span>Координаторные пробы</span><textarea name="coordination" rows="2" placeholder="Пальценосовая, пяточно-коленная, диадохокинез…"></textarea></label><label class="exam-field"><span>Походка</span><select name="gait">'+options(['Не нарушена','Паретическая','Атактическая','Спастическая','Проблемы равновесия','Не оценена','Другое'])+'</select></label><label class="exam-field"><span>Менингеальные симптомы</span><select name="meningeal">'+options(['Отрицательные','Положительные','Не оценены'])+'</select></label><label class="exam-field exam-wide"><span>Дополнительные данные</span><textarea name="additional" rows="2" placeholder="Речь, высшие корковые функции, вегетативные проявления и прочее…"></textarea></label></div></section>'+
 '<section class="card card-pad exam-section"><div class="exam-section-head"><div><div class="eyebrow">06 · ИТОГ</div><h2>Заключение осмотра</h2></div></div><div class="exam-grid"><label class="exam-field exam-wide"><span>Заключение / неврологический статус</span><textarea name="conclusion" rows="4" placeholder="Сформулируй вывод самостоятельно на основании проведённого осмотра…"></textarea></label><label class="exam-field exam-wide"><span>План / комментарии</span><textarea name="plan" rows="3" placeholder="Дополнительные исследования, наблюдение и другие пункты плана…"></textarea></label></div><p class="exam-note exam-warning">Инструмент формирует черновик документации, а не диагноз и не медицинское заключение. Проверяй каждое поле перед использованием.</p></section>'+
 '<div class="exam-actions"><button class="button button-primary" type="button" id="exam-copy">Копировать протокол</button><button class="button button-outline" type="button" id="exam-download">Скачать TXT</button><button class="button button-outline" type="button" id="exam-print">Печать / PDF</button><button class="button button-ghost" type="button" id="exam-reset">Очистить форму</button><span id="exam-save-status" class="exam-save-status" role="status">Автосохранение включено</span></div></form>'+
 '<aside class="exam-preview card card-pad"><div class="eyebrow">ПРЕДПРОСМОТР</div><h2>Протокол осмотра</h2><p class="exam-preview-hint">Текст обновляется по мере заполнения формы.</p><pre id="exam-preview-text"></pre></aside></div>';
}
function bindExam(){
 const form=document.getElementById('exam-form'),preview=document.getElementById('exam-preview-text'),saveStatus=document.getElementById('exam-save-status'),storageKey='neurodesk-exam-draft-v1';
 const muscleRows=['Плечевой пояс','Локоть','Кисть','Пальцы','Тазобедренный сустав','Колено','Стопа','Большой палец стопы'];
 const reflexRows=['Бицепсовый','Карпорадиальный','Трицепсовый','Коленный','Ахиллов'];
 const read=()=>Object.fromEntries(new FormData(form).entries());
 const format=()=>{const d=read(),lines=['ПРОТОКОЛ НЕВРОЛОГИЧЕСКОГО ОСМОТРА','Дата: '+(d.date||'не указана'),'Идентификатор: '+(d.patient||'не указан'),'','Жалобы: '+(d.complaints||'не заполнено'),'Анамнез: '+(d.history||'не заполнено'),'','Сознание: '+(d.consciousness||'не оценено'),'Ориентировка: '+(d.orientation||'не оценена'),'Черепные нервы: '+(d.cranial||'не заполнено'),'','МЫШЕЧНАЯ СИЛА (MRC)'];muscleRows.forEach((n,i)=>{const r=d['muscle-'+i+'-right'],l=d['muscle-'+i+'-left'];if(r||l)lines.push(n+': справа '+(r||'не оценено')+', слева '+(l||'не оценено'));});lines.push('Мышечный тонус: '+(d.tone||'не оценён'),'Атрофии / фасцикуляции: '+(d.atrophy||'не заполнено'),'Дополнительные двигательные наблюдения: '+(d.motorNotes||'не заполнено'),'','СУХОЖИЛЬНЫЕ РЕФЛЕКСЫ');reflexRows.forEach((n,i)=>{const r=d['reflex-'+i+'-right'],l=d['reflex-'+i+'-left'];if(r||l)lines.push(n+': справа '+(r||'не оценено')+', слева '+(l||'не оценено'));});lines.push('Патологические стопные знаки: '+(d.pathological||'не заполнено'),'Клонусы: '+(d.clonus||'не оценены'),'','Чувствительность: '+(d.sensation||'не заполнено'),'Координация: '+(d.coordination||'не заполнено'),'Походка: '+(d.gait||'не оценена'),'Менингеальные симптомы: '+(d.meningeal||'не оценены'),'Дополнительные данные: '+(d.additional||'не заполнено'),'','Заключение: '+(d.conclusion||'не заполнено'),'План / комментарии: '+(d.plan||'не заполнено'),'','Черновик сформирован NeuroDesk. Требует проверки врачом.');return lines.join('\n');};
 let saveTimer=null;
 function update(){preview.textContent=format();clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem(storageKey,JSON.stringify(read()));saveStatus.textContent='Сохранено локально · '+new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});}catch(e){saveStatus.textContent='Не удалось сохранить: память браузера недоступна.';}},250);}
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&typeof saved==='object')for(const [key,value] of Object.entries(saved)){const field=form.elements.namedItem(key);if(field&&typeof value==='string')field.value=value;}}catch(e){saveStatus.textContent='Не удалось восстановить черновик.';}
 if(!form.elements.date.value)form.elements.date.value=new Date().toISOString().slice(0,10);
 form.addEventListener('input',update);form.addEventListener('change',update);update();
 document.getElementById('exam-copy').addEventListener('click',async()=>{const text=format();try{await navigator.clipboard.writeText(text);saveStatus.textContent='Протокол скопирован.';}catch(e){const area=document.createElement('textarea');area.value=text;document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();saveStatus.textContent=ok?'Протокол скопирован.':'Не удалось скопировать — используй скачивание TXT.';}});
 document.getElementById('exam-download').addEventListener('click',()=>{const blob=new Blob(['\ufeff'+format()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='neurodesk-exam-'+(form.elements.date.value||'draft')+'.txt';a.click();URL.revokeObjectURL(url);});
 document.getElementById('exam-print').addEventListener('click',()=>window.print());
 document.getElementById('exam-reset').addEventListener('click',()=>{if(!confirm('Очистить все поля и сохранённый черновик?'))return;form.reset();form.elements.date.value=new Date().toISOString().slice(0,10);localStorage.removeItem(storageKey);update();saveStatus.textContent='Форма очищена.';});
}

const PAGES={overview:{title:'Главная',render:renderOverview},icd:{title:'МКБ-10',render:renderICD},exam:{title:'Осмотр',render:renderExam}};
function render(){
  const route=routeName(),page=PAGES[route];
  setActiveNav(route);
  breadcrumb.textContent=page.title;
  app.innerHTML=page.render();
  if(route==='icd')bindICD();
  if(route==='exam')bindExam();
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
