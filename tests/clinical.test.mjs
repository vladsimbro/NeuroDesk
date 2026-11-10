import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const clinicalPage = await readFile(new URL('../clinical.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

test('clinical reference is directly reachable from home and has a standalone page', () => {
  assert.match(home, /href="\.\/clinical\.html"/);
  assert.match(clinicalPage, /Клинический справочник/);
  assert.match(app, /if\(page==='clinical\.html'\)return 'clinical'/);
});

test('neurological examination feature and navigation are fully removed', () => {
  assert.doesNotMatch(app, /function renderExam\(|function bindExam\(|exam-form|neurodesk-exam-draft/);
  assert.doesNotMatch(home, /Невроосмотр|data-route="exam"|href="#exam"/);
  assert.doesNotMatch(clinicalPage, /Невроосмотр|data-route="exam"|href="\.\/index\.html#exam"/);
  assert.doesNotMatch(css, /\.exam-/);
});

test('clinical library contains 31 neurology articles', () => {
  const start = app.indexOf('const CLINICAL_LIBRARY=');
  const end = app.indexOf('function renderClinical()', start);
  const library = app.slice(start, end);
  const entries = library.match(/\{id:'[^']+'/g) || [];
  assert.equal(entries.length, 31);
  for (const topic of ['Острый инсульт','Транзиторная ишемическая атака','Первый эпилептический приступ','Эпилептический статус','Паркинсонизм','Рассеянный склероз','Делирий','Когнитивное снижение','Нейропатическая боль','Невралгия тройничного нерва','Болезнь двигательного нейрона','Острая слабость мимических мышц','радикулопатия','Атаксия','Тремор','Обморок','Кластерная головная боль','Миастения','Оптический неврит','Шейная миелопатия','Менингит','Дистальная симметричная полинейропатия','Острый миелит','Диплопия','Птоз','Нарушение походки','Дисфагия']) {
    assert.ok(library.toLocaleLowerCase('ru-RU').includes(topic.toLocaleLowerCase('ru-RU')), topic);
  }
  assert.match(library, /sources:\[\]/);
});

test('clinical articles support deep links and table of contents', () => {
  assert.match(app, /new URLSearchParams\(location\.search\)\.getAll\('article'\)/);
  assert.match(app, /url\.searchParams\.delete\('article'\)/);
  assert.match(app, /\[\.\.\.openArticles\]\.forEach\(id=>url\.searchParams\.append\('article',id\)\)/);
  assert.match(app, /clinical-article-toc/);
  assert.match(app, /data-clinical-section-target="clinical-section-'\+item\.id\+'-'\+i/);
  assert.match(app, /\[data-clinical-section-target\]/);
  assert.match(app, /section\.scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/);
  assert.doesNotMatch(app, /<a href="#clinical-section-/);
});

test('clinical reference supports token search, category filters and expandable articles', () => {
  for (const feature of ['clinical-query','clinical-filters','clinical-results','data-clinical-filter','data-clinical-open','clinical-article-section','Российские клинические рекомендации']) {
    assert.ok(app.includes(feature), feature);
  }
  assert.match(app, /const normalizeSearch=value=>String\(value\?\?''\)\.normalize\('NFKC'\)/);
  assert.match(app, /words\.some\(word=>word\.startsWith\(stem\)/);
  assert.match(app, /item\.sections\.flatMap\(section=>\[section\.title,\.\.\.section\.items\]\)/);
  assert.match(css, /\.clinical-results/);
  assert.match(css, /\.clinical-article-section/);
});

test('multiple clinical articles can stay open independently of search and filters', () => {
  assert.match(app, /const openArticles=new Set\(new URLSearchParams\(location\.search\)\.getAll\('article'\)/);
  assert.match(app, /if\(openArticles\.has\(id\)\)openArticles\.delete\(id\);else openArticles\.add\(id\)/);
  assert.match(app, /const openMarkup=\[\.\.\.openArticles\]/);
  assert.match(app, /const cards=matches\.map\(item=>/);
  assert.match(app, /query\.addEventListener\('input',render\)/);
  assert.match(app, /category=button\.dataset\.clinicalFilter;filters\.querySelectorAll/);
  assert.match(app, /data-clinical-close/);
  assert.match(app, /aria-expanded=/);
  assert.doesNotMatch(app, /selected=null;updateUrl\(\);render\(\)/);
});

test('mobile sidebar has an explicit close control and backdrop behavior', () => {
  assert.match(home, /id="sidebar-close"/);
  assert.match(clinicalPage, /id="sidebar-close"/);
  assert.match(app, /addEventListener\('click',closeSidebar\)/);
  assert.match(app, /Escape/);
  assert.match(css, /body\.sidebar-open:before/);
  assert.match(css, /\.sidebar-close/);
});

test('clinical mobile layout improves touch targets and reading width', () => {
  assert.match(css, /clinical-filter\{flex:0 0 auto;min-height:38px/);
  assert.match(css, /clinical-article-section li\{font-size:13px;line-height:1\.7/);
  assert.match(css, /clinical-result-wrap\{min-width:0\}/);
});

test('Russian clinical recommendations are the primary local reference where directly applicable', () => {
  assert.match(app, /Российские клинические рекомендации/);
  assert.match(app, /minzdrav\.gov\.ru\/smartphone_apps_rubrikator_kr/);
  for (const id of ['814_1','295_4','810_1','165_2','742_2','617_5','741','290_2']) assert.ok(app.includes(id), id);
  assert.doesNotMatch(app, /NICE|NHS|SAEM|ILAE|NINDS|AAO|AAPM&R|nice\\.org\\.uk|nhs\\.uk|saem\\.org|ilae\\.org|ninds\\.nih\\.gov|aao\\.org|ncbi\\.nlm\\.nih\\.gov/);
  assert.match(app, /зарубежные источники не используются/i);
});

test('clinical article navigation and search stay inside the reference and support Russian word forms', () => {
  assert.match(app, /data-clinical-section-target=/);
  assert.match(app, /section\.scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/);
  assert.doesNotMatch(app, /<a href="#clinical-section-/);
  assert.match(app, /normalizeSearch=value=>String\(value\?\?''\)/);
  assert.match(app, /const stem=token\.length>5\?token\.slice\(0,-2\):token/);
  assert.match(app, /words\.some\(word=>word\.startsWith\(stem\)/);
});

test('article expansion and collapse use a smooth height transition and a close control', () => {
  assert.match(app, /clinical-article-panel/);
  assert.match(app, /data-clinical-close/);
  assert.match(app, /icon\('close',19\)/);
  assert.doesNotMatch(app, /clinical-collapse[^\n]*icon\('check'/);
  assert.doesNotMatch(app, /data-clinical-close="'\+item\.id\+'">Свернуть/);
  assert.match(css, /grid-template-rows:0fr/);
  assert.match(css, /grid-template-rows:1fr/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('clinical route remains clinical when an article section hash changes', () => {
  assert.ok(app.includes("if(page==='clinical.html')return 'clinical'"));
  assert.ok(app.includes("window.addEventListener('hashchange',()=>{if(!location.pathname.endsWith('/clinical.html'))render();});"));
  assert.match(clinicalPage, /data-nav="clinical"/);
  assert.match(home, /data-nav="clinical"/);
});

test('clinical source links use the stable official Ministry rubricator information page while the registry is unavailable', () => {
  assert.match(app, /https:\/\/minzdrav\.gov\.ru\/smartphone_apps_rubrikator_kr\./);
  assert.doesNotMatch(app, /https:\/\/cr\.minzdrav\.gov\.ru\/(?:preview-cr|view-cr)\//);
  assert.match(app, /техническ.{0,20}работ/i);
  for (const id of ['814_1','295_4','810_1','165_2','742_2','617_5']) assert.ok(app.includes(id), id);
});

test('mobile sidebar backdrop fades smoothly in both directions', () => {
  assert.ok(css.includes('body:before{content:"";position:fixed'));
  assert.ok(css.includes('opacity:0;visibility:hidden;pointer-events:none;transition:opacity .28s ease,visibility 0s linear .28s'));
  assert.ok(css.includes('body.sidebar-open:before{opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s'));
});

test('project literature policy lists Russian official sources only', async () => {
  const { readFile } = await import('node:fs/promises');
  const literature = await readFile(new URL('../docs/LITERATURE.md', import.meta.url), 'utf8');
  assert.match(literature, /Минздрава России/);
  assert.doesNotMatch(literature, /NICE|NHS|NCBI|PubMed|McGraw Hill|Oxford University Press|LWW/);
});

test('only the navigation item matching the current route receives active state', () => {
  assert.match(app, /const page=location\.pathname\.split\('\/'\)\.filter\(Boolean\)\.at\(-1\)\|\|''/);
  assert.match(app, /links\.forEach\(node=>\{\s*node\.classList\.remove\('active'\)/);
  assert.match(app, /node\.removeAttribute\('aria-current'\)/);
  assert.match(app, /active\.setAttribute\('aria-current','page'\)/);
  assert.doesNotMatch(home, /class="nav-item active"/);
  assert.doesNotMatch(clinicalPage, /class="nav-item active"/);
});


test('the site is light-only and the theme switch is removed', () => {
  assert.doesNotMatch(home, /theme-toggle|Переключить тему/);
  assert.doesNotMatch(clinicalPage, /theme-toggle|Переключить тему/);
  assert.doesNotMatch(app, /localStorage\.getItem\('neurodesk-theme'\)|applyTheme\(|body\.classList\.toggle\('dark'/);
  assert.doesNotMatch(css, /body\.dark/);
  assert.match(css, /\.sidebar\{background:#fff/);
});

test('home page presents the two main reference modules clearly', () => {
  assert.match(app, /home-welcome/);
  assert.match(app, /home-module-grid/);
  assert.match(app, /home-module-icd/);
  assert.match(app, /home-module-clinical/);
  assert.match(css, /\.home-welcome/);
  assert.match(css, /\.home-module-grid/);
});

test('clinical article wording does not expose foreign guideline names or untranslated clinical shortcuts', () => {
  const start = app.indexOf('const CLINICAL_LIBRARY=');
  const end = app.indexOf('function renderClinical()', start);
  const library = app.slice(start, end);
  assert.doesNotMatch(library, /McDonald|myasthenia gravis|déjà vu|jamais vu|HINTS|FAST|last known well|head impulse|MND|ALS|NMOSD|MOGAD|AQP4|SUNCT|SUNA|ABCD2/i);
  assert.match(library, /диагностические критерии рассеянного склероза/);
  assert.match(library, /ощущение уже виденного или никогда не виденного/);
});
