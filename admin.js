'use strict';
const $=id=>document.getElementById(id);
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const OWNER_LOGIN='aevonmc', OWNER_ID=349076440, REPO='aevonmc/AevonmcWebsite', BRANCH='main';
let auth=null,posts=[],sha='',editing=-1,busy=false;
const utf8ToBase64=s=>{const bytes=new TextEncoder().encode(s);let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary)};
const base64ToUtf8=s=>{const binary=atob(s.replace(/\s/g,''));return new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0)))};
function status(message,kind=''){const el=$('status');el.textContent=message;el.className='notice '+kind}
function errorMessage(e){return e instanceof Error?e.message:String(e)}
async function github(method,path,body){if(!auth)throw Error('Not connected');const res=await fetch('https://api.github.com'+path,{method,headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+auth.token,'X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});let data;try{data=await res.json()}catch{data={}}if(!res.ok)throw Error((data.message||'GitHub request failed')+' (HTTP '+res.status+')');return data}
function filePath(){return '/repos/'+auth.repo+'/contents/posts.json?ref='+encodeURIComponent(auth.branch)}
async function reload(){const data=await github('GET',filePath());if(data.type!=='file'||!data.content||!data.sha)throw Error('posts.json is missing or not a file');const parsed=JSON.parse(base64ToUtf8(data.content));if(!Array.isArray(parsed))throw Error('posts.json must contain an array');posts=parsed;sha=data.sha;render();status('Content loaded from GitHub.','ok')}
async function commit(message){if(busy)return;busy=true;$('save').disabled=true;try{const body={message,content:utf8ToBase64(JSON.stringify(posts,null,2)+'\n'),sha,branch:auth.branch};const data=await github('PUT','/repos/'+auth.repo+'/contents/posts.json',body);if(!data.content?.sha)throw Error('GitHub did not confirm the file update');sha=data.content.sha;status('Published to GitHub. GitHub Pages will update shortly.','ok');$('editor').hidden=true;render()}catch(e){status('Save failed: '+errorMessage(e)+'. If HTTP 403, check token Contents write permission. If HTTP 409, refresh before retrying.','error');throw e}finally{busy=false;$('save').disabled=false}}
function render(){const query=$('filter').value.toLowerCase(),cat=$('category-filter').value;const list=$('post-list');list.replaceChildren();const items=posts.map((p,i)=>({p,i})).filter(({p})=>(!cat||p.category===cat)&&[p.title,p.description,p.content].join(' ').toLowerCase().includes(query));if(!items.length){list.textContent='No posts found.';return}for(const {p,i} of items){const row=document.createElement('div');row.className='post-row';row.innerHTML='<div><strong>'+escapeHtml(p.title)+'</strong><small>'+escapeHtml(p.category)+' · '+escapeHtml(p.server==='lifesteal'?'LifeSteaL':'Survival Economy')+' · '+(p.published?'Published':'Draft')+' · /'+escapeHtml(p.slug)+'</small></div><div class="post-actions"><button type="button" data-edit="'+i+'">Edit</button><button type="button" class="danger" data-delete="'+i+'">Delete</button></div>';list.append(row)}}
function edit(i){editing=i;const p=i<0?{title:'',slug:'',category:'rules',server:'lifesteal',description:'',content:'',published:true}:posts[i];$('server').value=p.server==='lifesteal'?'lifesteal':'survival-economy';$('editor-title').textContent=i<0?'Create new post':'Edit post';$('save').textContent=i<0?'Publish':'Apply Changes';for(const key of ['title','slug','category','description','content'])$(key).value=p[key]||'';loadRichContent(p.content||'');$('editor').hidden=false;$('editor').scrollIntoView({behavior:'smooth',block:'start'})}
function slugify(s){return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100)}
$('title').addEventListener('input',()=>{if(editing===-1&&(!$('slug').value||$('slug').dataset.auto==='yes')){$('slug').value=slugify($('title').value);$('slug').dataset.auto='yes'}});
$('slug').addEventListener('input',()=>{$('slug').dataset.auto='no'});
$('connect-form').addEventListener('submit',async e=>{e.preventDefault();const repo=REPO,branch=BRANCH,token=$('token').value.trim();if(!token){alert('Enter your GitHub access token.');return}auth={repo,branch,token};try{const user=await github('GET','/user');if(user.login?.toLowerCase()!==OWNER_LOGIN||user.id!==OWNER_ID)throw Error('Access denied. Only the original @aevonmc account can connect.');const repoInfo=await github('GET','/repos/'+REPO);if(repoInfo.owner?.id!==OWNER_ID||repoInfo.full_name?.toLowerCase()!==REPO.toLowerCase()||!repoInfo.permissions?.push)throw Error('The token does not have write access to AevonmcWebsite.');await reload();$('token').value='';$('login').hidden=true;$('dashboard').hidden=false;$('logout').hidden=false;$('connected').textContent='@'+OWNER_LOGIN+' · '+repo+' · '+branch;edit(-1)}catch(err){auth=null;alert('Could not connect: '+errorMessage(err))}});
$('logout').addEventListener('click',()=>{auth=null;posts=[];sha='';$('dashboard').hidden=true;$('login').hidden=false;$('logout').hidden=true;$('editor').hidden=true});
$('new-post').addEventListener('click',()=>{$('slug').dataset.auto='yes';edit(-1)});
$('cancel').addEventListener('click',()=>{$('editor').hidden=true});
$('refresh').addEventListener('click',async()=>{if(!confirm('Discard any unsaved edits and reload from GitHub?'))return;try{await reload();$('editor').hidden=true}catch(e){status(errorMessage(e),'error')}});
$('filter').addEventListener('input',render);$('category-filter').addEventListener('change',render);
// Always base mutations on the latest GitHub version, never on an old tab's cached array.
async function latestPosts(){
 const data=await github('GET',filePath());
 if(data.type!=='file'||!data.sha||!data.content)throw Error('Could not load current posts.json');
 const current=JSON.parse(base64ToUtf8(data.content));
 if(!Array.isArray(current))throw Error('Invalid posts.json');
 return {current,remoteSha:data.sha};
}
async function applyMutation(change,message){
 if(busy)return false;
 busy=true;$('save').disabled=true;
 document.querySelectorAll('[data-delete]').forEach(b=>b.disabled=true);
 try{
  const {current,remoteSha}=await latestPosts();
  const result=change(current);
  if(result===false)return false;
  const data=await github('PUT','/repos/'+auth.repo+'/contents/posts.json',{
   message,content:utf8ToBase64(JSON.stringify(current,null,2)+'\n'),sha:remoteSha,branch:auth.branch
  });
  if(!data.content?.sha)throw Error('GitHub did not confirm the update');
  // Verify that the committed file actually contains the requested mutation.
  const check=await latestPosts();
  if(check.remoteSha!==data.content.sha)throw Error('Another update occurred immediately after saving. Refresh and verify.');
  posts=check.current;sha=check.remoteSha;render();$('editor').hidden=true;
  // Notify public pages already open in another tab of this browser.
  try{localStorage.setItem('aevonmc-public-posts-updated',JSON.stringify({posts,at:Date.now()}))}catch{}
  status('Changes applied on GitHub. The public site updates after GitHub Pages deploys (usually within a few minutes).','ok');
  return true;
 }catch(err){status('Changes NOT applied: '+errorMessage(err)+'. Please retry or refresh.','error');return false}
 finally{busy=false;$('save').disabled=false;document.querySelectorAll('[data-delete]').forEach(b=>b.disabled=false)}
}
$('post-list').addEventListener('click',async e=>{
 const button=e.target.closest('button');if(!button||busy)return;
 if(button.dataset.edit!==undefined){edit(Number(button.dataset.edit));return}
 if(button.dataset.delete!==undefined){
  const p=posts[Number(button.dataset.delete)];
  if(!confirm('Permanently delete "'+p.title+'" from '+p.category+'?'))return;
  const ok=await applyMutation(current=>{
   const i=current.findIndex(x=>x.category===p.category&&x.slug===p.slug);
   if(i<0)throw Error('Post already removed or changed. Refresh.');
   current.splice(i,1);
  },'Delete '+p.category+' post: '+p.title);
  if(ok)status('Deleted "'+p.title+'" from GitHub. It will disappear from the public page after deployment.','ok');
 }
});
$('post-form').addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;
 const post={title:$('title').value.trim(),slug:$('slug').value.trim(),category:$('category').value,server:$('server').value,description:$('description').value.trim(),published:true,content:serializeRichContent()};
 if(!post.title||!post.content.trim()||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)){status('Check title, slug and content.','error');return}
 const original=editing<0?null:{category:posts[editing].category,slug:posts[editing].slug};
 const ok=await applyMutation(current=>{
  const index=original?current.findIndex(p=>p.category===original.category&&p.slug===original.slug):-1;
  if(original&&index<0)throw Error('Original post was changed or removed. Refresh before editing.');
  if(current.some((p,i)=>i!==index&&p.category===post.category&&p.slug===post.slug))throw Error('That URL slug already exists in this category.');
  if(index<0)current.push(post);else current[index]={...current[index],...post};
 },(original?'Apply changes to ':'Publish ')+post.category+' post: '+post.title);
 if(ok){const url=new URL('index.html#/'+post.category+'/'+post.server+'/'+encodeURIComponent(post.slug),location.href).href;status('Changes saved and verified on GitHub. Public page (after deployment): '+url,'ok')}
});
// Repository and owner are deliberately fixed to the verified GitHub account.

