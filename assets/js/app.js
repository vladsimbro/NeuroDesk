import { GCS_COMPONENTS, calculateGCS, formatGCSResult, MRS_OPTIONS, GOS_OPTIONS, RASS_OPTIONS, calculateMRS, calculateGOS, calculateRASS, calculateBMI, calculateBSA, calculateMAP, calculateABCD2 } from './calculators.js';
import { officialResources, scaleCatalog } from './resources.js';
import { initBrainScene, disposeBrainScene } from './brain-scene.js';

const app = document.getElementById('app-content');
const breadcrumb = document.getElementById('breadcrumb-current');
const sidebar = document.getElementById('sidebar');
const searchInput = document.getElementById('global-search-input');
const searchPopover = document.getElementById('search-popover');

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',
  calculator: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6h8M8 11h1m3 0h1m3 0h.01M8 15h1m3 0h1m3 0h.01M8 19h1m3 0h1m3 0h.01"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5z"/><path d="M4 4.5v18M8 6h8M8 10h7"/>',
  brain: '<path d="M12 18V5.5a3.5 3.5 0 0 0-6.8-.9A4 4 0 0 0 4 12.1a4 4 0 0 0 2 6.9A3.5 3.5 0 0 0 12 18Z"/><path d="M12 18V5.5a3.5 3.5 0 0 1 6.8-.9A4 4 0 0 1 20 12.1a4 4 0 0 1-2 6.9A3.5 3.5 0 0 1 12 18ZM8 8.5c1.6 0 2.3 1 2.3 2.2M6.5 14.5c1.4-.3 2.3.3 2.8 1.5m6.7-7.5c-1.6 0-2.3 1-2.3 2.2m4.8 3.8c-1.4-.3-2.3.3-2.8 1.5"/>',
  pill: '<path d="m10.5 20.5 10-10a5.7 5.7 0 0 0-8-8l-10 10a5.7 5.7 0 0 0 8 8Z"/><path d="m8 8 8 8"/>',
  scan: '<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M8 12h8M12 8v8"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  'shield-check': '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  landmark: '<path d="m3 9 9-6 9 6M4 10h16M5 10v9m4-9v9m6-9v9m4-9v9M3 21h18"/>',
  library: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 6h8"/>',
  'file-check': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6m-11 5 2 2 4-4"/>',
  clipboard: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6m-6 4h6m-6 4h3"/>',
  sliders: '<path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M2 14h4m4-6h4m4 8h4"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9h18m-14 4h3m-3 4h6"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  moon: '<path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  external: '<path d="M14 3h7v7m-11 4L21 3"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 11v5m0-8h.01"/>'
};
function icon(name, size = 18) {
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.info) + '</svg>';
}
function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function routeName() {
  const value = (location.hash || '#overview').slice(1);
  return ['overview','calculators','handbook','anatomy','pharmacology','diagnostics','quality'].includes(value) ? value : 'overview';
}
function setActiveNav(route) {
  document.querySelectorAll('[data-route]').forEach((item) => item.classList.toggle('active', item.dataset.route === route));
}
function heading(kicker, title, description, right = '') {
  return '<div class="page-heading"><div><div class="eyebrow">' + kicker + '</div><h1>' + title + '</h1><p class="lead">' + description + '</p></div>' + right + '</div>';
}
function statusChip(status, label) {
  return '<span class="status-chip ' + (status === 'ready' ? 'ready' : 'review') + '">' + label + '</span>';
}
function resourceCard(item) {
  return '<article class="card resource-card"><div class="resource-mark">' + icon(item.icon) + '</div><div class="resource-card-copy"><div class="eyebrow">' + esc(item.category) + '</div><h3>' + esc(item.title) + '</h3><p>' + esc(item.description) + '</p><a href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">Открыть официальный ресурс ' + icon('external', 13) + '</a></div></article>';
}
function metricCard(ic, color, value, label) {
  return '<div class="metric-card"><div class="metric-icon ' + color + '">' + icon(ic) + '</div><div><div class="metric-value">' + value + '</div><div class="metric-label">' + label + '</div></div></div>';
}

