import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);
const app = await readFile(new URL('assets/js/app.js', root), 'utf8');
const home = await readFile(new URL('index.html', root), 'utf8');
const clinical = await readFile(new URL('clinical.html', root), 'utf8');
const baseCss = await readFile(new URL('assets/css/styles.css', root), 'utf8');
const css = await readFile(new URL('assets/css/experience.css', root), 'utf8');

function markupFor(name) {
  const match = app.match(new RegExp('function '+name+'\\(\\)\\{\\s*return ("(?:\\\\.|[^"\\\\])*");\\s*\\}'));
  assert.ok(match, name+' markup is available');
  return JSON.parse(match[1]);
}
const homeMarkup = markupFor('renderOverview');
const clinicalMarkup = markupFor('renderClinical');
const libraryStart = app.indexOf('const CLINICAL_LIBRARY=');
const libraryEnd = app.indexOf('function renderClinical()', libraryStart);
const librarySource = app.slice(libraryStart, libraryEnd);
const articles = runInNewContext(librarySource+'\nCLINICAL_LIBRARY;');
const ids = new Set(articles.map(a => a.id));

test('the home page renders meaningful content even with JavaScript disabled', () => {
  assert.ok(home.includes(homeMarkup));
  assert.match(homeMarkup, /nd-home-gateways/);
  assert.match(homeMarkup, /nd-home-topic-grid/);
  assert.match(homeMarkup, /МКБ-10/);
  assert.match(homeMarkup, /КЛИНИЧЕСКИЙ СПРАВОЧНИК/i);
  assert.doesNotMatch(homeMarkup, /home-welcome-art|home-orbit|home-module-watermark/);
  assert.match(home, /id="app-content" aria-live="polite"/);
});

test('all home shortcuts link to real existing article IDs', () => {
  const links = [...homeMarkup.matchAll(/href="\.\/clinical\.html\?article=([^"]+)"/g)].map(x => x[1]);
  assert.equal(links.length, 6);
  for (const id of links) assert.ok(ids.has(id), 'unknown article: '+id);
  assert.match(homeMarkup, /href="#icd"/);
  assert.match(homeMarkup, /href="\.\/clinical\.html"/);
});

test('both pages load the new, separate experience stylesheet', () => {
  assert.match(home, /href="\.\/assets\/css\/experience\.css"/);
  assert.match(clinical, /href="\.\/assets\/css\/experience\.css"/);
  assert.match(css, /\.nd-home-gateways/);
  assert.match(css, /\.nd-reader-overlay/);
  assert.match(css, /\.nd-clinical-results/);
});

test('the clinical directory has semantic search, filters and a detached reader', () => {
  for (const token of ['id="clinical-query"','id="clinical-clear"','id="clinical-reopen"','id="clinical-filters"','id="clinical-meta"','id="clinical-results"','id="clinical-reader"','id="clinical-reader-tabs"','id="clinical-reader-content"']) {
    assert.ok(clinicalMarkup.includes(token), token);
  }
  assert.match(clinicalMarkup, /role="dialog" aria-modal="true"/);
  assert.match(clinicalMarkup, /role="tablist"/);
  assert.match(clinicalMarkup, /data-clinical-dismiss/);
  assert.match(clinicalMarkup, /<\/section>\s*<div class="nd-reader-overlay"/);
});

