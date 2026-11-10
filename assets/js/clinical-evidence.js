// Ссылки исключительно на российский Рубрикатор клинических рекомендаций.
// Статус и редакция конкретной КР могут измениться: перед практическим применением перепроверь паспорт.
// Official Ministry information page: verified accessible 10.11.2026.
// The document portal itself displays a maintenance notice; /clin-rec and /view-cr/... return 404.
export const RUS_CLINICAL_REGISTRY = 'https://minzdrav.gov.ru/special/smartphone_apps_rubrikator_kr';
export const RUS_CLINICAL_PORTAL = 'https://cr.minzdrav.gov.ru/';
export const RUS_CLINICAL_DOCUMENTS = Object.freeze({
 migraine:{id:'295_4',name:'Мигрень',year:2024,age:'Взрослые',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 tension:{id:'162_3',name:'Головная боль напряжения',year:2024,age:'Взрослые',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 stroke:{id:'814_1',name:'Ишемический инсульт и транзиторная ишемическая атака',year:2024,age:'Взрослые и дети',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 hemorrhage:{id:'523_3',name:'Геморрагический инсульт',year:2025,age:'Взрослые',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 epilepsy:{id:'741_1',name:'Эпилепсия и эпилептический статус у взрослых и детей',year:2022,age:'Взрослые и дети',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 parkinson:{id:'716_1',name:'Болезнь Паркинсона, вторичный паркинсонизм и другие заболевания с синдромом паркинсонизма',year:2022,age:'Взрослые',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 ms:{id:'739_2',name:'Рассеянный склероз',year:2025,age:'Взрослые и дети',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 delirium:{id:'742_2',name:'Делирий у лиц пожилого и старческого возраста',year:2026,age:'Взрослые пожилого возраста',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 dementia:{id:'617_5',name:'Когнитивные расстройства у лиц пожилого и старческого возраста',year:2024,age:'Взрослые пожилого возраста',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 cranial:{id:'895_1',name:'Краниальные мононейропатии у взрослых',year:2024,age:'Взрослые',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 myasthenia:{id:'165_2',name:'Миастения',year:2025,age:'Взрослые и дети',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 radiculopathy:{id:'777_1',name:'Дискогенная пояснично-крестцовая радикулопатия',year:2023,age:'Взрослые',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 degenerative:{id:'826_1',name:'Дегенеративные заболевания позвоночника',year:2024,age:'Взрослые и дети',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 diabetes:{id:'290_2',name:'Сахарный диабет 2 типа у взрослых (раздел о диабетической нейропатии)',year:2022,age:'Взрослые',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 toxic:{id:'998_1',name:'Токсические и метаболические поражения нервной системы',year:2025,age:'Взрослые',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 inflammatory:{id:'358_3',name:'Хроническая воспалительная демиелинизирующая полирадикулонейропатия',year:2024,age:'Дети',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 amyloid:{id:'1077_1',name:'Транстиретиновая семейная амилоидная полинейропатия',year:2026,age:'Взрослые',url:RUS_CLINICAL_REGISTRY,verifiedLink:false},
 tickEncephalitis:{id:'567_2',name:'Клещевой вирусный энцефалит у взрослых',year:2025,age:'Взрослые',url:RUS_CLINICAL_REGISTRY,verifiedLink:false}
});
const link=(doc,kind,scope)=>({doc,kind,scope});
export const RUS_ARTICLE_SOURCES={
 headache:[link('migraine','по заболеванию','КР по мигрени у взрослых'),link('tension','по заболеванию','КР по головной боли напряжения у взрослых')],
 dizziness:[link('stroke','смежная','Применима к оценке подозрения на сосудистую причину; не руководство по всем головокружениям')],
 weakness:[link('stroke','смежная','Только внезапный очаговый дефицит'),link('myasthenia','смежная','Только подозрение на миастенический процесс')],
 sensory:[link('stroke','смежная','Внезапный односторонний дефицит'),link('toxic','смежная','Токсические и метаболические причины; не все парестезии')],
 stroke:[link('stroke','по заболеванию','Ишемический инсульт и ТИА'),link('hemorrhage','по заболеванию','Геморрагический инсульт: отдельная КР')],
 tia:[link('stroke','по заболеванию','ТИА и ишемический инсульт')],
 seizure:[link('epilepsy','по заболеванию','Эпилепсия; первый эпизод требует отдельной диагностической оценки')],
 status:[link('epilepsy','по заболеванию','Эпилептический статус')],
 parkinson:[link('parkinson','по заболеванию','Паркинсонизм и болезнь Паркинсона')],
 ms:[link('ms','по заболеванию','Рассеянный склероз; отличать от других демиелинизирующих заболеваний')],
 delirium:[link('delirium','по заболеванию','Пожилые и старческий возраст: возрастная область КР')],
 dementia:[link('dementia','по заболеванию','Когнитивное снижение пожилого и старческого возраста')],
 'neuropathic-pain':[link('diabetes','смежная','Только диабетическая невропатия'),link('toxic','смежная','Только токсические и метаболические поражения')],
 'trigeminal-neuralgia':[link('cranial','по заболеванию','Краниальные мононейропатии взрослых')],
 mnd:[],
 'facial-palsy':[link('cranial','по заболеванию','Поражения лицевого нерва у взрослых')],
 radiculopathy:[link('radiculopathy','по заболеванию','Дискогенная пояснично-крестцовая радикулопатия взрослых'),link('degenerative','смежная','Дегенеративные заболевания позвоночника, включая часть шейных поражений')],
 ataxia:[link('stroke','смежная','Внезапная атаксия — исключение инсульта')],
 tremor:[link('parkinson','смежная','Только паркинсонический синдром; не все формы тремора')],
 syncope:[],
 'cluster-headache':[link('cranial','смежная','Часть краниальных болевых синдромов; сверить применимость к конкретной цефалгии')],
 myasthenia:[link('myasthenia','по заболеванию','Миастения и миастенический криз')],
 'optic-neuritis':[link('ms','смежная','Оптический неврит в контексте демиелинизирующих заболеваний')],
 'cervical-myelopathy':[link('degenerative','по заболеванию','Дегенеративные заболевания позвоночника; не все причины миелопатии')],
 meningitis:[link('tickEncephalitis','смежная','Только клещевой вирусный энцефалит у взрослых; НЕ общая рекомендация для всех менингитов')],
 polyneuropathy:[link('diabetes','смежная','Только диабетическая полинейропатия'),link('toxic','смежная','Токсические и метаболические поражения'),link('amyloid','смежная','Отдельная наследственная амилоидная форма'),link('inflammatory','смежная','Только дети, отдельная воспалительная форма')],
 myelitis:[link('ms','смежная','Демиелинизация ЦНС; не все острые миелиты')],
 diplopia:[link('myasthenia','смежная','Флюктуирующее двоение при миастении'),link('cranial','смежная','Поражение отдельных черепных нервов у взрослых')],
 ptosis:[link('myasthenia','смежная','Флюктуирующий птоз при миастении'),link('cranial','смежная','Мононейропатии черепных нервов у взрослых')],
 gait:[link('parkinson','смежная','Паркинсоническая походка'),link('dementia','смежная','Когнитивный и функциональный вклад у пожилых')],
 dysphagia:[link('stroke','смежная','Дисфагия в контексте инсульта'),link('myasthenia','смежная','Бульбарные проявления миастении')]
};
// Additional original reviews. Empty mappings deliberately mean that no suitable
// official Russian recommendation has been confirmed for the complete topic.
Object.assign(RUS_ARTICLE_SOURCES,{
 bppv:[],
 'vestibular-neuritis':[link('stroke','смежная','Только исключение сосудистой причины острого вестибулярного синдрома')],
 meniere:[],
 'vestibular-migraine':[link('migraine','смежная','Мигрень у взрослых: КР не охватывает все вестибулярные синдромы')],
 'medication-overuse-headache':[link('migraine','смежная','Частое применение препаратов при мигрени; не все варианты вторичной боли')],
 'subarachnoid-hemorrhage':[link('hemorrhage','смежная','Отдельное кровоизлияние; конкретный раздел КР необходимо уточнять')],
 'intracerebral-hemorrhage':[link('hemorrhage','по заболеванию','Геморрагический инсульт; проверить редакцию и локализацию')],
 'cerebral-venous-thrombosis':[],
 'guillain-barre':[],
 'cidp-adult':[],
 'carpal-tunnel':[],
 'ulnar-neuropathy':[],
 'peroneal-neuropathy':[],
 'restless-legs':[],
 'obstructive-sleep-apnea':[],
 'essential-tremor':[],
 dystonia:[],
 huntington:[],
 'normal-pressure-hydrocephalus':[link('dementia','смежная','Только когнитивный компонент у пожилых; не КР по гидроцефалии')],
 concussion:[]
});
Object.freeze(RUS_ARTICLE_SOURCES);
export const RUS_SOURCE_REVIEW_DATE='10.11.2026';