function renderOverview() {
  const date = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  return '<div class="page-heading"><div><div class="eyebrow">ЦИФРОВОЕ РАБОЧЕЕ ПРОСТРАНСТВО</div><h1>Рабочий стол невролога</h1><p class="lead">Инструменты, справочные материалы и проверяемые источники — в одном пространстве.</p></div><span class="date-chip">' + icon('calendar', 14) + esc(date) + '</span></div>' +
    '<section class="hero-panel"><div class="hero-copy"><div class="hero-kicker"><span class="pulse"></span> NEURODESK · РАННЯЯ ВЕРСИЯ</div><h1>Клиническая ясность начинается с точных данных.</h1><p>Рабочая среда для невролога с фокусом на российские клинические источники, воспроизводимые расчёты и профессиональные визуализации.</p><div class="hero-actions"><a class="button button-primary" href="#calculators">Открыть калькуляторы ' + icon('arrow', 14) + '</a><a class="button button-glass" href="#handbook">Перейти к справочнику</a></div></div><div class="hero-visual"><canvas id="brain-canvas" aria-label="Демонстрационная трёхмерная модель"></canvas><span class="visual-caption">3D · демонстрационная модель</span></div></section>' +
    '<div class="metric-grid">' + metricCard('calculator', '', '08', 'Расчётных инструментов') + metricCard('book', 'blue', '15', 'Источников и справочников') + metricCard('brain', 'amber', '3D', 'Интерактивная визуализация') + metricCard('shield', 'navy', '0', 'Пациентских данных хранится') + '</div>' +
    '<div class="content-grid"><section class="card card-pad"><div class="section-head"><h2>Быстрый доступ</h2><a class="text-link" href="#calculators">Все инструменты →</a></div><div class="tool-list">' +
    '<a class="tool-row" href="#calculators"><span class="metric-icon">' + icon('activity') + '</span><span class="tool-row-copy"><strong>Шкала комы Глазго (GCS)</strong><small>Компонентная оценка E / V / M с обработкой NT</small></span><span class="tool-arrow">' + icon('arrow') + '</span></a>' +
    '<a class="tool-row" href="#handbook"><span class="metric-icon blue">' + icon('file-check') + '</span><span class="tool-row-copy"><strong>Клинические рекомендации</strong><small>Официальный рубрикатор Минздрава РФ</small></span><span class="tool-arrow">' + icon('arrow') + '</span></a>' +
    '<a class="tool-row" href="#anatomy"><span class="metric-icon amber">' + icon('brain') + '</span><span class="tool-row-copy"><strong>3D-анатомия</strong><small>Интерактивная демонстрационная модель</small></span><span class="tool-arrow">' + icon('arrow') + '</span></a>' +
    '</div></section><section class="card card-pad"><div class="section-head"><h2>Проверенные источники</h2><a class="text-link" href="#handbook">Справочник →</a></div><div class="resource-list">' +
    officialResources.slice(0,4).map((item) => '<a class="resource-row" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer"><span class="resource-mark">' + icon(item.icon) + '</span><span><strong>' + esc(item.title) + '</strong><small>' + esc(item.domain) + '</small></span></a>').join('') +
    '</div></section></div><div class="notice warning" style="margin-top:17px">' + icon('info') + '<div><strong>О назначении платформы.</strong> NeuroDesk — справочный и расчётный инструмент, а не система постановки диагноза или назначения лечения. Клиническое решение принимает медицинский специалист с учётом полной картины пациента и действующих документов.</div></div>';
}

