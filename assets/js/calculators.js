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
