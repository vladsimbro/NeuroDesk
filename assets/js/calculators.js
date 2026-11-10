export const GCS_COMPONENTS = {
  eye: { label: 'Открывание глаз', short: 'E', max: 4, options: [
    { value: 4, label: 'Спонтанно' }, { value: 3, label: 'На звук' }, { value: 2, label: 'На давление' }, { value: 1, label: 'Отсутствует' }
  ]},
  verbal: { label: 'Речевая реакция', short: 'V', max: 5, options: [
    { value: 5, label: 'Ориентирован' }, { value: 4, label: 'Спутанная речь' }, { value: 3, label: 'Отдельные слова' }, { value: 2, label: 'Звуки' }, { value: 1, label: 'Отсутствует' }
  ]},
  motor: { label: 'Двигательная реакция', short: 'M', max: 6, options: [
    { value: 6, label: 'Выполняет команды' }, { value: 5, label: 'Локализует давление' }, { value: 4, label: 'Нормальное сгибание / отдёргивание' }, { value: 3, label: 'Патологическое сгибание' }, { value: 2, label: 'Разгибание' }, { value: 1, label: 'Отсутствует' }
  ]}
};
const isValidValue = (key, value) => value === 'NT' || (Number.isInteger(Number(value)) && GCS_COMPONENTS[key].options.some((item) => item.value === Number(value)));
export function calculateGCS(input = {}) {
  const keys = Object.keys(GCS_COMPONENTS);
  const normalized = {};
  for (const key of keys) {
    const value = input[key];
    if (value === undefined || value === null || value === '') return { status: 'incomplete', total: null, components: normalized };
    if (!isValidValue(key, value)) return { status: 'invalid', total: null, components: normalized, invalidComponent: key };
    normalized[key] = value === 'NT' ? 'NT' : Number(value);
  }
  const notTestable = keys.filter((key) => normalized[key] === 'NT');
  if (notTestable.length) return { status: 'not-testable', total: null, components: normalized, notTestable };
  const total = keys.reduce((sum, key) => sum + normalized[key], 0);
  return { status: 'complete', total, components: normalized, notation: 'E' + normalized.eye + ' V' + normalized.verbal + ' M' + normalized.motor };
}
export function formatGCSResult(result) {
  if (!result || result.status !== 'complete') return '';
  return 'ШКГ ' + result.total + '/15 (' + result.notation + ')';
}


export const MRS_OPTIONS = [
{value:0,label:'Нет симптомов',detail:'Симптомы заболевания отсутствуют.'},
{value:1,label:'Нет значимой инвалидизации',detail:'Несмотря на симптомы, пациент способен выполнять все привычные виды деятельности.'},
{value:2,label:'Лёгкая инвалидизация',detail:'Не способен выполнять все прежние привычные виды деятельности в полном объёме, но сохраняет самостоятельность в повседневной жизни.'},
{value:3,label:'Умеренная инвалидизация',detail:'Требуется некоторая помощь, однако пациент способен ходить самостоятельно.'},
{value:4,label:'Умеренно тяжёлая инвалидизация',detail:'Не способен самостоятельно ходить и удовлетворять основные физиологические потребности без помощи.'},
{value:5,label:'Тяжёлая инвалидизация',detail:'Прикован к постели, нуждается в постоянном уходе; выраженная зависимость от посторонней помощи.'},
{value:6,label:'Смерть',detail:'Пациент умер.'}
];
export const GOS_OPTIONS = [
{value:1,label:'Смерть',detail:'Пациент умер.'},
{value:2,label:'Вегетативное состояние',detail:'Сохранены циклы сна и бодрствования и базовые вегетативные функции, но отсутствует осознанный контакт и произвольное поведение.'},
{value:3,label:'Тяжёлая инвалидизация',detail:'Пациент в сознании и доступен контакту, но не способен самостоятельно обслуживать себя и нуждается в постоянной помощи.'},
{value:4,label:'Умеренная инвалидизация',detail:'Пациент самостоятельно себя обслуживает, но неврологические нарушения препятствуют возвращению к полноценной работе или учёбе.'},
{value:5,label:'Хорошее восстановление',detail:'Пациент способен вернуться к прежней работе или обычной деятельности и не нуждается в уходе.'}
];
export const RASS_OPTIONS = [
{value:4,label:'Агрессивен',detail:'Агрессивное, воинственное поведение; непосредственная опасность для окружающих.'},
{value:3,label:'Крайне возбуждён',detail:'Тянет или удаляет катетеры и трубки либо проявляет агрессивное поведение.'},
{value:2,label:'Возбуждён',detail:'Частые нецеленаправленные движения и/или десинхронизация с аппаратом ИВЛ.'},
{value:1,label:'Беспокоен',detail:'Взволнован, движения не энергичные и не агрессивные.'},
{value:0,label:'Бодрствует, спокоен, внимателен',detail:'Спокоен и внимателен.'},
{value:-1,label:'Сонлив',detail:'Не полностью внимателен, но поддерживает зрительный контакт при обращении голосом более 10 секунд.'},
{value:-2,label:'Лёгкая седация',detail:'Кратковременно поддерживает зрительный контакт при обращении голосом менее 10 секунд.'},
{value:-3,label:'Умеренная седация',detail:'Движение или открывание глаз на голос, но без зрительного контакта.'},
{value:-4,label:'Глубокая седация',detail:'Нет реакции на голос, но есть движение в ответ на физическую стимуляцию.'},
{value:-5,label:'Отсутствие пробуждения',detail:'Нет реакции на голос и физическую стимуляцию.'}
];
function scoreFromOptions(value,options){
 if(value===undefined||value===null||value==='') return {status:'incomplete',score:null};
 const score=Number(value);
 if(!Number.isInteger(score)||!options.some(item=>item.value===score)) return {status:'invalid',score:null};
 return {status:'complete',score,option:options.find(item=>item.value===score)};
}
export const calculateMRS=value=>scoreFromOptions(value,MRS_OPTIONS);
export const calculateGOS=value=>scoreFromOptions(value,GOS_OPTIONS);
export const calculateRASS=value=>scoreFromOptions(value,RASS_OPTIONS);


