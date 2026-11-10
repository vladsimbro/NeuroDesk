import { GCS_COMPONENTS, calculateGCS, formatGCSResult } from './calculators.js';
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
    '<div class="metric-grid">' + metricCard('calculator', '', '01', 'Калькулятор технически готов') + metricCard('book', 'blue', '06', 'Профессиональных источников') + metricCard('brain', 'amber', '3D', 'Интерактивная визуализация') + metricCard('shield', 'navy', '0', 'Пациентских данных хранится') + '</div>' +
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
    '<aside class="card result-card" id="gcs-result" aria-live="polite"><div class="result-top"><span class="result-label">РЕЗУЛЬТАТ ОЦЕНКИ</span><span class="result-state">Не завершено</span></div><p class="result-empty">Выбери по одному варианту в каждом компоненте. Сумма появится только если все три компонента поддаются оценке.</p><div class="source-citation">Методика: <a href="https://www.glasgowcomascale.org/" target="_blank" rel="noopener noreferrer">официальный ресурс GCS ↗</a>. Правило NT и запрет суммирования неоцениваемого компонента: <a href="https://www.ncbi.nlm.nih.gov/books/NBK513298/" target="_blank" rel="noopener noreferrer">NCBI Bookshelf ↗</a>.</div></aside></div>';
}
function renderCalculatorCatalog() {
  return heading('ИНСТРУМЕНТЫ','Клинические калькуляторы и шкалы','Доступны только инструменты с реализованной логикой и тестами. Остальные методики проходят отдельную проверку источников, условий использования и алгоритмов.') +
    '<div class="notice warning" style="margin-bottom:17px">' + icon('info') + '<div><strong>Важно.</strong> Скрининговые и оценочные шкалы не заменяют клиническую оценку. Не используй числовой результат изолированно от клинического контекста.</div></div>' +
    '<div class="catalog-grid">' + scaleCatalog.map((item) => '<article class="catalog-card"><div class="metric-icon">' + icon(item.icon) + '</div><div class="catalog-card-copy"><h3>' + esc(item.title) + '</h3><p>' + esc(item.description) + '</p>' + statusChip(item.status,item.label) + (item.status === 'ready' ? '<br><button type="button" class="text-link" data-scroll-gcs>Открыть калькулятор ↓</button>' : '') + '</div></article>').join('') + '</div>' +
    '<div id="gcs" style="margin-top:23px">' + renderGCSCalculator() + '</div>';
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
      '<div class="result-component"><strong>' + result.components.eye + '</strong><small>E · глаза</small></div><div class="result-component"><strong>' + result.components.verbal + '</strong><small>V · речь</small></div><div class="result-component"><strong>' + result.components.motor + '</strong><small>M · движение</small></div></div><div class="result-note">Запись: <strong>' + result.notation + '</strong>. Результат отражает сумму выбранных компонентов и сам по себе не устанавливает диагноз и не определяет тактику лечения.</div><div class="source-citation">Методика: <a href="https://www.glasgowcomascale.org/" target="_blank" rel="noopener noreferrer">официальный ресурс GCS ↗</a>. Описание шкалы и диапазона суммы: <a href="https://www.ncbi.nlm.nih.gov/books/NBK513298/" target="_blank" rel="noopener noreferrer">NCBI Bookshelf ↗</a>.</div>';
    if (copyButton) copyButton.disabled = false;
  } else if (result.status === 'not-testable') {
    panel.innerHTML = '<div class="result-top"><span class="result-label">РЕЗУЛЬТАТ ОЦЕНКИ</span><span class="result-state nt">Есть NT-компонент</span></div><p class="result-empty">Суммарный балл не рассчитывается: один или несколько компонентов отмечены как не поддающиеся оценке.</p><div class="result-components">' +
      ['eye','verbal','motor'].map((key) => '<div class="result-component"><strong>' + (result.components[key] === 'NT' ? 'NT' : result.components[key] || '—') + '</strong><small>' + GCS_COMPONENTS[key].short + '</small></div>').join('') + '</div><div class="result-note">Укажи причину невозможности оценки в медицинской документации и следуй принятому протоколу учреждения. Не подставляй условные баллы.</div><div class="source-citation">Правило NT: <a href="https://www.ncbi.nlm.nih.gov/books/NBK513298/" target="_blank" rel="noopener noreferrer">NCBI Bookshelf ↗</a>; методика: <a href="https://www.glasgowcomascale.org/" target="_blank" rel="noopener noreferrer">официальный ресурс GCS ↗</a></div>';
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

function renderHandbook() {
  return heading('БАЗА ЗНАНИЙ','Медицинский справочник','Навигация по первичным российским источникам и профессиональным медицинским ресурсам. Содержимое документов открывается у первоисточника — NeuroDesk не переписывает клинические рекомендации.') +
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
    ['NIHSS, ABCD², EDSS, MIDAS','Нужна проверка методики, локализации, критериев и алгоритма.','review','Ожидают валидации'],
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
  if (route === 'calculators') bindGCS();
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
