// Loaded only for the clinical directory, never for the ICD-10 offline entry.
import {CLINICAL_EXPANSIONS_A} from './clinical-expansions-a.js';
import {CLINICAL_EXPANSIONS_B} from './clinical-expansions-b.js';
import {CLINICAL_EXPANSIONS_C} from './clinical-expansions-c.js';
import {RUS_CLINICAL_DOCUMENTS,RUS_ARTICLE_SOURCES,RUS_SOURCE_REVIEW_DATE,RUS_CLINICAL_REGISTRY,RUS_CLINICAL_PORTAL} from './clinical-evidence.js';
import {CLINICAL_NEW_ARTICLES_A} from './clinical-new-a.js';
import {CLINICAL_NEW_ARTICLES_B} from './clinical-new-b.js';
import {CLINICAL_NEW_ARTICLES_C} from './clinical-new-c.js';
import {CLINICAL_NEW_ARTICLES_D} from './clinical-new-d.js';
import {CLINICAL_NEXT_VASCULAR} from './clinical-next-vascular.js';
import {CLINICAL_NEXT_NEUROMUSCULAR} from './clinical-next-neuromuscular.js';
import {CLINICAL_NEXT_NEUROIMMUNE} from './clinical-next-neuroimmune.js';
import {CLINICAL_NEXT_MOVEMENT_COGNITION} from './clinical-next-movement-cognition.js';
import {CLINICAL_NEXT_HEADACHE_CHILD} from './clinical-next-headache-child.js';
import {CLINICAL_NEXT_VESTIBULAR_SLEEP} from './clinical-next-vestibular-sleep.js';
export const CLINICAL_NEW_ARTICLES=[...CLINICAL_NEW_ARTICLES_A,...CLINICAL_NEW_ARTICLES_B,...CLINICAL_NEW_ARTICLES_C,...CLINICAL_NEW_ARTICLES_D,...CLINICAL_NEXT_VASCULAR,...CLINICAL_NEXT_NEUROMUSCULAR,...CLINICAL_NEXT_NEUROIMMUNE,...CLINICAL_NEXT_MOVEMENT_COGNITION,...CLINICAL_NEXT_HEADACHE_CHILD,...CLINICAL_NEXT_VESTIBULAR_SLEEP];
export const CLINICAL_EXPANSIONS={...CLINICAL_EXPANSIONS_A,...CLINICAL_EXPANSIONS_B,...CLINICAL_EXPANSIONS_C};
export {RUS_CLINICAL_DOCUMENTS,RUS_ARTICLE_SOURCES,RUS_SOURCE_REVIEW_DATE,RUS_CLINICAL_REGISTRY,RUS_CLINICAL_PORTAL};
