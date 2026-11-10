/**
 * NeuroDesk calculator input presentation: native accessible controls, no patient data saved.
 * Clinical scoring is not done here. Keeping input UI separate makes all 11 forms testable.
 */
export const CHOICE_FIELDS=Object.freeze({
 gcs:['eye','verbal','motor','pupils'],
 abcd2:['age','pressure','symptom','duration','diabetes'],
 ich:['ivh','infratentorial'],
 fourat:['alertness','orientation','attention','change'],
 rass:['grade'],
 nrs:['value','period']
});

export const FIELD_SECTIONS=Object.freeze({
 score2:[
  {title:'01 · Исходные данные',description:'Определи профиль и регион риска, для которого оценивается вероятность.',fields:['age','sex','region','smoker']},
  {title:'02 · Измерения',description:'Вводи измеренные значения, холестерин — строго в ммоль/л.',fields:['sbp','total','hdl']},
  {title:'03 · Применимость модели',description:'Эти состояния требуют отдельной оценки и блокируют обычный SCORE2.',fields:['ascvd','diabetes','ckd']}
 ],
 gcs:[
  {title:'01 · Три компонента GCS',description:'Выбери лучший наблюдаемый ответ; NT — если оценить компонент действительно невозможно.',fields:['eye','verbal','motor']},
  {title:'02 · Реакция зрачков',description:'Для GCS-P отдельно укажи число зрачков без реакции на свет.',fields:['pupils']}
 ],
 abcd2:[{title:'Критерии ABCD²',description:'Для предполагаемой ТИА: укажи каждый признак, не суммируя одновременно слабость и нарушение речи.',fields:['age','pressure','symptom','duration','diabetes']}],
 ich:[
  {title:'01 · Клинические показатели',description:'Возраст и уровень сознания на момент исходной оценки.',fields:['gcs','age']},
  {title:'02 · Данные нейровизуализации',description:'Объём гематомы и её распространение определяются по инструментальному исследованию.',fields:['volume','ivh','infratentorial']}
 ],
 fourat:[{title:'Четыре компонента 4AT',description:'При невозможности проверить AMT4 или внимание есть отдельный вариант; отсутствие ответа не означает ноль.',fields:['alertness','orientation','attention','change']}],
 rass:[{title:'Наблюдаемое состояние',description:'Сначала наблюдение, затем реакция на голос и при необходимости на физическую стимуляцию.',fields:['grade']}],
 nrs:[{title:'Самооценка боли',description:'Число выбирает пациент; указывай тот же временной период при повторных измерениях.',fields:['value','period']}],
 map:[{title:'Измеренное артериальное давление',description:'Введи два значения в мм рт. ст.; рассчитанное MAP — только приближение.',fields:['sbp','dbp']}],
 bmi:[{title:'Антропометрия',description:'Расчёт и интерпретация для взрослых, не для детей и беременности.',fields:['weight','height']}]
});

