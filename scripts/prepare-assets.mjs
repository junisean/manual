import {mkdir,copyFile,readdir,cp} from 'node:fs/promises';
import path from 'node:path';
const dest=path.resolve('public');await mkdir(dest+'/fonts',{recursive:true});await mkdir(dest+'/ocr',{recursive:true});
async function find(dir,predicate){for(const x of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,x.name);if(x.isDirectory()){const found=await find(p,predicate);if(found)return found;}else if(predicate(p))return p;}}
const font=await find('node_modules/@expo-google-fonts/noto-sans-kr',p=>p.endsWith('_400Regular.ttf'));
if(!font)throw Error('Korean font missing');await copyFile(font,dest+'/fonts/manual.ttf');
await copyFile('node_modules/tesseract.js/dist/worker.min.js',dest+'/ocr/worker.min.js');
await cp('node_modules/tesseract.js-core',dest+'/ocr',{recursive:true,filter:p=>!p.endsWith('package.json')});
for(const lang of ['kor','eng']){const file=await find('node_modules/@tesseract.js-data/'+lang,p=>p.endsWith('.traineddata.gz'));if(!file)throw Error('OCR language missing');await copyFile(file,dest+'/ocr/'+lang+'.traineddata.gz');}
for(const folder of ['cmaps','standard_fonts'])await cp('node_modules/pdfjs-dist/'+folder,dest+'/'+folder,{recursive:true});
console.log('Local OCR, PDF and Korean font assets prepared.');