function renderGCSCalculator() {
  const groups = Object.entries(GCS_COMPONENTS).map(([key, component]) => {
    const options = component.options.map((option) => '<button type="button" class="scale-option" data-gcs-key="' + key + '" data-gcs-value="' + option.value + '" aria-pressed="false"><span class="option-score">' + option.value + '</span><span>' + esc(option.label) + '</span></button>').join('');
    const nt = '<button type="button" class="scale-option nt-option" data-gcs-key="' + key + '" data-gcs-value="NT" aria-pressed="false"><span class="option-score">NT</span><span>Компонент не поддаётся оценке</span></button>';
    return '<div class="scale-group" data-gcs-group="' + key + '"><div class="scale-head"><strong>' + component.short + ' · ' + component.label + '</strong><span>макс. ' + component.max + '</span></div><div class="scale-options">' + options + nt + '</div></div>';
  }).join('');
  return '<div class="calculator-layout"><section class="card calc-card"><div class="calc-title"><div class="metric-icon">' + icon('activity',21) + '</div><div><h2>Шкала комы Глазго</h2><p>Glasgow Coma Scale · взрослая версия · три независимых компонента</p></div></div><hr class="calc-divider"><div class="notice" style="margin-bottom:18px">' + icon('info') + '<div>Оценивай наилучшую наблюдаемую реакцию по стандартизированному подходу. До оценки учитывай факторы, которые могут повлиять на ответ. Не подменяй наблюдение предположением.</div></div>' + groups + '<div class="calc-actions"><button class="button button-outline" type="button" data-gcs-reset>' + icon('refresh',14) + ' Сбросить</button><button class="button button-primary" type="button" data-gcs-copy disabled>' + icon('clipboard',14) + ' Скопировать результат</button></div></section>' +
    '<aside class="card result-card" id="gcs-result" aria-live="polite"><div class="result-top"><span class="result-label">РЕЗУЛЬТАТ ОЦЕНКИ</span><span class="result-state">Не завершено</span></div><p class="result-empty">Выбери по одному варианту в каждом компоненте. Сумма появится только если все три компонента поддаются оценке.</p><div class="source-citation">Методика: <a href="https://cr.minzdrav.gov.ru/preview-cr/814_1" target="_blank" rel="noopener noreferrer">КР Минздрава РФ, ID 814_1, приложение Г9 ↗</a>. Русскоязычная адаптация: Пирадов М.А. и соавт., 2021, <a href="https://doi.org/10.23934/2223-9022-2021-10-1-91-99" target="_blank" rel="noopener noreferrer">DOI ↗</a>.</div></aside></div>';
}
function renderScaleCard(id,title,subtitle,options,sourceUrl,sourceLabel,note){
 const choices=options.map(o=>'<button type="button" class="scale-option" data-scale-id="'+id+'" data-scale-value="'+o.value+'" aria-pressed="false"><span class="option-score">'+(o.value>0?'+':'')+o.value+'</span><span><strong>'+esc(o.label)+'</strong><small>'+esc(o.detail)+'</small></span></button>').join('');
 return '<section class="card calc-card scale-tool" id="tool-'+id+'"><div class="calc-title"><div class="metric-icon">'+icon(id==='rass'?'activity':'clipboard',21)+'</div><div><h2>'+title+'</h2><p>'+subtitle+'</p></div></div><p class="scale-tool-note">'+note+'</p><div class="scale-options scale-tool-options">'+choices+'</div><div class="scale-tool-footer"><button type="button" class="button button-outline" data-scale-reset="'+id+'">'+icon('refresh',14)+' Сбросить</button><button type="button" class="button button-primary" data-scale-copy="'+id+'" disabled>'+icon('clipboard',14)+' Скопировать</button></div><div class="scale-tool-result" id="result-'+id+'" aria-live="polite"><span>Выбери один вариант для расчёта.</span></div><div class="source-citation">Источник методики: <a href="'+sourceUrl+'" target="_blank" rel="noopener noreferrer">'+sourceLabel+' ↗</a>. Перед клиническим применением проверь актуальную редакцию документа и локальные протоколы.</div></section>';
}
function renderCalculatorCatalog(){
 return heading('ИНСТРУМЕНТЫ','Клинические калькуляторы и шкалы','Интерактивные инструменты для оценки сознания, функционального исхода и неврологического статуса. У каждой шкалы указаны источник и ограничения.')+
 '<div class="notice warning" style="margin-bottom:17px">'+icon('info')+'<div><strong>Статус медицинской проверки.</strong> «Технически реализована» означает, что интерфейс и автоматические тесты работают. Это не означает независимую медицинскую валидацию. До такой проверки результаты следует сверять с первоисточником.</div></div>'+
 '<div class="page-toolbar calculator-toolbar"><input class="filter-input" id="calculator-filter" type="search" placeholder="Найти шкалу или инструмент…" aria-label="Поиск по калькуляторам"><span class="soft-chip">8 интерактивных инструментов</span></div>'+
 '<div class="catalog-grid" id="calculator-grid">'+scaleCatalog.map(item=>'<article class="catalog-card" data-calculator-card="'+item.id+'"><div class="metric-icon">'+icon(item.icon)+'</div><div class="catalog-card-copy"><div class="eyebrow">'+esc(item.group||'Шкалы')+'</div><h3>'+esc(item.title)+'</h3><p>'+esc(item.description)+'</p>'+statusChip(item.status,item.label)+(item.status==='ready'?'<br><button type="button" class="text-link" data-open-tool="'+item.id+'">Открыть инструмент ↓</button>':'')+'</div></article>').join('')+'</div>'+
 '<div id="gcs" style="margin-top:23px">'+renderGCSCalculator()+'</div><div class="scale-tools-stack">'+
 renderScaleCard('rass','Шкала возбуждения-седации Ричмонда (RASS)','Richmond Agitation-Sedation Scale · диапазон от +4 до −5',RASS_OPTIONS,'https://cr.minzdrav.gov.ru/preview-cr/814_1','КР Минздрава РФ · ID 814_1, приложение Г5','Оцени последовательно: наблюдение за пациентом, ответ на голос, затем при отсутствии реакции на голос — ответ на физическую стимуляцию. Выбирай только фактически наблюдавшуюся реакцию.')+
 renderScaleCard('mrs','Модифицированная шкала Рэнкина (mRS)','Modified Rankin Scale · функциональная независимость',MRS_OPTIONS,'https://cr.minzdrav.gov.ru/preview-cr/814_1','КР Минздрава РФ · ID 814_1, приложение Г7','Оценивается общий уровень функциональной независимости и потребность в помощи. Для сопоставимых оценок используй единый подход к интервью и учитывай преморбидный уровень.')+
 renderScaleCard('gos','Шкала исходов Глазго (GOS)','Glasgow Outcome Scale · исход повреждения головного мозга',GOS_OPTIONS,'https://cr.minzdrav.gov.ru/view-cr/732_1','КР 732_1 · приложение Г6; актуальность документа не подтверждена','Пятиуровневая шкала исходов. Источник в КР 732_1 (2022) имеет срок пересмотра не позднее 2024 года; актуальность документа не подтверждена. Не использовать как актуальную нормативную версию без повторной проверки.')+
 '</div>'+renderAdditionalCalculators();
}
function renderAdditionalCalculators(){
 return '<div class="utility-calculator-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));gap:16px;margin-top:18px">'+
 '<section class="card calc-card" id="abcd2-tool" data-calculator-card="abcd2"><div class="calc-title"><div class="metric-icon">'+icon('activity',21)+'</div><div><h2>ABCD²</h2><p>Оценка риска инсульта после ТИА · 0–7 баллов</p></div></div><p class="scale-tool-note">Заполняй по клинической картине эпизода, расценённого как ТИА. Шкала не исключает инсульт при низком балле и не должна быть единственным основанием для маршрутизации или отсрочки обследования.</p><div class="form-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px"><label>Возраст, лет<input class="filter-input" type="number" min="0" max="120" id="abcd-age"></label><label>САД, мм рт. ст.<input class="filter-input" type="number" min="50" max="300" id="abcd-sbp"></label><label>ДАД, мм рт. ст.<input class="filter-input" type="number" min="30" max="200" id="abcd-dbp"></label><label>Клинические признаки<select class="filter-input" id="abcd-features"><option value="">Выбрать…</option><option value="unilateral_weakness">Односторонняя слабость</option><option value="speech_without_weakness">Нарушение речи без слабости</option><option value="other">Другие симптомы</option></select></label><label>Длительность симптомов<select class="filter-input" id="abcd-duration"><option value="">Выбрать…</option><option value="lt10">Менее 10 минут</option><option value="10to59">10–59 минут</option><option value="ge60">60 минут и более</option></select></label><label>Сахарный диабет<select class="filter-input" id="abcd-diabetes"><option value="">Выбрать…</option><option value="yes">Да</option><option value="no">Нет</option></select></label></div><div class="scale-tool-footer"><button class="button button-outline" type="button" data-reset-abcd>Сбросить</button><span class="soft-chip" id="abcd-result" aria-live="polite">Заполни все поля</span></div><div class="source-citation">Источник: Johnston SC et al. Lancet. 2007;369:283–292. <a href="https://pubmed.ncbi.nlm.nih.gov/17258668/" target="_blank" rel="noopener noreferrer">PubMed · PMID 17258668 ↗</a>. Клинические рекомендации РФ по ишемическому инсульту/ТИА: <a href="https://cr.minzdrav.gov.ru/preview-cr/814_1" target="_blank" rel="noopener noreferrer">ID 814_1 ↗</a>. Результат не заменяет срочную клиническую оценку.</div></section>'+
 '<section class="card calc-card" data-calculator-card="anthropometry"><div class="calc-title"><div class="metric-icon">'+icon('sliders',21)+'</div><div><h2>Антропометрические расчёты</h2><p>ИМТ и площадь поверхности тела</p></div></div><div class="form-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px"><label>Рост, см<input class="filter-input" type="number" min="50" max="250" step="0.1" id="body-height"></label><label>Масса, кг<input class="filter-input" type="number" min="1" max="500" step="0.1" id="body-weight"></label></div><div class="scale-tool-result" id="body-result" aria-live="polite">Введи рост и массу тела.</div><div class="source-citation">ИМТ = масса (кг) / рост² (м). ИМТ — скрининговый показатель, не диагностирует нутритивное состояние сам по себе. ППТ: формула Mosteller, Mosteller RD. N Engl J Med. 1987;317:1098. <a href="https://pubmed.ncbi.nlm.nih.gov/3657876/" target="_blank" rel="noopener noreferrer">PubMed ↗</a>.</div></section>'+
 '<section class="card calc-card" data-calculator-card="map"><div class="calc-title"><div class="metric-icon">'+icon('activity',21)+'</div><div><h2>Среднее АД (MAP)</h2><p>Приближённая оценка по САД и ДАД</p></div></div><div class="form-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px"><label>САД, мм рт. ст.<input class="filter-input" type="number" min="50" max="350" id="map-sbp"></label><label>ДАД, мм рт. ст.<input class="filter-input" type="number" min="30" max="250" id="map-dbp"></label></div><div class="scale-tool-result" id="map-result" aria-live="polite">Введи оба значения АД.</div><div class="source-citation">Расчётная формула: ДАД + (САД − ДАД) / 3. Приближение для обычной частоты сердечных сокращений; не равно прямому инвазивному измерению и может быть неточным при нарушениях ритма и изменённой гемодинамике. <a href="https://www.ncbi.nlm.nih.gov/books/NBK538226/" target="_blank" rel="noopener noreferrer">NCBI Bookshelf ↗</a>.</div></section></div>';
}
function bindDerivedCalculators(){
 const byId=id=>document.getElementById(id);
 const read=id=>byId(id)?.value??'';
 const updateABCD=()=>{
  const result=calculateABCD2({age:read('abcd-age'),systolic:read('abcd-sbp'),diastolic:read('abcd-dbp'),features:read('abcd-features'),duration:read('abcd-duration'),diabetes:read('abcd-diabetes')});
  const node=byId('abcd-result');if(!node)return;
  node.innerHTML=result.status==='complete'?'ABCD²: <strong>'+result.total+'/7</strong><div class="result-components"><div class="result-component"><strong>'+result.components.age+'</strong><small>Возраст</small></div><div class="result-component"><strong>'+result.components.bloodPressure+'</strong><small>АД</small></div><div class="result-component"><strong>'+result.components.clinicalFeatures+'</strong><small>Клиника</small></div><div class="result-component"><strong>'+result.components.duration+'</strong><small>Длительность</small></div><div class="result-component"><strong>'+result.components.diabetes+'</strong><small>Диабет</small></div></div><small>Сумма компонентов; интерпретируй только в контексте клинической оценки.</small>':result.status==='invalid'?'Проверь введённые значения':'Заполни все поля';
  node.classList.toggle('ready',result.status==='complete');
 };
 ['abcd-age','abcd-sbp','abcd-dbp','abcd-features','abcd-duration','abcd-diabetes'].forEach(id=>byId(id)?.addEventListener('input',updateABCD));
 byId('abcd-diabetes')?.addEventListener('change',updateABCD);
 byId('abcd-features')?.addEventListener('change',updateABCD);
 byId('abcd-duration')?.addEventListener('change',updateABCD);
 byId('abcd-age')?.addEventListener('change',updateABCD);
 byId('abcd-sbp')?.addEventListener('change',updateABCD);
 byId('abcd-dbp')?.addEventListener('change',updateABCD);
 byId('abcd-result')?.classList.remove('ready');
 byId('abcd-tool')?.querySelector('[data-reset-abcd]')?.addEventListener('click',()=>{['abcd-age','abcd-sbp','abcd-dbp','abcd-features','abcd-duration','abcd-diabetes'].forEach(id=>{if(byId(id))byId(id).value='';});updateABCD();});
 const updateBody=()=>{
  const h=read('body-height'),w=read('body-weight'),node=byId('body-result');if(!node)return;
  if(!h||!w){node.textContent='Введи рост и массу тела.';return;}
  const bmi=calculateBMI(w,h),bsa=calculateBSA(w,h);
  if(bmi.status!=='complete'||bsa.status!=='complete'){node.textContent='Проверь рост и массу: значения вне допустимого диапазона.';return;}
  node.innerHTML='<strong>ИМТ: '+bmi.value.toFixed(1)+' кг/м²</strong><p>ППТ (Mosteller): '+bsa.value.toFixed(2)+' м²</p>';
 };
 ['body-height','body-weight'].forEach(id=>byId(id)?.addEventListener('input',updateBody));
 const updateMAP=()=>{
  const node=byId('map-result');if(!node)return;
  if(!read('map-sbp')||!read('map-dbp')){node.textContent='Введи оба значения АД.';return;}
  const result=calculateMAP(read('map-sbp'),read('map-dbp'));
  node.textContent=result.status==='complete'?'Расчётное среднее АД: '+result.value.toFixed(1)+' мм рт. ст.':'Проверь значения: САД должно быть выше ДАД.';
 };
 ['map-sbp','map-dbp'].forEach(id=>byId(id)?.addEventListener('input',updateMAP));
}
function bindCalculatorFilter(){
 const input=document.getElementById('calculator-filter');if(!input)return;
 input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();document.querySelectorAll('[data-calculator-card]').forEach(card=>{card.hidden=!card.textContent.toLowerCase().includes(q);});});
}
const scaleDefinitions={rass:{options:RASS_OPTIONS,calculate:calculateRASS,title:'RASS'},mrs:{options:MRS_OPTIONS,calculate:calculateMRS,title:'mRS'},gos:{options:GOS_OPTIONS,calculate:calculateGOS,title:'GOS'}};
const scaleState={rass:null,mrs:null,gos:null};
function updateScaleResult(id){
 const definition=scaleDefinitions[id],node=document.getElementById('result-'+id),copy=document.querySelector('[data-scale-copy="'+id+'"]');
 if(!definition||!node)return;
 const result=definition.calculate(scaleState[id]);
 document.querySelectorAll('[data-scale-id="'+id+'"]').forEach(button=>{const selected=String(scaleState[id])===button.dataset.scaleValue;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
 if(result.status==='complete'){
  node.innerHTML='<div class="scale-result-score">'+(result.score>0&&id==='rass'?'+':'')+result.score+'</div><div class="scale-result-copy"><strong>'+esc(result.option.label)+'</strong><p>'+esc(result.option.detail)+'</p><small>Результат: '+definition.title+' '+result.score+'</small></div>';
  if(copy)copy.disabled=false;
 }else{node.innerHTML='<span>Выбери один вариант для расчёта.</span>';if(copy)copy.disabled=true;}
}
function bindScaleTools(){
 Object.keys(scaleState).forEach(id=>{scaleState[id]=null;});
 document.querySelectorAll('[data-scale-id]').forEach(button=>button.addEventListener('click',()=>{scaleState[button.dataset.scaleId]=Number(button.dataset.scaleValue);updateScaleResult(button.dataset.scaleId);}));
 document.querySelectorAll('[data-scale-reset]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.scaleReset;scaleState[id]=null;updateScaleResult(id);}));
 document.querySelectorAll('[data-scale-copy]').forEach(button=>button.addEventListener('click',async()=>{const id=button.dataset.scaleCopy,result=scaleDefinitions[id].calculate(scaleState[id]);if(result.status!=='complete')return;try{await navigator.clipboard.writeText(scaleDefinitions[id].title+': '+result.score+' — '+result.option.label);button.textContent='Скопировано';}catch{button.textContent='Не удалось скопировать';}}));
 Object.keys(scaleState).forEach(updateScaleResult);
}
const gcsState = { eye:null, verbal:null, motor:null };
function updateGCSResult() {
  const result = calculateGCS(gcsState);
  const panel = document.getElementById('gcs-result');
  const copyButton = document.querySelector('[data-gcs-copy]');
  if (!panel) return;
  document.querySelectorAll('[data-gcs-key]').forEach((button) => {
    const selected = String(gcsState[button.dataset.gcsKey]) === button.dataset.gcsValue;
    button.classList.toggle('selected',selected);
    button.setAttribute('aria-pressed',String(selected));
  });
  if (result.status === 'complete') {
    panel.innerHTML = '<div class="result-top"><span class="result-label">РЕЗУЛЬТАТ ОЦЕНКИ</span><span class="result-state complete">Все компоненты оценены</span></div><div class="result-number">' + result.total + '<small> / 15</small></div><div class="result-components">' +
      '<div class="result-component"><strong>' + result.components.eye + '</strong><small>E · глаза</small></div><div class="result-component"><strong>' + result.components.verbal + '</strong><small>V · речь</small></div><div class="result-component"><strong>' + result.components.motor + '</strong><small>M · движение</small></div></div><div class="result-note">Запись: <strong>' + result.notation + '</strong>. Результат отражает сумму выбранных компонентов и сам по себе не устанавливает диагноз и не определяет тактику лечения.</div><div class="source-citation">Методика: <a href="https://cr.minzdrav.gov.ru/preview-cr/814_1" target="_blank" rel="noopener noreferrer">КР Минздрава РФ, ID 814_1, приложение Г9 ↗</a>. Русскоязычная адаптация: <a href="https://doi.org/10.23934/2223-9022-2021-10-1-91-99" target="_blank" rel="noopener noreferrer">Пирадов М.А. и соавт., 2021 ↗</a>.</div>';
    if (copyButton) copyButton.disabled = false;
  } else if (result.status === 'not-testable') {
    panel.innerHTML = '<div class="result-top"><span class="result-label">РЕЗУЛЬТАТ ОЦЕНКИ</span><span class="result-state nt">Есть NT-компонент</span></div><p class="result-empty">Суммарный балл не рассчитывается: один или несколько компонентов отмечены как не поддающиеся оценке.</p><div class="result-components">' +
      ['eye','verbal','motor'].map((key) => '<div class="result-component"><strong>' + (result.components[key] === 'NT' ? 'NT' : result.components[key] || '—') + '</strong><small>' + GCS_COMPONENTS[key].short + '</small></div>').join('') + '</div><div class="result-note">Укажи причину невозможности оценки в медицинской документации и следуй принятому протоколу учреждения. Не подставляй условные баллы.</div><div class="source-citation">Правило NT: <a href="https://www.ncbi.nlm.nih.gov/books/NBK513298/" target="_blank" rel="noopener noreferrer">NCBI Bookshelf ↗</a>; методика: <a href="https://cr.minzdrav.gov.ru/preview-cr/814_1" target="_blank" rel="noopener noreferrer">КР Минздрава РФ, документ 567_2, приложение Г1 ↗</a></div>';
    if (copyButton) copyButton.disabled = false;
  } else {
    const count = Object.values(gcsState).filter((value) => value !== null).length;
    panel.innerHTML = '<div class="result-top"><span class="result-label">РЕЗУЛЬТАТ ОЦЕНКИ</span><span class="result-state">Не завершено</span></div><p class="result-empty">Отмечено компонентов: ' + count + ' из 3.<br>Выбери по одному варианту для глаз, речи и двигательной реакции.</p><div class="source-citation">Сумма не рассчитывается до выбора всех компонентов.</div>';
    if (copyButton) copyButton.disabled = true;
  }
}
function bindGCS() {
  Object.keys(gcsState).forEach((key) => { gcsState[key] = null; });
  document.querySelectorAll('[data-gcs-key]').forEach((button) => button.addEventListener('click', () => {
    gcsState[button.dataset.gcsKey] = button.dataset.gcsValue;
    updateGCSResult();
  }));
  const reset = document.querySelector('[data-gcs-reset]');
  if (reset) reset.addEventListener('click', () => {
    Object.keys(gcsState).forEach((key) => { gcsState[key] = null; });
    updateGCSResult();
  });
  const copy = document.querySelector('[data-gcs-copy]');
  if (copy) copy.addEventListener('click', async () => {
    const result = calculateGCS(gcsState);
    let content = result.status === 'complete' ? formatGCSResult(result) : 'ШКГ: сумма не рассчитывается (NT). E' + result.components.eye + ' V' + result.components.verbal + ' M' + result.components.motor;
    try {
      await navigator.clipboard.writeText(content);
      copy.innerHTML = icon('check',14) + ' Скопировано';
      setTimeout(() => { if (copy.isConnected) copy.innerHTML = icon('clipboard',14) + ' Скопировать результат'; },1500);
    } catch { copy.textContent = 'Не удалось скопировать'; }
  });
  updateGCSResult();
}

const featuredGuidelines = [
 {title:'Ишемический инсульт и транзиторная ишемическая атака',id:'814_1',year:'2024',codes:'G45 · I63 · I64 · I65 · I66',url:'https://cr.minzdrav.gov.ru/preview-cr/814_1',status:'Действует по метаданным рубрикатора'},
 {title:'Миастения',id:'165_2',year:'2025',codes:'G70.0 · G70.2 · G70.8 · G70.9',url:'https://cr.minzdrav.gov.ru/preview-cr/165_2',status:'Действует по метаданным рубрикатора'}
];
function renderHandbook() {
  return heading('БАЗА ЗНАНИЙ','Медицинский справочник','Навигация по первичным российским источникам, выбранные клинические рекомендации и встроенные карточки шкал. Полные документы доступны по прямой ссылке у Минздрава РФ.') +
    '<section class="card card-pad" style="margin-bottom:17px"><div class="section-head"><h2>Клинические рекомендации по неврологии</h2><a class="text-link" href="https://cr.minzdrav.gov.ru/" target="_blank" rel="noopener noreferrer">Открыть рубрикатор →</a></div><div class="guideline-list">' + featuredGuidelines.map(item=>'<article class="guideline-row"><div><strong>'+esc(item.title)+'</strong><small>ID '+item.id+' · '+item.year+' · МКБ-10: '+esc(item.codes)+'</small><small>'+esc(item.status)+'</small></div><a href="'+item.url+'" target="_blank" rel="noopener noreferrer">Открыть документ '+icon('external',13)+'</a></article>').join('') + '</div><p class="source-citation">Каталог шкал и опросников: <a href="https://cr.minzdrav.gov.ru/directory/scales" target="_blank" rel="noopener noreferrer">официальный каталог Минздрава РФ ↗</a>. В NeuroDesk включаются структурированные сведения и проверенные фрагменты с указанием версии и происхождения.</p></section>' +
    '<div class="notice" style="margin-bottom:18px">' + icon('shield-check') + '<div><strong>Принцип источника.</strong> Для клинических решений используй полную актуальную редакцию документа. Краткие описания, сторонние каталоги и поисковые сниппеты не заменяют первоисточник.</div></div>' +
    '<div class="page-toolbar" style="margin-bottom:16px"><input class="filter-input" id="resource-filter" type="search" placeholder="Найти ресурс по названию или теме…" aria-label="Поиск по справочнику"><span class="soft-chip">Российская юрисдикция · приоритет официальным ресурсам</span></div>' +
    '<div class="resource-grid" id="resource-grid">' + officialResources.map(resourceCard).join('') + '</div>';
}
function bindResourceFilter() {
  const input = document.getElementById('resource-filter');
  if (!input) return;
  input.addEventListener('input',() => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll('#resource-grid .resource-card').forEach((card) => {
      const match = card.textContent.toLowerCase().includes(query);
      card.hidden = !match;
      if (match) visible += 1;
    });
    let empty = document.getElementById('resource-empty');
    if (visible === 0 && !empty) {
      empty = document.createElement('div'); empty.id = 'resource-empty'; empty.className = 'card empty-state';
      empty.textContent = 'По этому запросу ресурсы не найдены.';
      document.getElementById('resource-grid').after(empty);
    } else if (visible > 0 && empty) empty.remove();
  });
}
function renderAnatomy() {
  return heading('ИНТЕРАКТИВНАЯ АНАТОМИЯ','3D-анатомия','Интерактивная визуализация — первый технический прототип. Анатомические подписи и клиническая локализация появятся только после проверки модели по авторитетным атласам и экспертной валидации.') +
    '<div class="anatomy-layout"><section class="viewer-card"><div class="viewer-head"><strong>Церебральная форма · демонстрационный объект</strong><small>Зажми и вращай · колесо мыши — масштаб</small></div><canvas id="brain-canvas" aria-label="Вращаемая демонстрационная трёхмерная форма, не являющаяся анатомическим атласом"></canvas><div class="viewer-controls"><span class="viewer-hint">Модель создана процедурно и не предназначена для анатомической локализации.</span><button type="button" class="button" data-brain-reset>' + icon('refresh',13) + ' Сбросить вид</button></div></section>' +
    '<aside class="anatomy-side"><section class="card"><div class="eyebrow">ВОЗМОЖНОСТИ ПРОТОТИПА</div><h2>Управление моделью</h2><div class="anatomy-feature"><span class="feature-dot"></span><span>Вращение мышью или касанием</span></div><div class="anatomy-feature"><span class="feature-dot"></span><span>Масштабирование колесом</span></div><div class="anatomy-feature"><span class="feature-dot"></span><span>Автоматическое плавное вращение</span></div><div class="anatomy-feature"><span class="feature-dot"></span><span>Адаптация к размеру экрана</span></div></section>' +
    '<section class="card"><div class="eyebrow">МЕДИЦИНСКАЯ ДОСТОВЕРНОСТЬ</div><h2>Что пока не включено</h2><p class="lead" style="font-size:10px">Эта модель — только визуальный демонстратор 3D-рендеринга. Она не показывает точные доли, ядра, проводящие пути, сосуды, нервы или топографические отношения.</p><div style="margin-top:14px">' + statusChip('review','Анатомическая валидация не пройдена') + '</div></section></aside></div>';
}
function renderPharmacology() {
  return heading('ЛЕКАРСТВЕННАЯ ИНФОРМАЦИЯ','Фармакология','Раздел строится вокруг российских регистрационных данных и официальных инструкций. Здесь не будет самостоятельно составленных дозировок или неподтверждённых таблиц взаимодействий.') +
    '<div class="notice warning" style="margin-bottom:17px">' + icon('info') + '<div><strong>Безопасность.</strong> Регистрационный статус, инструкция и ограничения могут меняться. Перед назначением сверяй препарат, форму выпуска, дозировку и актуальную инструкцию в официальном реестре.</div></div>' +
    '<div class="resource-grid">' + officialResources.filter((item) => ['grls','roszdrav','cr'].includes(item.id)).map(resourceCard).join('') + '</div>' +
    '<section class="card card-pad" style="margin-top:17px"><div class="eyebrow">СЛЕДУЮЩИЙ ЭТАП</div><h2>Справочник препаратов NeuroDesk</h2><p class="lead" style="font-size:11px">Локальная база препаратов появится только при наличии надёжного источника данных, возможности регулярно сверять обновления и корректно показывать статус регистрации. Планируется хранить ссылку на конкретную инструкцию, дату проверки и историю обновления записи.</p><div style="margin-top:14px">' + statusChip('review','Локальная база пока не публикуется') + '</div></section>';
}
function renderDiagnostics() {
  return heading('МЕТОДЫ И ИССЛЕДОВАНИЯ','Диагностика','Справочные точки входа к методикам обследования и нормативным документам. Интерпретационные алгоритмы не добавляются без клинического источника и экспертной проверки.') +
    '<div class="feature-grid">' +
    '<a class="feature-card" href="https://cr.minzdrav.gov.ru/" target="_blank" rel="noopener noreferrer"><span class="metric-icon">' + icon('file-check') + '</span><strong>Клинические рекомендации</strong><p>Диагностические критерии и рекомендуемый объём обследования по нозологии.</p><span class="feature-status">' + statusChip('ready','Официальный источник') + '</span></a>' +
    '<a class="feature-card" href="https://femb.ru/" target="_blank" rel="noopener noreferrer"><span class="metric-icon blue">' + icon('library') + '</span><strong>Медицинская литература</strong><p>Профессиональные публикации и справочные материалы.</p><span class="feature-status">' + statusChip('ready','Внешний ресурс') + '</span></a>' +
    '<a class="feature-card" href="https://www.glasgowcomascale.org/" target="_blank" rel="noopener noreferrer"><span class="metric-icon amber">' + icon('activity') + '</span><strong>Оценка сознания</strong><p>Структурированный подход к проведению шкалы комы Глазго.</p><span class="feature-status">' + statusChip('ready','Методический источник') + '</span></a>' +
    '</div><div class="notice warning" style="margin-top:17px">' + icon('info') + '<div><strong>Не путать справочник с диагностической системой.</strong> NeuroDesk не анализирует МРТ/КТ, ЭЭГ или лабораторные данные и не формирует заключение автоматически. Такие функции требуют отдельной клинической, технической и регуляторной оценки.</div></div>';
}
function renderQuality() {
  const rows = [
    ['GCS / ШКГ','Реализована сумма E + V + M; NT блокирует итоговый балл.','ready','Проверено тестами'],
    ['Официальные ссылки','Добавлены первичные российские и методические источники.','ready','Ссылки добавлены'],
    ['ABCD²','Интерфейс и подсчёт реализованы; требуется медицинская экспертная проверка.','review','Технически реализована'],
    ['ИМТ, ППТ, MAP','Арифметические формулы покрыты тестами; клиническое применение ограничено назначением показателей.','review','Расчётные помощники'],
    ['NIHSS, EDSS, MIDAS','Нужна проверка методики, русской версии, прав и критериев.','review','Ожидают валидации'],
    ['MoCA','Электронное воспроизведение ограничено условиями правообладателя.','restricted','Требуется разрешение'],
    ['MDS-UPDRS','Для электронного использования требуется предварительное разрешение MDS.','restricted','Требуется разрешение'],
    ['3D-анатомия','Текущий объект процедурный и демонстрационный; анатомическая точность не заявляется.','review','Не является атласом'],
    ['Фармакологическая база','Не публикуется без регулярного доступа к официальным данным и синхронизации.','review','В разработке'],
    ['Персональные данные','Пациентские данные не запрашиваются и не сохраняются.','ready','В текущей версии']
  ];
  return heading('MEDICAL QUALITY CONTROL','Контроль медицинского качества','Прозрачный реестр того, что действительно реализовано, что проверено, а что пока намеренно не публикуется.') +
    '<div class="notice critical" style="margin-bottom:18px">' + icon('shield') + '<div><strong>Правило выпуска:</strong> клинический инструмент нельзя помечать как готовый, пока не проверены первоисточник, версия методики, алгоритм, граничные случаи и медицинская корректность. Для клинического применения необходима независимая проверка практикующим специалистом.</div></div>' +
    '<section class="card card-pad"><div class="section-head"><h2>Реестр компонентов</h2><span class="soft-chip">Версия 0.1.0 · 10.11.2026</span></div><div class="quality-list">' + rows.map((row) => '<div class="quality-row"><strong>' + esc(row[0]) + '</strong><small>' + esc(row[1]) + '</small>' + statusChip(row[2],row[3]) + '</div>').join('') + '</div><div class="status-legend"><span class="status-chip ready">Готово технически</span><span class="status-chip review">Требуется проверка</span></div></section>' +
    '<div class="content-grid" style="margin-top:17px"><section class="card card-pad"><h2>Что означает «готово»</h2><p class="lead" style="font-size:10px">Технические тесты подтверждают поведение кода на заданных примерах. Они не заменяют экспертную медицинскую валидацию и не подтверждают пригодность для принятия клинических решений.</p></section><section class="card card-pad"><h2>Документы проекта</h2><p class="lead" style="font-size:10px">Политика медицинского качества и план развития доступны в репозитории: <a class="text-link" href="https://github.com/vladsimbro/NeuroDesk/tree/main/docs" target="_blank" rel="noopener noreferrer">открыть документы →</a></p></section></div>';
}

const PAGES = {
  overview:{title:'Обзор',render:renderOverview},
  calculators:{title:'Калькуляторы',render:renderCalculatorCatalog},
  handbook:{title:'Справочник',render:renderHandbook},
  anatomy:{title:'3D-анатомия',render:renderAnatomy},
  pharmacology:{title:'Фармакология',render:renderPharmacology},
  diagnostics:{title:'Диагностика',render:renderDiagnostics},
  quality:{title:'Контроль качества',render:renderQuality}
};
function render() {
  disposeBrainScene();
  const route = routeName();
  const page = PAGES[route];
  setActiveNav(route);
  breadcrumb.textContent = page.title;
  app.innerHTML = page.render();
  if (route === 'calculators') { bindGCS(); bindScaleTools(); bindCalculatorFilter(); bindDerivedCalculators(); }
  if (route === 'handbook') bindResourceFilter();
  if (route === 'anatomy' || route === 'overview') initBrainScene('brain-canvas');
  sidebar.classList.remove('open');
  document.title = page.title + ' — NeuroDesk';
}
function navigate(route) { location.hash = route; }

document.addEventListener('click',(event) => {
  const nav = event.target.closest('[data-route]');
  if (nav) { event.preventDefault(); navigate(nav.dataset.route); }
  if (event.target.closest('[data-scroll-gcs]')) document.getElementById('gcs')?.scrollIntoView({behavior:'smooth',block:'start'});
  const toolLink = event.target.closest('[data-open-tool]');
  if (toolLink) document.getElementById('tool-' + toolLink.dataset.openTool)?.scrollIntoView({behavior:'smooth',block:'start'});
  if (!event.target.closest('.global-search') && !event.target.closest('.search-popover')) searchPopover.hidden = true;
});
window.addEventListener('hashchange',render);
document.getElementById('mobile-menu').addEventListener('click',() => sidebar.classList.toggle('open'));
document.getElementById('theme-toggle').addEventListener('click',() => {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  localStorage.setItem('neurodesk-theme',dark ? 'dark' : 'light');
  document.getElementById('theme-toggle').innerHTML = icon(dark ? 'moon' : 'sun');
});
if (localStorage.getItem('neurodesk-theme') === 'dark') {
  document.body.classList.add('dark');
  document.getElementById('theme-toggle').innerHTML = icon('moon');
} else document.getElementById('theme-toggle').innerHTML = icon('sun');

function searchItems(query) {
  const text = query.trim().toLowerCase();
  if (!text) return [];
  const routes = Object.entries(PAGES).map(([id,page]) => ({id,title:page.title,detail:'Раздел NeuroDesk'}));
  const resources = officialResources.map((item) => ({id:'handbook',title:item.title,detail:item.category + ' · ' + item.domain}));
  const scales = scaleCatalog.map((item) => ({id:item.status === 'ready' ? 'calculators' : 'quality',title:item.title,detail:item.label + ' · шкала'}));
  return [...routes,...resources,...scales].filter((item) => (item.title + ' ' + item.detail).toLowerCase().includes(text)).slice(0,7);
}
function drawSearch() {
  const results = searchItems(searchInput.value);
  if (!searchInput.value.trim()) { searchPopover.hidden = true; return; }
  searchPopover.hidden = false;
  if (!results.length) { searchPopover.innerHTML = '<div class="search-empty">Ничего не найдено. Попробуй изменить запрос.</div>'; return; }
  searchPopover.innerHTML = results.map((item) => '<button type="button" class="search-result" data-search-route="' + item.id + '"><span class="resource-mark">' + icon('search',15) + '</span><span>' + esc(item.title) + '<small>' + esc(item.detail) + '</small></span></button>').join('');
}
searchInput.addEventListener('input',drawSearch);
searchInput.addEventListener('keydown',(event) => {
  if (event.key === 'Enter') { const first = searchItems(searchInput.value)[0]; if (first) navigate(first.id); searchPopover.hidden = true; }
  if (event.key === 'Escape') searchPopover.hidden = true;
});
searchPopover.addEventListener('click',(event) => {
  const button = event.target.closest('[data-search-route]');
  if (!button) return;
  navigate(button.dataset.searchRoute); searchPopover.hidden = true; searchInput.value = '';
});
document.addEventListener('keydown',(event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchInput.focus(); }
});
document.querySelectorAll('[data-icon]').forEach((node) => { node.innerHTML = icon(node.dataset.icon); });
render();
