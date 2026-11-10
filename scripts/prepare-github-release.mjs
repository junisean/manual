import {cp,mkdir,readFile,writeFile,stat} from 'node:fs/promises';import path from 'node:path';
const root=process.cwd(),destination=path.resolve('../manual-deploy');await mkdir(destination,{recursive:true});
for(const entry of ['src','public','scripts','tests','package.json','package-lock.json','index.html','tokens.css','base.css','README.md'])await cp(path.join(root,entry),path.join(destination,entry),{recursive:true});
const pkg=JSON.parse(await readFile(path.join(destination,'package.json'),'utf8'));pkg.name='manual';pkg.engines={node:'22.x'};await writeFile(path.join(destination,'package.json'),JSON.stringify(pkg,null,2)+'\n');
const lock=JSON.parse(await readFile(path.join(destination,'package-lock.json'),'utf8'));lock.name='manual';lock.packages[''].name='manual';lock.packages[''].engines={node:'22.x'};await writeFile(path.join(destination,'package-lock.json'),JSON.stringify(lock,null,2)+'\n');
await writeFile(path.join(destination,'.gitignore'),'node_modules/\ndist/\n.env*\n.vercel/\noutput/\nqa/\n.hallmark/\n.taste-skill/\n*.zip\n');
await writeFile(path.join(destination,'.nvmrc'),'22\n');
await writeFile(path.join(destination,'vercel.json'),JSON.stringify({$schema:'https://openapi.vercel.sh/vercel.json',framework:'vite',buildCommand:'npm run build',outputDirectory:'dist',installCommand:'npm ci',headers:[{source:'/ocr/(.*)',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]},{source:'/fonts/(.*)',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]}]},null,2)+'\n');
console.log({prepared:destination});
