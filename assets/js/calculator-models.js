/* NeuroDesk calculators — standalone, local-only, no personal data persistence.
 * SCORE2 and SCORE2-OP are independent implementations from published model parameters.
 * Original model author implementation used for coefficient verification:
 * https://github.com/skkceu/stata/tree/main (score2risk.ado, score2oprisk.ado).
 * Not the ESC HeartScore application; never use as an autonomous clinical decision engine.
 */
export const SCORE2_COEFFICIENTS={
 male:{age:.3742,smoke:.6012,sbp:.2777,total:.1458,hdl:-.2698,ageSmoke:-.0755,ageSbp:-.0255,ageTotal:-.0281,ageHdl:.0426,base:.9605},
 female:{age:.4648,smoke:.7744,sbp:.3131,total:.1002,hdl:-.2606,ageSmoke:-.1088,ageSbp:-.0277,ageTotal:-.0226,ageHdl:.0613,base:.9776}
};
export const SCORE2OP_COEFFICIENTS={
 male:{age:.0633767915,smoke:.3523957899,sbp:.0094362177,total:.0849594156,hdl:-.3563571842,ageSmoke:-.0247205945,ageSbp:-.0004794522,ageTotal:.0073336663,ageHdl:.0091317857,base:1-.24235298,mean:.09285225},
 female:{age:.0789191229,smoke:.4921147010,sbp:.0101993091,total:.0604939598,hdl:-.3040280248,ageSmoke:-.0255496313,ageSbp:-.0004404728,ageTotal:-.0009121461,ageHdl:.0153779923,base:1-.19178759,mean:.2287676}
};
export const SCORE2_RECALIBRATION={
 male:{low:[-.569857,.747593],moderate:[-.156481,.800869],high:[.320717,.936004],very_high:[.583578,.829368]},
 female:{low:[-.737966,.701868],moderate:[-.314269,.770149],high:[.570963,.936893],very_high:[.941177,.832923]}
};
export const SCORE2OP_RECALIBRATION={
 male:{low:[-.343484,1.193038],moderate:[.005320,1.248514],high:[.084305,1.151902],very_high:[.045959,.703625]},
 female:{low:[-.516054,1.007238],moderate:[-.101044,1.099621],high:[.375720,1.089031],very_high:[.379293,.691530]}
};
const assertNumber=(value,min,max,label)=>{
 if(value===''||value===null||value===undefined)throw Error('Заполни поле «'+label+'».');
 const n=Number(value);
 if(!Number.isFinite(n)||n<min||n>max)throw Error(label+': допустимый диапазон '+min+'–'+max+'.');
 return n;
};
export function calcScore2({age,sex,smoker,sbp,total,hdl,region,diabetes=false,ascvd=false,ckd=false}){
 if(ascvd)throw Error('SCORE2 / SCORE2-OP не применяются при установленном атеросклеротическом сердечно-сосудистом заболевании.');
 if(diabetes)throw Error('При сахарном диабете нужна подходящая модель, например SCORE2-Diabetes; обычные SCORE2 / SCORE2-OP здесь не рассчитываются.');
 if(ckd)throw Error('При хронической болезни почек риск оценивается отдельно; стандартные SCORE2 / SCORE2-OP не подходят.');
 const a=assertNumber(age,40,89,'Возраст');
 if(!Number.isInteger(a))throw Error('Возраст укажи целым числом.');
 if(!['male','female'].includes(sex))throw Error('Укажи пол.');
 if(!['low','moderate','high','very_high'].includes(region))throw Error('Укажи регион риска.');
 if(typeof smoker!=='boolean')throw Error('Укажи статус курения.');
 const pressure=assertNumber(sbp,90,220,'Систолическое давление');
 const tc=assertNumber(total,2,12,'Общий холестерин');
 const hc=assertNumber(hdl,.3,4,'Холестерин ЛПВП');
 if(hc>=tc)throw Error('ЛПВП должен быть меньше общего холестерина.');
 const isOP=a>=70;
 const c=(isOP?SCORE2OP_COEFFICIENTS:SCORE2_COEFFICIENTS)[sex],s=smoker?1:0;
 let lp,raw;
 if(isOP){
  const ageC=a-73, bpC=pressure-150,tcC=tc-6,hdlC=hc-1.4;
  lp=c.age*ageC+c.smoke*s+c.sbp*bpC+c.total*tcC+c.hdl*hdlC
    +c.ageSmoke*s*ageC+c.ageSbp*bpC*ageC+c.ageTotal*tcC*ageC+c.ageHdl*hdlC*ageC;
  raw=1-Math.pow(c.base,Math.exp(lp-c.mean));
 }else{
  const ageC=(a-60)/5,bpC=(pressure-120)/20,tcC=tc-6,hdlC=(hc-1.3)/.5;
  lp=c.age*ageC+c.smoke*s+c.sbp*bpC+c.total*tcC+c.hdl*hdlC
    +c.ageSmoke*s*ageC+c.ageSbp*bpC*ageC+c.ageTotal*tcC*ageC+c.ageHdl*hdlC*ageC;
  raw=1-Math.pow(c.base,Math.exp(lp));
 }
 if(!(raw>0&&raw<1))throw Error('Не удалось получить корректную вероятность по модели.');
 const [scale1,scale2]=(isOP?SCORE2OP_RECALIBRATION:SCORE2_RECALIBRATION)[sex][region];
 const probability=1-Math.exp(-Math.exp(scale1+scale2*Math.log(-Math.log(1-raw))));
 if(!(probability>=0&&probability<=1))throw Error('Некорректный результат перекалибровки.');
 const percent=probability*100;
 const thresholds=a<50?[2.5,7.5]:a<70?[5,10]:[7.5,15];
 const category=percent<thresholds[0]?'Низкий или умеренный риск':percent<thresholds[1]?'Высокий риск':'Очень высокий риск';
 return {model:isOP?'SCORE2-OP':'SCORE2',percent,probability,category,thresholds,lp,raw,region};
}
export function calcGCS({eye,verbal,motor,pupils}){
 const pick=(n,max,label)=>n==='NT'?null:assertNumber(n,1,max,label);
 const e=pick(eye,4,'Глаза'),v=pick(verbal,5,'Речь'),m=pick(motor,6,'Движение');
 if(e!==null&& !Number.isInteger(e)||v!==null&&!Number.isInteger(v)||m!==null&&!Number.isInteger(m))throw Error('Компоненты GCS должны быть целыми.');
 const sum=[e,v,m].some(x=>x===null)?null:e+v+m;
 const p=assertNumber(pupils,0,2,'Отсутствующие реакции зрачков');
 if(!Number.isInteger(p))throw Error('Зрачковый показатель должен быть целым.');
 return {total:sum,gcsp:sum===null?null:sum-p,components:'E'+(e??'NT')+' V'+(v??'NT')+' M'+(m??'NT'),pupils:p};
}
export function calcABCD2({age,pressure,weakness,speech,duration,diabetes}){
 let score=0;
 if(age>=60)score++;
 if(pressure)score++;
 if(weakness)score+=2;
 else if(speech)score++;
 if(duration>=60)score+=2;else if(duration>=10)score++;
 if(diabetes)score++;
 return score;
}
export function calcICH({gcs,age,volume,ivh,infratentorial}){
 if(![...Array(13)].some((_,i)=>gcs===i+3))throw Error('GCS должен быть от 3 до 15.');
 return (gcs<=4?2:gcs<=12?1:0)+(age>=80?1:0)+(volume>=30?1:0)+(ivh?1:0)+(infratentorial?1:0);
}
export const SCALE_DEFS=[
 {id:'score2',group:'Риск',title:'SCORE2 / SCORE2-OP',subtitle:'10-летний сердечно-сосудистый риск',detail:'Для оценки первичного сердечно-сосудистого риска у людей 40–89 лет. Модель выбирается автоматически: SCORE2 в 40–69 лет, SCORE2-OP в 70–89 лет. Применяется региональная перекалибровка по ESC 2021.',sources:[['ESC — модели и ограничения','https://www.escardio.org/guidelines/practice-tools/cvd-prevention-toolbox/score2-and-score2-op-calculators/'],['SCORE2 — исходная публикация','https://doi.org/10.1093/eurheartj/ehab309'],['SCORE2-OP — исходная публикация','https://doi.org/10.1093/eurheartj/ehab312']],fields:[
  {key:'age',label:'Возраст, лет',type:'number',min:40,max:89,step:1},
  {key:'sex',label:'Пол',type:'select',options:[['','Выбери'],['male','Мужской'],['female','Женский']]},
  {key:'region',label:'Регион сердечно-сосудистого риска ESC',type:'select',options:[['','Выбери'],['very_high','Очень высокий (Россия и др.)'],['high','Высокий'],['moderate','Умеренный (Финляндия и др.)'],['low','Низкий']]},
  {key:'smoker',label:'Курение сейчас',type:'select',options:[['','Выбери'],['yes','Да'],['no','Нет']]},
  {key:'sbp',label:'Систолическое АД, мм рт. ст.',type:'number',min:90,max:220,step:1},
  {key:'total',label:'Общий холестерин, ммоль/л',type:'number',min:2,max:12,step:.1},
  {key:'hdl',label:'Холестерин ЛПВП, ммоль/л',type:'number',min:.3,max:4,step:.1},
  {key:'ascvd',label:'Установленное атеросклеротическое ССЗ',type:'select',options:[['','Выбери'],['yes','Да'],['no','Нет']]},
  {key:'diabetes',label:'Сахарный диабет',type:'select',options:[['','Выбери'],['yes','Да'],['no','Нет']]},
  {key:'ckd',label:'Хроническая болезнь почек',type:'select',options:[['','Выбери'],['yes','Да'],['no','Нет']]}
 ],note:'Независимая вычислительная реализация по опубликованным коэффициентам, не официальный HeartScore и не сертифицированное медицинское ПО. Не использовать для решения о лечении без проверки исходной методики и клинического контекста.'},
 {id:'gcs',group:'Сознание',title:'GCS / GCS-P',subtitle:'Шкала комы Глазго и реакция зрачков',detail:'Отдельная оценка открывания глаз, речи, двигательного ответа и двусторонней реакции зрачков. При невозможности проверить компонент его следует отметить NT; суммарный показатель тогда не рассчитывается.',sources:[['Официальный сайт шкалы Глазго','https://www.glasgowcomascale.org/faq/']],fields:[
  {key:'eye',label:'Открывание глаз (E)',type:'select',options:[['','Выбери'],['4','Спонтанно · 4'],['3','На звук · 3'],['2','На давление · 2'],['1','Отсутствует · 1'],['NT','Невозможно проверить (NT)']]},
  {key:'verbal',label:'Речевой ответ (V)',type:'select',options:[['','Выбери'],['5','Ориентирован · 5'],['4','Спутанная речь · 4'],['3','Отдельные слова · 3'],['2','Звуки · 2'],['1','Нет ответа · 1'],['NT','Невозможно проверить (NT)']]},
  {key:'motor',label:'Двигательный ответ (M)',type:'select',options:[['','Выбери'],['6','Выполняет команды · 6'],['5','Локализует боль · 5'],['4','Нормальное сгибание · 4'],['3','Патологическое сгибание · 3'],['2','Разгибание · 2'],['1','Нет ответа · 1'],['NT','Невозможно проверить (NT)']]},
  {key:'pupils',label:'Сколько зрачков не реагируют на свет? (GCS-P)',type:'select',options:[['','Выбери'],['0','Ни один · 0'],['1','Один · 1'],['2','Оба · 2']]}
 ],note:'Компонентная запись важнее одной суммы. NT не заменяют значением 1.'},
 {id:'mrs',group:'Инсульт',title:'mRS — Рэнкин',subtitle:'Функциональная независимость после инсульта',detail:'Выбор одной из категорий модифицированной шкалы Рэнкина. Балл — это клиническое описание функционального состояния, а не сумма отдельных симптомов.',sources:[['mRS — описание шкалы','https://www.strokeengine.ca/en/assessments/modified-rankin-scale-mrs/']],fields:[
  {key:'grade',label:'Функциональное состояние',type:'select',options:[['','Выбери'],['0','0 — нет симптомов'],['1','1 — симптомы без значимых ограничений'],['2','2 — не может выполнять все прежние дела, но независим'],['3','3 — требуется помощь, ходит самостоятельно'],['4','4 — не ходит самостоятельно, нуждается в помощи для личных потребностей'],['5','5 — тяжёлая зависимость, постоянный уход'],['6','6 — смерть']]}
 ],note:'Для стандартизированной оценки предпочтительна структурированная беседа; одна строка не заменяет полный протокол.'},
 {id:'abcd2',group:'Инсульт',title:'ABCD²',subtitle:'Прогноз после предполагаемой ТИА',detail:'Возраст, артериальное давление, клинические признаки, продолжительность эпизода и сахарный диабет. Шкала НЕ предназначена для исключения ТИА и не определяет срочность обследования самостоятельно.',sources:[['Статья об ABCD²','https://pubmed.ncbi.nlm.nih.gov/17258668/']],fields:[
  {key:'age',label:'Возраст',type:'select',options:[['','Выбери'],['0','Младше 60'],['60','60 и старше']]},
  {key:'pressure',label:'АД ≥140/90 при первичном осмотре',type:'select',options:[['','Выбери'],['no','Нет'],['yes','Да']]},
  {key:'symptom',label:'Клинические симптомы',type:'select',options:[['','Выбери'],['weakness','Односторонняя слабость'],['speech','Нарушение речи без слабости'],['other','Другие проявления']]},
  {key:'duration',label:'Длительность эпизода',type:'select',options:[['','Выбери'],['0','Менее 10 минут'],['10','10–59 минут'],['60','60 минут и более']]},
  {key:'diabetes',label:'Сахарный диабет',type:'select',options:[['','Выбери'],['no','Нет'],['yes','Да']]}
 ],note:'Низкий балл не исключает клинически опасную ТИА. Не использовать как единственное основание отказа в срочной оценке.'},
 {id:'ich',group:'Инсульт',title:'ICH Score',subtitle:'Тяжесть спонтанного внутримозгового кровоизлияния',detail:'Пять факторов: GCS, возраст, объём гематомы, внутрижелудочковый компонент и инфратенториальная локализация.',sources:[['Исходная публикация ICH Score','https://pubmed.ncbi.nlm.nih.gov/11283388/']],fields:[
  {key:'gcs',label:'GCS (3–15)',type:'number',min:3,max:15,step:1},
  {key:'age',label:'Возраст, лет',type:'number',min:0,max:120,step:1},
  {key:'volume',label:'Объём внутримозговой гематомы, мл',type:'number',min:0,max:500,step:.1},
  {key:'ivh',label:'Внутрижелудочковое кровоизлияние',type:'select',options:[['','Выбери'],['no','Нет'],['yes','Да']]},
  {key:'infratentorial',label:'Инфратенториальная локализация',type:'select',options:[['','Выбери'],['no','Нет'],['yes','Да']]}
 ],note:'Не использовать балл для решений об отказе от лечения или ограничении реанимационных мероприятий.'},
 {id:'nrs',group:'Боль',title:'NRS',subtitle:'Числовая шкала интенсивности боли',detail:'Самооценка интенсивности боли по целому числу от 0 до 10. Уточняй, оценивается ли боль сейчас, за сутки или в другом указанном периоде.',sources:[['Обзор методов оценки боли — IASP','https://www.iasp-pain.org/resources/fact-sheets/assessment-of-pain/']],fields:[
  {key:'value',label:'Интенсивность боли (0–10)',type:'number',min:0,max:10,step:1},
  {key:'period',label:'За какой период?',type:'select',options:[['','Выбери'],['Сейчас','Сейчас'],['За последние сутки','За последние 24 часа'],['Максимальная за неделю','Максимальная за неделю']]}
 ],note:'Оценка всегда субъективная: её нельзя подменять предполагаемой тяжестью диагноза.'},
 {id:'mrc',group:'Мышцы',title:'MRC Sum Score',subtitle:'Сумма оценки мышечной силы, 0–60',detail:'Оценка шести пар мышечных групп справа и слева, каждая по 0–5. Получается суммарный балл до 60. Если хотя бы один компонент не оценён, сумма не рассчитывается.',sources:[['MRC — публикация о суммарной оценке','https://pubmed.ncbi.nlm.nih.gov/8038438/']],fields:[...['Отведение плеча','Сгибание локтя','Разгибание запястья','Сгибание бедра','Разгибание колена','Тыльное сгибание стопы'].flatMap((name,i)=>['Правая','Левая'].map((side,j)=>({key:'m'+(i*2+j),label:name+' · '+side,type:'select',options:[['','Выбери'],...Array.from({length:6},(_,v)=>[String(v),String(v)+' / 5'])]})))],note:'Надёжность оценки зависит от стандартизации положения и техники; суммарный балл не заменяет неврологический осмотр.'},
 {id:'map',group:'Общие',title:'Среднее АД (MAP)',subtitle:'Приближённое среднее артериальное давление',detail:'Расчёт по диастолическому и систолическому АД: ДАД + (САД − ДАД)/3. При выраженных изменениях ЧСС и гемодинамики формула менее точна.',sources:[['Обзор среднего артериального давления','https://www.ncbi.nlm.nih.gov/books/NBK538226/']],fields:[
  {key:'sbp',label:'Систолическое АД, мм рт. ст.',type:'number',min:50,max:300,step:1},
  {key:'dbp',label:'Диастолическое АД, мм рт. ст.',type:'number',min:20,max:200,step:1}
 ],note:'Приближённая оценка по манжеточному давлению, не замена инвазивного мониторинга.'},
 {id:'bmi',group:'Общие',title:'Индекс массы тела',subtitle:'ИМТ по массе и росту',detail:'Расчёт: масса в килограммах / квадрат роста в метрах. Стандартные взрослые пороги не применимы к детям и не учитывают состав тела.',sources:[['ВОЗ — индекс массы тела','https://www.who.int/data/gho/data/themes/topics/topic-details/GHO/body-mass-index']],fields:[
  {key:'weight',label:'Масса тела, кг',type:'number',min:2,max:500,step:.1},
  {key:'height',label:'Рост, см',type:'number',min:50,max:250,step:.1}
 ],note:'ИМТ сам по себе не отражает распределение жира, состав тела и индивидуальный риск.'}
];
export function calculate(id,values){
 const yes=k=>values[k]==='yes';
 const num=k=>{const f=SCALE_DEFS.find(s=>s.id===id)?.fields.find(f=>f.key===k);return assertNumber(values[k],f?.min??-Infinity,f?.max??Infinity,f?.label??k)};
 const integer=k=>{const n=num(k);if(!Number.isInteger(n))throw Error('Поле «'+k+'» должно быть целым числом.');return n};
 const required=k=>{if(!values[k])throw Error('Заполни все обязательные поля.');return values[k]};
 const source=SCALE_DEFS.find(s=>s.id===id);
 if(!source)throw Error('Неизвестная шкала.');
 for(const field of source.fields)required(field.key);
 if(id==='score2'){
  const outcome=calcScore2({age:integer('age'),sex:values.sex,region:values.region,smoker:yes('smoker'),sbp:num('sbp'),total:num('total'),hdl:num('hdl'),ascvd:yes('ascvd'),diabetes:yes('diabetes'),ckd:yes('ckd')});
  return {value:outcome.percent.toFixed(1)+' %',label:outcome.model+' · '+outcome.category,note:'10-летний риск фатального или нефатального сердечно-сосудистого события. Регион: '+{very_high:'очень высокий',high:'высокий',moderate:'умеренный',low:'низкий'}[values.region]+'. Погрешность оценки и клинические ограничения учитывать обязательно.'};
 }
 if(id==='gcs'){
  const outcome=calcGCS({eye:values.eye,verbal:values.verbal,motor:values.motor,pupils:values.pupils});
  return {value:outcome.total===null?'NT':outcome.total+' / 15',label:outcome.components,note:outcome.total===null?'Один или несколько компонентов не проверяются. Суммарный GCS и GCS-P не рассчитываются.':'GCS-P: '+outcome.gcsp+' / 15; число нереагирующих зрачков: '+outcome.pupils+'.'};
 }
 if(id==='mrs'){const n=integer('grade');return {value:n+' / 6',label:n===6?'Смерть':n<=1?'Нет или минимальные ограничения':n<=3?'Лёгкая/умеренная зависимость':'Тяжёлая зависимость',note:'Сохрани описание выбранной категории при документировании.'};}
 if(id==='abcd2'){
  const n=calcABCD2({age:integer('age'),pressure:yes('pressure'),weakness:values.symptom==='weakness',speech:values.symptom==='speech',duration:integer('duration'),diabetes:yes('diabetes')});
  return {value:n+' / 7',label:'ABCD²',note:'Балльная прогностическая оценка; не исключает ТИА и не заменяет экстренный диагностический маршрут.'};
 }
 if(id==='ich'){
  const n=calcICH({gcs:integer('gcs'),age:integer('age'),volume:num('volume'),ivh:yes('ivh'),infratentorial:yes('infratentorial')});
  return {value:n+' / 6',label:'ICH Score',note:'Не использовать балл в качестве единственного основания ограничения интенсивности лечения.'};
 }
 if(id==='nrs'){return {value:integer('value')+' / 10',label:'Боль: '+values.period,note:'Оценка субъективная; при повторном измерении используй тот же период.'};}
 if(id==='mrc'){const values12=Array.from({length:12},(_,i)=>integer('m'+i));return {value:values12.reduce((a,b)=>a+b,0)+' / 60',label:'MRC Sum Score',note:'Правая/левая стороны: '+Array.from({length:6},(_,i)=>values12[i*2]+'/'+values12[i*2+1]).join(' · ')+'.'};}
 if(id==='map'){const s=num('sbp'),d=num('dbp');if(d>=s)throw Error('Диастолическое АД должно быть ниже систолического.');return {value:(d+(s-d)/3).toFixed(1)+' мм рт. ст.',label:'Среднее артериальное давление',note:'Приближённая формула ДАД + (САД − ДАД)/3.'};}
 if(id==='bmi'){const n=num('weight')/Math.pow(num('height')/100,2);return {value:n.toFixed(1)+' кг/м²',label:n<18.5?'Ниже обычного диапазона':n<25?'Обычный взрослый диапазон':n<30?'Избыточная масса тела':'Ожирение по ИМТ',note:'Взрослая классификация; ИМТ не заменяет клиническую оценку.'};}
 throw Error('Нет метода расчёта.');
}
