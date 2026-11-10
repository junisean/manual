export function readBackup(text){
 const b=JSON.parse(text),d=b.document;const str=(v,max=200000)=>typeof v==='string'&&v.length<=max;const image=v=>v==null||str(v,60000000)&&/^data:image\/(png|jpeg|webp|bmp);base64,/.test(v);
 if(b.format!=='gyeol-backup-1'||!d||!str(d.id,100)||!str(d.title,1000)||!str(d.subtitle??'',5000)||!Array.isArray(d.categories)||!Array.isArray(d.sources)||d.categories.length>1000||d.sources.length>1000)throw Error('올바른 작업 백업 파일이 아닙니다.');
 for(const c of d.categories){if(!str(c.id,100)||!str(c.title,1000)||!Array.isArray(c.items)||c.items.length>20000)throw Error('카테고리 형식을 확인하세요.');for(const i of c.items)if(!str(i.id,100)||!str(i.text)||!['task','note'].includes(i.kind))throw Error('업무 항목 형식을 확인하세요.');}
 for(const s of d.sources){if(!str(s.id,100)||!str(s.name,1000)||!Array.isArray(s.blocks)||!image(s.image)||(s.images&&!s.images.every(image)))throw Error('첨부 자료 형식을 확인하세요.');for(const p of s.blocks)if(!str(p.text,5000000))throw Error('원문 형식을 확인하세요.');}
 return d;
}