test('the article reader is fixed over the directory rather than changing its grid columns', () => {
  assert.match(css, /\.nd-clinical-results\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.nd-reader-overlay\{position:fixed;inset:0;/);
  assert.match(css, /\.nd-reader-dialog\{position:relative;/);
  assert.match(css, /body\.nd-reader-open\{overflow:hidden\}/);
  assert.doesNotMatch(clinicalMarkup, /clinical-open-articles|clinical-layout has-open-articles/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /@media\(max-width:800px\)/);
  assert.match(css, /\.nd-reader-dialog\{width:100%;height:100dvh;/);
});

test('multiple article IDs are kept in the URL and an active tab is independently selected', () => {
  assert.match(app, /getAll\('article'\)/);
  assert.match(app, /openArticles\.add\(id\);activeArticle=id;readerVisible=true;/);
  assert.match(app, /url\.searchParams\.append\('article',id\)/);
  assert.match(app, /url\.searchParams\.set\('active',activeArticle\)/);
  assert.match(app, /openArticles\.delete\(id\)/);
  assert.match(app, /activeArticle=\[\.\.\.openArticles\]\.at\(-1\)\|\|null/);
  assert.match(app, /openArticles\.clear\(\)/);
  assert.match(app, /data-clinical-tab-close/);
  assert.match(app, /role="tab"/);
});

test('closing the reader preserves open tabs and search position', () => {
  assert.match(app, /const dismissReader=\(\)=>\{\s*readerVisible=false;syncReader\(\);restoreFocus\(\);/);
  assert.match(app, /reopen\.addEventListener\('click'/);
  assert.match(app, /renderCards\(\);syncReader\(\)/);
  assert.match(app, /document\.addEventListener\('keydown'/);
  assert.match(app, /event\.key==='Escape'/);
  assert.match(app, /event\.key!=='Tab'/);
  assert.match(app, /last\.focus\(\)/);
  assert.match(app, /first\.focus\(\)/);
});

test('clinical filtering continues to search article text and tags', () => {
  assert.match(app, /const normalizeSearch=value=>String\(value\?\?''\)\.normalize\('NFKC'\)/);
  assert.match(app, /item\.sections\.flatMap\(section=>\[section\.title,\.\.\.section\.items\]\)/);
  assert.match(app, /words\.some\(word=>word\.startsWith\(stem\)/);
  assert.match(app, /query\.addEventListener\('input',renderCards\)/);
  assert.match(app, /category=button\.dataset\.clinicalFilter/);
  assert.match(app, /aria-pressed/);
});

test('article table of contents targets document sections without leaving the route', () => {
  assert.match(app, /data-clinical-section-target=/);
  assert.match(app, /section\.scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/);
  assert.match(app, /section\.focus\(\{preventScroll:true\}\)/);
  assert.doesNotMatch(app, /<a href="#clinical-section-/);
  assert.match(app, /if\(page==='clinical\.html'\)return 'clinical'/);
});

test('all 31 clinical materials remain present with complete article structure', () => {
  assert.equal(articles.length, 31);
  assert.equal(ids.size, 31);
  for (const a of articles) {
    assert.ok(a.title.length > 5, a.id);
    assert.ok(a.summary.length > 15, a.id);
    assert.ok(a.sections.length >= 2, a.id);
    assert.ok(a.sections.every(s=>s.title&&s.items.length), a.id);
    assert.ok(['Симптомы','Синдромы','Заболевания','Неотложные состояния'].includes(a.category), a.id);
  }
});

test('clinical recommendations use Russian sources and the corrected official information URL', () => {
  assert.match(app, /Российские клинические рекомендации/);
  assert.match(app, /https:\/\/minzdrav\.gov\.ru\/smartphone_apps_rubrikator_kr/);
  assert.doesNotMatch(app, /smartphone_apps_rubrikator_kr\./);
  assert.doesNotMatch(app, /https:\/\/cr\.minzdrav\.gov\.ru\/(?:preview-cr|view-cr)\//);
  for (const id of ['814_1','295_4','810_1','165_2','742_2','617_5','741','290_2']) {
    assert.ok(app.includes(id),id);
  }
  assert.match(app, /зарубежные источники не используются/i);
});

test('no removed examination, dark mode or theme switch comes back', () => {
  assert.doesNotMatch(app, /function renderExam\(|function bindExam\(|neurodesk-exam-draft/);
  assert.doesNotMatch(home+clinical, /Невроосмотр|theme-toggle|Переключить тему/);
  assert.doesNotMatch(baseCss+css, /body\.dark/);
  assert.match(baseCss, /\.sidebar\{background:#fff/);
});

test('navigation remains accessible on small screens', () => {
  assert.match(home, /id="sidebar-close"/);
  assert.match(clinical, /id="sidebar-close"/);
  assert.match(app, /addEventListener\('click',closeSidebar\)/);
  assert.match(baseCss, /body\.sidebar-open:before/);
  assert.match(css, /\.app-shell\{grid-template-columns:1fr\}/);
});

test('library wording stays Russian-language and avoids foreign shortcut names', () => {
  const raw = librarySource.replace(/id:'[^']+'/g,'');
  assert.doesNotMatch(raw, /McDonald|myasthenia gravis|déjà vu|jamais vu|HINTS|FAST|last known well|head impulse|MND|ALS|NMOSD|MOGAD|AQP4|SUNCT|SUNA|ABCD2/i);
  assert.match(raw, /диагностические критерии рассеянного склероза/);
});

test('medical literature policy identifies official Russian sources', async () => {
  const literature = await readFile(new URL('docs/LITERATURE.md',root),'utf8');
  assert.match(literature, /Минздрава России/);
  assert.doesNotMatch(literature, /NICE|NHS|NCBI|PubMed|McGraw Hill|Oxford University Press|LWW/);
});
