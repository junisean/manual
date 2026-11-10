export const uid=()=>crypto.randomUUID();
export const blank=()=>({id:uid(),title:'새 매뉴얼',subtitle:'',categories:[],sources:[],updatedAt:Date.now()});
export function parseSource(source){
 const categories=[];let current;let n=0;
 for(const block of source.blocks||[]){
 for(const raw of block.text.split('\n')){const text=raw.trim();if(!text)continue;n++;
 const heading=/^#{1,4}\s+(.+)$/.exec(text)||/^\[([^\]]+)\]$/.exec(text);
 if(heading){current={id:uid(),title:heading[1],items:[]};categories.push(current);continue;}
 if(!current){current={id:uid(),title:source.name.replace(/\.[^.]+$/,''),items:[]};categories.push(current);}
 const ordered=/^(?:\d+[.)]|[①-⑳])\s*/.test(text);
 const clean=text.replace(/^(?:[-*]\s+|\[[ xX]\]\s*|[☐☑]\s*|\d+[.)]\s*|[①-⑳]\s*)/,'');
 const note=/^(?:참고|주의|금지|설명|조건|예외)\s*[:：]/.test(clean);
 current.items.push({id:uid(),text:clean,kind:note?'note':'task',checked:false,review:source.review||/[?？]|판독 불가|확인 필요/.test(clean),reviewReason:source.review?'자동 인식한 원문을 확인하세요.':'',sourceId:source.id,sourceName:source.name,page:block.page||1,line:n,original:clean,ordered,edited:false});
 }}return categories.filter(c=>c.items.length);
}
export function compile(doc){
 const key=i=>`${i.sourceId}:${i.line}`;
 const generated=doc.sources.filter(s=>s.status==='ready').flatMap(parseSource);
 const fresh=new Map(generated.flatMap(c=>c.items).map(i=>[key(i),i]));
 const existing=new Set(doc.categories.flatMap(c=>c.items).map(key));
 const seen=new Set(doc.seenSourceKeys||[]);
 // Preserve category names, ordering, manual additions and explicit deletions.
 const groups=doc.categories.map(c=>({...c,items:c.items.map(old=>{
 if(!old.sourceId)return old;const next=fresh.get(key(old));if(!next)return {...old,review:true,reviewReason:'연결된 원문이 삭제되거나 바뀌었습니다. 내용을 확인하세요.'};
 const changed=old.original!==next.original;
 return {...next,...old,text:old.edited?old.text:next.text,original:next.original,checked:changed?false:old.checked,review:changed?true:old.review,reviewReason:changed?'원문이 바뀌었습니다. 내용을 다시 확인하세요.':old.reviewReason};
 })}));
 for(const c of generated){const additions=c.items.filter(i=>!existing.has(key(i))&&!seen.has(key(i)));if(!additions.length)continue;let group=groups.find(g=>g.title===c.title);if(group)group.items.push(...additions);else groups.push({...c,items:additions});}
 return {...doc,categories:groups,seenSourceKeys:[...new Set([...seen,...fresh.keys()])],updatedAt:Date.now()};
}
export const totals=d=>{const items=d.categories.flatMap(c=>c.items);const tasks=items.filter(i=>i.kind==='task');return {all:items.length,tasks:tasks.length,done:tasks.filter(i=>i.checked).length,review:items.filter(i=>i.review).length};};
export const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
