// Pure indexing and navigation logic for the Russian ICD-10 dataset.
// All labels and parent links come from the loaded NSI dataset; no invented inclusions/exclusions.
export const ICD_CHAPTERS=[
 ['I','A00-B99','Некоторые инфекционные и паразитарные болезни'],
 ['II','C00-D48','Новообразования'],
 ['III','D50-D89','Болезни крови и отдельные нарушения иммунитета'],
 ['IV','E00-E90','Болезни эндокринной системы и обмена веществ'],
 ['V','F00-F99','Психические расстройства и расстройства поведения'],
 ['VI','G00-G99','Болезни нервной системы'],
 ['VII','H00-H59','Болезни глаза и его придаточного аппарата'],
 ['VIII','H60-H95','Болезни уха и сосцевидного отростка'],
 ['IX','I00-I99','Болезни системы кровообращения'],
 ['X','J00-J99','Болезни органов дыхания'],
 ['XI','K00-K93','Болезни органов пищеварения'],
 ['XII','L00-L99','Болезни кожи и подкожной клетчатки'],
 ['XIII','M00-M99','Болезни костно-мышечной системы и соединительной ткани'],
 ['XIV','N00-N99','Болезни мочеполовой системы'],
 ['XV','O00-O99','Беременность, роды и послеродовой период'],
 ['XVI','P00-P96','Отдельные состояния перинатального периода'],
 ['XVII','Q00-Q99','Врождённые аномалии, деформации и хромосомные нарушения'],
 ['XVIII','R00-R99','Симптомы, признаки и отклонения от нормы'],
 ['XIX','S00-T98','Травмы, отравления и другие последствия воздействия внешних причин'],
 ['XX','V01-Y98','Внешние причины заболеваемости и смертности'],
 ['XXI','Z00-Z99','Факторы, влияющие на состояние здоровья и обращения за медицинской помощью'],
 ['XXII','U00-U85','Коды для специальных целей']
];
export const normalizeText=value=>String(value??'').normalize('NFKC').toLocaleLowerCase('ru-RU').replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export const normalizeCode=value=>String(value??'').normalize('NFKC').toUpperCase().replace(/\s/g,'').replace(/[–—]/g,'-').replace(/[^A-Z0-9.-]/g,'');
export const isCurrent=item=>item.actual!=='0';
const collator=new Intl.Collator('en',{numeric:true});
export const compareICD=(a,b)=>collator.compare(a.code,b.code)||a.name.localeCompare(b.name,'ru');
function bounds(range){
 const [a,b]=String(range).split('-');
 return [a,b];
}
export function inChapter(code,range){
 const [a,b]=bounds(range),head=normalizeCode(code).match(/^[A-Z]\d{2}/)?.[0];
 return Boolean(a&&b&&head&&head>=a&&head<=b);
}
export function chapterOf(code){
 return ICD_CHAPTERS.find(chapter=>inChapter(code,chapter[1]))||null;
}
export function createICDIndex(payload){
 if(payload?.version!=='2.27'||!Array.isArray(payload.records)||payload.records.length!==15038)throw Error('Проверка целостности МКБ-10 не пройдена: требуется версия 2.27, 15 038 записей.');
 const records=payload.records.map((r,i)=>{
  const record={id:String(r[0]),recCode:String(r[1]??''),code:String(r[2]??''),name:String(r[3]??''),parentId:r[4]==null?'':String(r[4]),addlCode:String(r[5]??''),actual:String(r[6]??'1'),date:String(r[7]??''),position:i};
  record.codeKey=normalizeCode(record.code);
  record.searchText=normalizeText(record.name+' '+record.recCode+' '+record.code);
  record.words=normalizeText(record.name).split(' ');
  return record;
 });
 const byId=new Map(),byCode=new Map(),childrenByParent=new Map();
 for(const item of records){
  if(byId.has(item.id))throw Error('В базе повторяется идентификатор МКБ-10.');
  byId.set(item.id,item);
  if(!byCode.has(item.codeKey))byCode.set(item.codeKey,item);
  if(item.parentId){
   if(!childrenByParent.has(item.parentId))childrenByParent.set(item.parentId,[]);
   childrenByParent.get(item.parentId).push(item);
  }
 }
 for(const item of records)if(item.parentId&&!byId.has(item.parentId))throw Error('Нарушена иерархия записей МКБ-10.');
 for(const children of childrenByParent.values())children.sort(compareICD);
 return {records,byId,byCode,childrenByParent};
}
export function getICDByCode(index,code){return index.byCode.get(normalizeCode(code))||null;}
export function getAncestors(index,item){
 const ancestors=[],seen=new Set([item.id]);
 let parentId=item.parentId;
 while(parentId&&ancestors.length<40&&!seen.has(parentId)){
  seen.add(parentId);
  const parent=index.byId.get(parentId);
  if(!parent)break;
  ancestors.unshift(parent);
  parentId=parent.parentId;
 }
 return ancestors;
}
export function getChildren(index,item,includeInactive=false){
 return (index.childrenByParent.get(item.id)||[]).filter(x=>includeInactive||isCurrent(x));
}
export function chapterItems(index,range,includeInactive=false){
 return index.records.filter(item=>inChapter(item.code,range)&&(includeInactive||isCurrent(item))).sort(compareICD);
}
export function chapterGroups(index,range,includeInactive=false){
 const list=chapterItems(index,range,includeInactive);
 const blocks=list.filter(item=>/^[A-Z]\d{2}-[A-Z]\d{2}$/.test(item.codeKey));
 if(blocks.length)return blocks;
 return list.filter(item=>/^[A-Z]\d{2}$/.test(item.codeKey));
}
function relevance(item,term,tokens,codeQuery){
 if(codeQuery&&item.codeKey===codeQuery)return 0;
 if(codeQuery&&item.codeKey.startsWith(codeQuery))return 1;
 const name=normalizeText(item.name);
 if(name===term)return 2;
 if(name.startsWith(term))return 3;
 if(item.words.some(w=>w===term))return 4;
 if(item.words.some(w=>w.startsWith(term)))return 5;
 if(name.includes(term))return 6;
 if(codeQuery&&item.codeKey.includes(codeQuery))return 7;
 if(tokens.every(t=>item.searchText.includes(t)))return 8;
 return 9;
}
export function searchICD(index,query,{includeInactive=false,chapterRange=''}={}){
 const term=normalizeText(query),codeQuery=normalizeCode(query);
 const tokens=term.split(' ').filter(Boolean);
 if(!tokens.length&&!chapterRange)return [];
 const results=index.records.filter(item=>{
  if(!includeInactive&&!isCurrent(item))return false;
  if(chapterRange&&!inChapter(item.code,chapterRange))return false;
  if(!tokens.length)return true;
  return tokens.every(token=>item.searchText.includes(token))||Boolean(codeQuery&&item.codeKey.includes(codeQuery));
 });
 return results.sort((a,b)=>tokens.length?relevance(a,term,tokens,codeQuery)-relevance(b,term,tokens,codeQuery)||compareICD(a,b):compareICD(a,b));
}