// WYSIWYG: formatting changes the editable content immediately, not markup in a textarea.
const rich=$('rich-content');
const RICH_MARKER='<!--aevon-rich-v1-->';
const allowedFonts=new Set(Array.from($('font-family').options,o=>o.value));
function legacyToHtml(source){
 const escape=s=>escapeHtml(s);
 const format=s=>escape(s).replace(/\{\{color:(#[0-9a-fA-F]{6})\|([^{}\n]+)\}\}/g,'<span style="color:$1">$2</span>')
 .replace(/\{\{font:([^|{}\n]+)\|([^{}\n]+)\}\}/g,(m,f,t)=>allowedFonts.has(f)?'<span style="font-family:'+f+'">'+t+'</span>':m)
 .replace(/\{\{size:(\d{2})\|([^{}\n]+)\}\}/g,(m,n,t)=>Number(n)>=10&&Number(n)<=72?'<span style="font-size:'+n+'px">'+t+'</span>':m)
 .replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/\+\+([^+\n]+)\+\+/g,'<u>$1</u>')
 .replace(/\*([^*\n]+)\*/g,'<em>$1</em>').replace(/`([^`\n]+)`/g,'<code>$1</code>')
 .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2">$1</a>');
 return String(source).split(/\r?\n/).map(line=>{const t=line.trim();if(!t)return '<p><br></p>';
 const img=t.match(/^!\[([^\]]*)\]\((assets\/uploads\/[a-zA-Z0-9._-]+\.(?:png|jpg|jpeg|gif|webp))\)$/i);
 if(img)return '<p><img src="'+img[2]+'" alt="'+escape(img[1])+'"></p>';
 const h=t.match(/^(#{1,3})\s+(.+)$/);if(h)return '<h'+(h[1].length+1)+'>'+format(h[2])+'</h'+(h[1].length+1)+'>';
 return '<p>'+format(t)+'</p>'}).join('');
}
function loadRichContent(source){rich.innerHTML=source.startsWith(RICH_MARKER)?source.slice(RICH_MARKER.length):legacyToHtml(source);$('content').value=source;}
function serializeRichContent(){return RICH_MARKER+rich.innerHTML;}
rich.addEventListener('input',()=>{$('content').value=serializeRichContent()});
function command(name,value){rich.focus();document.execCommand(name,false,value);rich.dispatchEvent(new Event('input',{bubbles:true}));}
function applySpanStyle(style,value){
 rich.focus();const selection=window.getSelection();if(!selection||!selection.rangeCount)return;
 const range=selection.getRangeAt(0);if(!rich.contains(range.commonAncestorContainer))return;
 if(range.collapsed){status('Select some text first, then apply formatting.','error');return;}
 const span=document.createElement('span');span.style[style]=value;
 try{range.surroundContents(span)}catch{const fragment=range.extractContents();span.append(fragment);range.insertNode(span)}
 selection.removeAllRanges();const next=document.createRange();next.selectNodeContents(span);selection.addRange(next);
 rich.dispatchEvent(new Event('input',{bubbles:true}));
}
function insertHtml(html){rich.focus();document.execCommand('insertHTML',false,html);rich.dispatchEvent(new Event('input',{bubbles:true}));}
document.querySelectorAll('[data-format]').forEach(btn=>btn.addEventListener('click',()=>{
 const kind=btn.dataset.format;
 if(kind==='bold')command('bold');else if(kind==='italic')command('italic');else if(kind==='underline')command('underline');
 else if(kind==='heading')command('formatBlock','h2');
 else if(kind==='color')applySpanStyle('color',$('text-color').value);
 else if(kind==='link'){const url=prompt('Link URL (https://...)');if(url&&/^https?:\/\//i.test(url))command('createLink',url)}
}));
$('apply-font').addEventListener('click',()=>applySpanStyle('fontFamily',$('font-family').value));
$('apply-size').addEventListener('click',()=>applySpanStyle('fontSize',$('font-size').value+'px'));
const emojiList='😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😍 🥰 😘 😎 🤩 🥳 😭 😢 😡 🤔 🫡 😴 💖 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💯 ✨ ⭐ 🌟 🔥 🎉 🎊 🎮 🕹️ 🏆 👑 💎 ⚔️ 🛡️ 🏹 🐉 ☁️ 🌈 🌸 🌺 🌻 🌍 👍 👎 👏 🙌 💪 🤝 🙏 👀 📢 📌 📜 📖 🚀 ✅ ❌ ⚠️'.split(' ');
for(const emoji of emojiList){const b=document.createElement('button');b.type='button';b.textContent=emoji;b.title=emoji;b.addEventListener('click',()=>{insertHtml(emoji)});$('emoji-picker').append(b)}
$('emoji-toggle').addEventListener('click',()=>{$('emoji-picker').hidden=!$('emoji-picker').hidden});
$('image-upload').addEventListener('click',()=>$('image-file').click());
$('image-file').addEventListener('change',async()=>{const file=$('image-file').files[0];if(file)await uploadImage(file);$('image-file').value=''});
rich.addEventListener('paste',async e=>{const file=Array.from(e.clipboardData?.files||[]).find(f=>f.type.startsWith('image/'));if(file){e.preventDefault();await uploadImage(file)}});
async function uploadImage(file){
 if(!auth){$('upload-status').textContent='Connect to GitHub first.';return}
 const types={'image/png':'png','image/jpeg':'jpg','image/gif':'gif','image/webp':'webp'};
 const ext=types[file.type];if(!ext){$('upload-status').textContent='Supported: PNG, JPG, GIF and WebP.';return}
 if(file.size>5*1024*1024){$('upload-status').textContent='Images must be 5 MB or smaller.';return}
 const uploadButton=$('image-upload');uploadButton.disabled=true;
 $('upload-status').textContent='Uploading image to GitHub...';
 try{
  const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  const name='assets/uploads/'+Date.now()+'-'+Array.from(crypto.getRandomValues(new Uint8Array(6)),x=>x.toString(16).padStart(2,'0')).join('')+'.'+ext;
  await github('PUT','/repos/'+REPO+'/contents/'+name,{message:'Upload post image '+name,content:btoa(binary),branch:BRANCH});
  insertHtml('<p><img src="'+name+'" alt="Screenshot"></p>');
  $('upload-status').textContent='Image uploaded and inserted. Save your post to publish it.';
 }catch(err){$('upload-status').textContent='Image upload failed: '+errorMessage(err)}finally{uploadButton.disabled=false}
}

rich.addEventListener('paste',e=>{if(Array.from(e.clipboardData?.files||[]).some(f=>f.type.startsWith('image/')))return;e.preventDefault();const value=e.clipboardData?.getData('text/plain')||'';insertHtml(escapeHtml(value).replace(/\r?\n/g,'<br>'))});
