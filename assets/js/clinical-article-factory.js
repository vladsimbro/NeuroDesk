// Russian-language original clinical navigation articles.
// They are editorial reviews, not approved treatment protocols or excerpts from guidance.
export function makeClinicalArticle({id,title,category,tags,summary,sections}){
 if(!id||!title||!Array.isArray(sections)||sections.length<4)throw Error('Invalid clinical article');
 return {id,title,category,tags,updated:'Клинический обзор · РФ',summary,
  sections:sections.map(([title,items])=>({title,items})),sources:[]};
}