const optionList=field=>field.options?.filter(pair=>pair[0]!=='')??[];
const canTile=(tool,field)=>CHOICE_FIELDS[tool.id]?.includes(field.key);
const safeKey=key=>String(key).replace(/[^a-z0-9_-]/gi,'');
function hintMarkup(field,hint,escapeHtml){
 return hint?'<p class="calc-field-hint" id="calc-help-'+safeKey(field.key)+'">'+escapeHtml(hint)+'</p>':'';
}
function choices(tool,field,hint,escapeHtml){
 const list=field.type==='number'&&field.key==='value'&&tool.id==='nrs'
  ?Array.from({length:11},(_,n)=>[String(n),String(n)]):optionList(field);
 const className=tool.id==='rass'?' calc-choice-group--long':tool.id==='nrs'&&field.key==='value'?' calc-choice-group--nrs':'';
 return '<fieldset class="calc-field calc-field--choice" data-field="'+escapeHtml(field.key)+'">'+
  '<legend class="calc-field-title">'+escapeHtml(field.label)+'</legend>'+
  '<div class="calc-choice-group'+className+'" role="group" aria-label="'+escapeHtml(field.label)+'">'+
  list.map(([value,label],i)=>'<span class="calc-choice-item"><input type="radio" name="'+escapeHtml(field.key)+'" id="calc-'+safeKey(field.key)+'-'+i+'" value="'+escapeHtml(value)+'" required'+(hint?' aria-describedby="calc-help-'+safeKey(field.key)+'"':'')+'><label class="calc-choice-label" for="calc-'+safeKey(field.key)+'-'+i+'"><span class="calc-choice-mark" aria-hidden="true"></span><span>'+escapeHtml(label)+'</span></label></span>').join('')+
  '</div>'+hintMarkup(field,hint,escapeHtml)+'</fieldset>';
}
function nativeField(field,hint,escapeHtml){
 const key=safeKey(field.key);
 const desc=hint?' aria-describedby="calc-help-'+key+'"':'';
 const label='<label class="calc-field-title" for="calc-'+key+'">'+escapeHtml(field.label)+'</label>';
 const content=field.type==='select'
  ?'<select id="calc-'+key+'" name="'+escapeHtml(field.key)+'" required'+desc+'><option value="" disabled selected>Выбери вариант</option>'+
   optionList(field).map(([value,text])=>'<option value="'+escapeHtml(value)+'">'+escapeHtml(text)+'</option>').join('')+'</select>'
  :'<input type="text" id="calc-'+key+'" name="'+escapeHtml(field.key)+'" inputmode="'+(field.step===1?'numeric':'decimal')+'" autocomplete="off" spellcheck="false" required'+desc+' placeholder="'+(field.step===1?'Целое число':'Число, можно через запятую')+'"'+
   (Number.isFinite(field.min)?' data-min="'+field.min+'"':'')+(Number.isFinite(field.max)?' data-max="'+field.max+'"':'')+'>'; 
 return '<div class="calc-field" data-field="'+escapeHtml(field.key)+'">'+label+content+hintMarkup(field,hint,escapeHtml)+'</div>';
}
function renderMrc(tool,hints,escapeHtml){
 const groups=[];
 for(let i=0;i<tool.fields.length;i+=2){
  const right=tool.fields[i],left=tool.fields[i+1];
  const groupTitle=right.label.split(' · ')[0];
  groups.push('<fieldset class="calc-mrc-group"><legend>'+String(i/2+1).padStart(2,'0')+' · '+escapeHtml(groupTitle)+'</legend><div class="calc-mrc-sides">'+
   [right,left].map(field=>nativeField({...field,label:field.label.includes('Правая')?'Правая сторона':'Левая сторона'},hints?.[field.key],escapeHtml)).join('')+
   '</div></fieldset>');
 }
 return '<section class="calc-input-section"><h3>Шесть мышечных групп · справа и слева</h3><p>Для каждой группы оцени силу по шкале 0–5. Сначала одну сторону, затем другую; пустые значения не считаются нулём.</p><div class="calc-mrc-list">'+groups.join('')+'</div></section>';
}
export function renderCalculatorFields(tool,guide,escapeHtml){
 const hints=guide?.hints||{};
 if(tool.id==='mrc')return renderMrc(tool,hints,escapeHtml);
 const byKey=new Map(tool.fields.map(f=>[f.key,f]));
 const sections=FIELD_SECTIONS[tool.id]||[{title:'Параметры оценки',description:'Выбери ответы, затем рассчитай итог.',fields:tool.fields.map(f=>f.key)}];
 return sections.map(section=>'<section class="calc-input-section"><h3>'+escapeHtml(section.title)+'</h3><p>'+escapeHtml(section.description)+'</p><div class="calc-fields'+(tool.id==='rass'?' calc-fields--single':'')+'">'+
  section.fields.map(key=>{
   const field=byKey.get(key);
   if(!field)throw Error('Unknown calculator field '+key);
   return canTile(tool,field)?choices(tool,field,hints[key],escapeHtml):nativeField(field,hints[key],escapeHtml);
  }).join('')+'</div></section>').join('');
}
export function readFieldValue(form,field){
 if(field.type==='select'||field.type==='number'){
  // Can be radios too (RASS, NRS, GCS...).
  const selected=form.querySelector('input[type="radio"][name="'+field.key+'"]:checked');
  if(form.querySelector('input[type="radio"][name="'+field.key+'"]'))return selected?.value??'';
 }
 const control=form.elements.namedItem(field.key);
 return control?.value?.trim?.()??'';
}
export function completionState(form,tool){
 const complete=tool.fields.filter(field=>readFieldValue(form,field)!=='').length;
 return {complete,total:tool.fields.length,percent:Math.round(100*complete/tool.fields.length)};
}
export function missingField(form,tool){
 return tool.fields.find(field=>readFieldValue(form,field)==='')||null;
}
export function displayScoreProgress(tool,outcome,escapeHtml){
 const ranges={gcs:[3,15],abcd2:[0,7],ich:[0,6],fourat:[0,12],nrs:[0,10],mrc:[0,60]};
 const range=ranges[tool.id];
 if(!range)return '';
 const value=Number.parseInt(String(outcome.value),10);
 if(!Number.isFinite(value))return ''; // GCS with NT cannot show total.
 const [min,max]=range,percentage=Math.max(0,Math.min(100,100*(value-min)/(max-min)));
 return '<div class="calc-score-visual" aria-label="Положение значения на шкале от '+min+' до '+max+'">'+
 '<div class="calc-score-track" aria-hidden="true"><span style="width:'+percentage.toFixed(1)+'%"></span></div>'+
 '<div class="calc-score-bounds"><span>'+min+'</span><strong>'+escapeHtml(outcome.value)+'</strong><span>'+max+'</span></div>'+
 '<p>Положение балла на шкале — наглядное представление, не отдельная диагностическая категория.</p></div>';
}
