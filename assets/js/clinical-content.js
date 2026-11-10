// Loaded only for the clinical directory, never for the ICD-10 offline entry.
import {CLINICAL_EXPANSIONS_A} from './clinical-expansions-a.js';
import {CLINICAL_EXPANSIONS_B} from './clinical-expansions-b.js';
import {CLINICAL_EXPANSIONS_C} from './clinical-expansions-c.js';
import {RUS_CLINICAL_DOCUMENTS,RUS_ARTICLE_SOURCES,RUS_SOURCE_REVIEW_DATE,RUS_CLINICAL_REGISTRY} from './clinical-evidence.js';
export const CLINICAL_EXPANSIONS={...CLINICAL_EXPANSIONS_A,...CLINICAL_EXPANSIONS_B,...CLINICAL_EXPANSIONS_C};
export {RUS_CLINICAL_DOCUMENTS,RUS_ARTICLE_SOURCES,RUS_SOURCE_REVIEW_DATE,RUS_CLINICAL_REGISTRY};
