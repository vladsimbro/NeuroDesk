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
  assert.match(app, /location\.pathname\.endsWith\('\/clinical\.html'\)/);
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
  assert.match(app, /new URLSearchParams\(location\.search\)\.get\('article'\)/);
  assert.match(app, /history\.replaceState\(null,'',url\.pathname\+url\.search\+url\.hash\)/);
  assert.match(app, /clinical-article-toc/);
  assert.match(app, /id="clinical-section-'\+item\.id\+'-'\+i/);
});

test('clinical reference supports token search, category filters and expandable articles', () => {
  for (const feature of ['clinical-query','clinical-filters','clinical-results','data-clinical-filter','data-clinical-open','clinical-article-section','Российские клинические рекомендации']) {
    assert.ok(app.includes(feature), feature);
  }
  assert.match(app, /tokens\.every\(token=>corpus\.includes\(token\)\)/);
  assert.match(css, /\.clinical-results/);
  assert.match(css, /\.clinical-article-section/);
});

test('clinical article expands inline below the selected result instead of appending elsewhere', () => {
  assert.match(app, /clinical-result-wrap/);
  assert.match(app, /selected===item\.id\?articleMarkup\(item\):''/);
  assert.match(app, /aria-expanded=/);
  assert.match(app, /scrollIntoView\(\{behavior:'smooth',block:'nearest'\}\)/);
  assert.doesNotMatch(app, /document\.querySelector\('\.clinical-article'\)\?\.scrollIntoView/);
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
  assert.match(app, /cr\.minzdrav\.gov\.ru/);
  for (const id of ['814_1','295_4','810_1','165_2','742_2','617_5']) assert.ok(app.includes(id), id);
  assert.doesNotMatch(app, /NICE|NHS|SAEM|ILAE|NINDS|AAO|AAPM&R|nice\\.org\\.uk|nhs\\.uk|saem\\.org|ilae\\.org|ninds\\.nih\\.gov|aao\\.org|ncbi\\.nlm\\.nih\\.gov/);
  assert.match(app, /зарубежные источники не используются/);
});

test('article expansion and collapse use a smooth height transition and an in-article check control', () => {
  assert.match(app, /clinical-article-panel/);
  assert.match(app, /data-clinical-close/);
  assert.match(app, /icon\('check',19\)/);
  assert.doesNotMatch(app, /data-clinical-close="'\+item\.id\+'">Свернуть/);
  assert.match(css, /grid-template-rows:0fr/);
  assert.match(css, /grid-template-rows:1fr/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('clinical route remains clinical when an article section hash changes', () => {
  assert.match(app, /if\\(location\\.pathname\\.endsWith\\('\\/clinical\\.html'\\)\\)return 'clinical'/);
  assert.match(app, /hashchange',\\(\\)=>\\{if\\(!location\\.pathname\\.endsWith\\('\\/clinical\\.html'\\)\\)render\\(\\)\\}/);
  assert.match(clinicalPage, /data-nav="clinical"/);
  assert.match(home, /data-nav="clinical"/);
});

test('article links are limited to direct Russian clinical recommendation records', () => {
  assert.doesNotMatch(app, /https?:\\/\\/(?!cr\\.minzdrav\\.gov\\.ru|nsi\\.rosminzdrav\\.ru)[^'"]+/);
  assert.doesNotMatch(app, /href="https:\\/\\/cr\\.minzdrav\\.gov\\.ru\/"[^>]*>Официальный рубрикатор/);
  assert.match(app, /view-cr\\/742_2/);
  assert.match(app, /view-cr\\/617_5/);
});

test('mobile sidebar backdrop fades smoothly in both directions', () => {
  assert.match(css, /body:before\\{content:"";position:fixed/);
  assert.ok(css.includes('opacity:0;visibility:hidden;pointer-events:none;transition:opacity .28s ease,visibility 0s linear .28s'));
  assert.match(css, /body\\.sidebar-open:before\\{opacity:1;visibility:visible;pointer-events:auto/);
});

test('project literature policy lists Russian official sources only', async () => {
  const { readFile } = await import('node:fs/promises');
  const literature = await readFile(new URL('../docs/LITERATURE.md', import.meta.url), 'utf8');
  assert.match(literature, /Минздрава России/);
  assert.doesNotMatch(literature, /NICE|NHS|NCBI|PubMed|McGraw Hill|Oxford University Press|LWW/);
});
