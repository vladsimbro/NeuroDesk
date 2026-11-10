import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const data=JSON.parse(await readFile(new URL('../assets/data/icd10-v2.27.json',import.meta.url),'utf8'));
const rows=data.records,ids=new Set(rows.map(r=>r[0])),byCode=new Map(rows.map(r=>[r[2],r]));
test('official dataset metadata and complete count',()=>{assert.equal(data.version,'2.27');assert.equal(data.oid,'1.2.643.5.1.13.13.11.1005');assert.equal(rows.length,15038);});
test('unique IDs and valid parent links',()=>{assert.equal(ids.size,rows.length);for(const r of rows)if(r[4])assert.ok(ids.has(r[4]));});
test('known codes are present',()=>{for(const c of ['A00','A00.0','A00.1','F00','F00.0','G43','U07.1'])assert.ok(byCode.has(c),c);});
test('inactive and dual-code metadata is preserved',()=>{assert.equal(rows.filter(r=>r[6]==='0').length,101);assert.ok(rows.some(r=>r[5]==='1'));assert.ok(rows.some(r=>r[5]==='2'));});
