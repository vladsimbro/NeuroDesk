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
