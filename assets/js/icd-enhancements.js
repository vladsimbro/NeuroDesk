import {chapterItems,compareICD,getICDByCode,isCurrent,normalizeText,normalizeCode} from './icd-core.js';

// Search shortcuts are discovery aids, NOT code assignment or official synonym metadata.
// Deliberately map broad terms to 3-character rubric headings only.
export const ICD_SEARCH_HINTS=[
 {terms:['ишемический инсульт','инсульт ишемический','инфаркт головного мозга'],codes:['I63'],label:'Инфаркт мозга'},
 {terms:['геморрагический инсульт','внутримозговое кровоизлияние'],codes:['I61'],label:'Внутримозговое кровоизлияние'},
 {terms:['тиа','транзиторная ишемическая атака'],codes:['G45'],label:'Преходящие церебральные ишемические приступы'},
 {terms:['паркинсон','болезнь паркинсона'],codes:['G20'],label:'Болезнь Паркинсона'},
 {terms:['рассеянный склероз'],codes:['G35'],label:'Рассеянный склероз'},
 {terms:['эпилепсия'],codes:['G40'],label:'Эпилепсия'},
 {terms:['мигрень'],codes:['G43'],label:'Мигрень'},
 {terms:['головная боль'],codes:['R51'],label:'Головная боль'}
];
export function getICDSearchHints(index,query,{includeInactive=false,chapterRange=''}={}){
 const text=normalizeText(query);
 if(text.length<3)return [];
 const groups=ICD_SEARCH_HINTS.filter(entry=>entry.terms.some(term=>{
  const norm=normalizeText(term);
  return norm===text||(text.length>=5&&norm.startsWith(text));
 }));
 const found=[];
 for(const group of groups){
  for(const code of group.codes){
   const item=getICDByCode(index,code);
   if(!item||(!includeInactive&&!isCurrent(item)))continue;
   const chapter=chapterRange&&item.code.match(/^[A-Z]\d{2}/)?.[0];
   if(chapterRange&&!(chapter&&chapter>=chapterRange.slice(0,3)&&chapter<=chapterRange.slice(-3)))continue;
   if(!found.some(row=>row.item.id===item.id))found.push({item,label:group.label});
  }
 }
 return found;
}

const wordCache=new WeakMap();
function wordsIn(index){
 if(wordCache.has(index))return wordCache.get(index);
 const frequencies=new Map();
 for(const record of index.records){
  for(const word of normalizeText(record.name).split(' ')){
   if(word.length<4||/\d/.test(word))continue;
   frequencies.set(word,(frequencies.get(word)||0)+1);
  }
 }
 wordCache.set(index,frequencies);
 return frequencies;
}
// Bounded Levenshtein distance with early exits; used to *suggest*, not silently correct.
export function limitedDistance(a,b,limit=2){
 if(Math.abs(a.length-b.length)>limit)return limit+1;
 if(a===b)return 0;
 let prev=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  const curr=[i];let min=curr[0];
  for(let j=1;j<=b.length;j++){
   curr[j]=Math.min(curr[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
   if(curr[j]<min)min=curr[j];
  }
  if(min>limit)return limit+1;
  prev=curr;
 }
 return prev[b.length];
}
export function suggestICDQueries(index,query,limit=5){
 const text=normalizeText(query);
 const tokens=text.split(' ').filter(Boolean);
 if(!tokens.length||tokens.length>5)return [];
 const miss=tokens.findLast(t=>t.length>=4);
 if(!miss)return [];
 const maxDistance=miss.length>=8?2:1, options=[];
 for(const [word,count] of wordsIn(index)){
  if(word===miss||word[0]!==miss[0]||Math.abs(word.length-miss.length)>maxDistance)continue;
  const distance=limitedDistance(word,miss,maxDistance);
  if(distance>maxDistance)continue;
  options.push({word,distance,count});
 }
 options.sort((a,b)=>a.distance-b.distance||b.count-a.count||a.word.localeCompare(b.word,'ru'));
 return options.slice(0,limit).map(candidate=>{
  const next=tokens.slice();next[next.lastIndexOf(miss)]=candidate.word;
  return next.join(' ');
 });
}
export function getICDTreeRoots(index,range,includeInactive=false){
 const included=chapterItems(index,range,includeInactive);
 const ids=new Set(included.map(x=>x.id));
 return included.filter(item=>!ids.has(item.parentId)).sort(compareICD);
}
export function getICDTreeChildren(index,item,includeInactive=false){
 return (index.childrenByParent.get(item.id)||[]).filter(child=>includeInactive||isCurrent(child)).sort(compareICD);
}
export function getICDTreeLineage(index,item,range,includeInactive=false){
 const roots=new Set(chapterItems(index,range,includeInactive).map(x=>x.id));
 const lineage=[],seen=new Set([item.id]);
 let parent=item.parentId;
 while(parent&&!seen.has(parent)&&roots.has(parent)){
  seen.add(parent);lineage.unshift(parent);
  parent=index.byId.get(parent)?.parentId;
 }
 return lineage;
}

// Store only classification code strings. Never patient data or input from clinical forms.
export const ICD_FAVORITES_KEY='neurodesk.icd.favorites.v1';
export const ICD_RECENTS_KEY='neurodesk.icd.recent.v1';
export function readCodeList(storage,key,max=30){
 try{
  const parsed=JSON.parse(storage.getItem(key)||'[]');
  if(!Array.isArray(parsed))return [];
  return [...new Set(parsed.filter(code=>typeof code==='string'&&/^[A-Z][0-9]{2}(?:[.\-][A-Z0-9]{1,5})?$/.test(code)))].slice(0,max);
 }catch{return [];}
}
export function writeCodeList(storage,key,codes,max=30){
 const clean=[...new Set(codes.filter(code=>typeof code==='string'&&/^[A-Z][0-9]{2}(?:[.\-][A-Z0-9]{1,5})?$/.test(code)))].slice(0,max);
 try{storage.setItem(key,JSON.stringify(clean));return true;}catch{return false;}
}
