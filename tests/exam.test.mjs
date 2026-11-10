import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

test('neurological examination is a real third route', () => {
  assert.match(app, /function renderExam\(\)/);
  assert.match(app, /function bindExam\(\)/);
  assert.match(app, /exam:\{title:'Осмотр',render:renderExam\}/);
  assert.match(html, /data-route="exam"/);
});

test('exam supports structured fields, side-specific MRC and reflex scoring', () => {
  for (const field of ['complaints','history','cranial','sensation','coordination','conclusion','plan']) {
    assert.ok(app.includes('name="'+field+'"'), field);
  }
  assert.match(app, /type==='reflex'\?\['0','1','2','3','4'\]/);
  assert.match(app, /type==='reflex'\?\['0','1','2','3','4'\]:\['0','1','2','3','4','5'\]/);
});

test('exam draft persists locally and supports export, copy and print', () => {
  for (const feature of ['localStorage.setItem(storageKey','localStorage.getItem(storageKey','navigator.clipboard.writeText','new Blob(','window.print()']) {
    assert.ok(app.includes(feature), feature);
  }
  assert.match(app, /Черновик сформирован NeuroDesk/);
});

test('exam layout has responsive and print styles', () => {
  assert.match(css, /\.exam-layout/);
  assert.match(css, /@media\(max-width:600px\)/);
  assert.match(css, /@media print/);
});

test('clinical reference is a searchable fourth route with sourced neurology topics', () => {
  assert.match(app, /function renderClinical\(\)/);
  assert.match(app, /function bindClinical\(\)/);
  assert.match(app, /clinical:\{title:'Клинический справочник',render:renderClinical\}/);
  assert.match(html, /data-route="clinical"/);
  for (const topic of ['Головная боль: первичная оценка','Острое головокружение и вертиго','Слабость в конечностях','Онемение и парестезии']) {
    assert.ok(app.includes(topic), topic);
  }
  assert.match(app, /www\.nice\.org\.uk\/guidance\/cg150/);
  assert.match(app, /www\.nice\.org\.uk\/guidance\/ng127/);
  assert.match(app, /www\.saem\.org\/publications\/grace\/grace-3/);
});

test('clinical reference supports full-text search, category filters and expandable articles', () => {
  for (const feature of ['clinical-query','clinical-filters','clinical-results','data-clinical-filter','data-clinical-open','clinical-article-section','Первоисточники']) {
    assert.ok(app.includes(feature), feature);
  }
  assert.match(css, /\.clinical-results/);
  assert.match(css, /\.clinical-article-section/);
  assert.match(css, /body\.dark \.clinical-notice/);
});

test('clinical reference now includes a broad set of sourced neurology topics', () => {
  const start = app.indexOf('const CLINICAL_LIBRARY=');
  const end = app.indexOf('function renderClinical()', start);
  const library = app.slice(start, end);
  const entries = library.match(/\{id:'[^']+'/g) || [];
  assert.equal(entries.length, 19);
  for (const topic of ['Острый инсульт','Транзиторная ишемическая атака','Первый эпилептический приступ','Эпилептический статус','Паркинсонизм','Рассеянный склероз','Делирий','Когнитивное снижение','Нейропатическая боль','Невралгия тройничного нерва','Болезнь двигательного нейрона','Острая слабость мимических мышц','радикулопатия','Атаксия','Тремор']) {
    assert.ok(library.toLocaleLowerCase('ru-RU').includes(topic.toLocaleLowerCase('ru-RU')), topic);
  }
  assert.match(app, /data-clinical-filter="Заболевания"/);
  assert.match(app, /data-clinical-filter="Неотложные состояния"/);
});

test('clinical search matches separate partial tokens across the material and ranks title matches first', () => {
  assert.match(app, /const tokens=q\.split\(\/\[\\\\s,;\]\+\/u\)/);
  assert.match(app, /tokens\.every\(token=>corpus\.includes\(token\)\)/);
  assert.match(app, /title\.startsWith\(q\)/);
});
