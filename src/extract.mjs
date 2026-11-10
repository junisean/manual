import {uid} from './model.mjs';
export const readData=file=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(Error('파일을 읽지 못했습니다.'));r.readAsDataURL(file);});
let workerPromise;
async function ocr(image,onProgress){
 const {createWorker}=await import('tesseract.js');
 workerPromise ||= createWorker(['kor','eng'],1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr',langPath:'/ocr',logger:m=>{if(m.status==='recognizing text')onProgress?.(`글자 읽는 중 ${Math.round(m.progress*100)}%`);}}).catch(e=>{workerPromise=null;throw e;});
 const worker=await workerPromise;const {data}=await worker.recognize(image);return data.text;
}
export async function extract(file,onProgress){
 const source={id:uid(),name:file.name,size:file.size,status:'ready',blocks:[],review:false,image:null};
 if(file.size>40*1024*1024)throw Error('40MB 이하의 파일을 첨부하세요. 큰 문서는 나눠서 올려 주세요.');
 const ext=file.name.split('.').pop().toLowerCase();
 if(['txt','md','csv'].includes(ext)){source.blocks=[{page:1,text:await file.text()}];}
 else if(ext==='docx'){
 const mammoth=await import('mammoth/mammoth.browser');const result=await mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()},{styleMap:["p[style-name='Title'] => h1:fresh"]});
 const html=new DOMParser().parseFromString(result.value,'text/html');
 const embeddedImages=[...html.images].map(i=>i.src).filter(s=>s.startsWith('data:'));
 html.querySelectorAll('table').forEach(table=>{const p=html.createElement('p');p.textContent=[...table.rows].map(row=>'참고: '+[...row.cells].map(cell=>cell.textContent.trim().replace(/\s+/g,' ')).join(' | ')).join('\n');table.replaceWith(p);});
 html.querySelectorAll('ol').forEach(list=>{const start=Number(list.getAttribute('start'))||1;[...list.children].filter(el=>el.tagName==='LI').forEach((el,n)=>el.prepend(`${start+n}. `));});
 html.querySelectorAll('h1,h2,h3,h4').forEach(el=>el.textContent='# '+el.textContent);
 html.querySelectorAll('tr').forEach(el=>el.append('\n'));
 html.querySelectorAll('td,th').forEach(el=>el.append(' | '));
 html.querySelectorAll('p,li,h1,h2,h3,h4').forEach(el=>el.append('\n'));
 source.blocks=[{page:1,text:html.body.textContent}];source.messages=result.messages.map(m=>m.message);source.images=embeddedImages;
 }else if(ext==='pdf'){
 const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).href;
 const loading=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),cMapUrl:'/cmaps/',cMapPacked:true,standardFontDataUrl:'/standard_fonts/'});const pdf=await loading.promise;
 for(let p=1;p<=pdf.numPages;p++){onProgress?.(`${p} / ${pdf.numPages}쪽 읽는 중`);const page=await pdf.getPage(p);const content=await page.getTextContent();let text='';let y;for(const item of content.items){if(item.str===undefined)continue;if(y!==undefined&&Math.abs(y-item.transform[5])>3)text+='\n';text+=item.str+(item.hasEOL?'\n':' ');y=item.transform[5];}
 if(text.trim().length<8){const viewport=page.getViewport({scale:1.8});const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;text=await ocr(canvas,onProgress);source.review=true;}
 source.blocks.push({page:p,text});}await loading.destroy();
 }else if(['png','jpg','jpeg','webp','bmp'].includes(ext)){
 source.image=await readData(file);source.blocks=[{page:1,text:await ocr(source.image,onProgress)}];source.review=true;
 }else throw Error('이 형식은 아직 읽을 수 없습니다. 문서는 DOCX, PDF, TXT로, 사진은 JPG 또는 PNG로 바꿔 주세요.');
 if(!source.blocks.some(b=>b.text.trim()))throw Error('읽을 수 있는 글자를 찾지 못했습니다. 더 선명한 자료를 올리거나 직접 입력하세요.');
 return source;
}