// General-purpose derived calculations. These are arithmetic aids, not treatment rules.
function finitePositive(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}
export function calculateBMI(weightKg, heightCm) {
  const weight = finitePositive(weightKg), height = finitePositive(heightCm);
  if (!weight || !height || height < 50 || height > 250 || weight > 500) return { status: 'invalid', value: null };
  const meters = height / 100;
  return { status: 'complete', value: weight / (meters * meters), category: weight / (meters * meters) };
}
export function calculateBSA(weightKg, heightCm) {
  const weight = finitePositive(weightKg), height = finitePositive(heightCm);
  if (!weight || !height || height < 50 || height > 250 || weight > 500) return { status: 'invalid', value: null };
  return { status: 'complete', value: Math.sqrt((height * weight) / 3600), formula: 'Mosteller' };
}
export function calculateMAP(systolic, diastolic) {
  const sbp = finitePositive(systolic), dbp = finitePositive(diastolic);
  if (!sbp || !dbp || sbp > 350 || dbp > 250 || sbp <= dbp) return { status: 'invalid', value: null };
  return { status: 'complete', value: dbp + (sbp - dbp) / 3 };
}
export function calculateABCD2(input = {}) {
  const required = ['age','systolic','diastolic','features','duration','diabetes'];
  if (required.some(key => input[key] === undefined || input[key] === null || input[key] === '')) return { status: 'incomplete', total: null };
  const age = Number(input.age), sbp = Number(input.systolic), dbp = Number(input.diastolic);
  if (!Number.isFinite(age) || age < 0 || age > 120 || !Number.isFinite(sbp) || sbp < 50 || sbp > 300 || !Number.isFinite(dbp) || dbp < 30 || dbp > 200 || sbp <= dbp) return { status: 'invalid', total: null };
  const featurePoints = { unilateral_weakness: 2, speech_without_weakness: 1, other: 0 };
  const durationPoints = { 'lt10': 0, '10to59': 1, 'ge60': 2 };
  if (!(input.features in featurePoints) || !(input.duration in durationPoints) || !['yes','no'].includes(input.diabetes)) return { status: 'invalid', total: null };
  const components = {
    age: age >= 60 ? 1 : 0,
    bloodPressure: sbp >= 140 || dbp >= 90 ? 1 : 0,
    clinicalFeatures: featurePoints[input.features],
    duration: durationPoints[input.duration],
    diabetes: input.diabetes === 'yes' ? 1 : 0
  };
  return { status: 'complete', total: Object.values(components).reduce((a,b)=>a+b,0), components, maximum: 7 };
}
