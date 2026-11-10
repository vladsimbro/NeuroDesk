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

test('clinical library contains 31 sourced neurology articles', () => {
  const start = app.indexOf('const CLINICAL_LIBRARY=');
  const end = app.indexOf('function renderClinical()', start);
  const library = app.slice(start, end);
  const entries = library.match(/\{id:'[^']+'/g) || [];
  assert.equal(entries.length, 31);
  for (const topic of ['Острый инсульт','Транзиторная ишемическая атака','Первый эпилептический приступ','Эпилептический статус','Паркинсонизм','Рассеянный склероз','Делирий','Когнитивное снижение','Нейропатическая боль','Невралгия тройничного нерва','Болезнь двигательного нейрона','Острая слабость мимических мышц','радикулопатия','Атаксия','Тремор','Обморок','Кластерная головная боль','Миастения','Оптический неврит','Шейная миелопатия','Менингит','Дистальная симметричная полинейропатия','Острый миелит','Диплопия','Птоз','Нарушение походки','Дисфагия']) {
    assert.ok(library.toLocaleLowerCase('ru-RU').includes(topic.toLocaleLowerCase('ru-RU')), topic);
  }
  assert.match(library, /sources:\[/);
});

test('clinical articles support deep links and table of contents', () => {
  assert.match(app, /new URLSearchParams\(location\.search\)\.get\('article'\)/);
  assert.match(app, /history\.replaceState\(null,'','\?article='/);
  assert.match(app, /clinical-article-toc/);
  assert.match(app, /id="clinical-section-/);
});

test('clinical reference supports token search, category filters and expandable articles', () => {
  for (const feature of ['clinical-query','clinical-filters','clinical-results','data-clinical-filter','data-clinical-open','clinical-article-section','Первоисточники']) {
    assert.ok(app.includes(feature), feature);
  }
  assert.match(app, /tokens\.every\(token=>corpus\.includes\(token\)\)/);
  assert.match(css, /\.clinical-results/);
  assert.match(css, /\.clinical-article-section/);
});
