const postFonts={"Arial": "\"Arial\",sans-serif", "Helvetica": "\"Helvetica\",sans-serif", "Verdana": "\"Verdana\",sans-serif", "Tahoma": "\"Tahoma\",sans-serif", "Trebuchet MS": "\"Trebuchet MS\",sans-serif", "Georgia": "\"Georgia\",serif", "Times New Roman": "\"Times New Roman\",serif", "Garamond": "\"Garamond\",serif", "Courier New": "\"Courier New\",serif", "Lucida Console": "\"Lucida Console\",serif", "Palatino Linotype": "\"Palatino Linotype\",serif", "Segoe UI": "\"Segoe UI\",sans-serif", "Impact": "\"Impact\",sans-serif", "Comic Sans MS": "\"Comic Sans MS\",sans-serif", "Brush Script MT": "\"Brush Script MT\",serif", "Fredoka": "\"Fredoka\",sans-serif", "Roboto": "\"Roboto\",sans-serif", "Open Sans": "\"Open Sans\",sans-serif", "Lato": "\"Lato\",sans-serif", "Montserrat": "\"Montserrat\",sans-serif", "Poppins": "\"Poppins\",sans-serif", "Nunito": "\"Nunito\",sans-serif", "Oswald": "\"Oswald\",sans-serif", "Raleway": "\"Raleway\",sans-serif", "Merriweather": "\"Merriweather\",serif", "Playfair Display": "\"Playfair Display\",serif", "Quicksand": "\"Quicksand\",sans-serif", "Pacifico": "\"Pacifico\",serif", "Lobster": "\"Lobster\",serif", "Bebas Neue": "\"Bebas Neue\",sans-serif", "Inter": "\"Inter\",sans-serif"};
const main=document.getElementById('main');let posts=[];const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const categories={rules:{name:'Rules',icon:'📜',desc:'Everything you need to know about our community rules.'},guides:{name:'Guides',icon:'📖',desc:'Helpful tutorials for your next adventure.'}};function inline(s){
 let v=esc(s);
 // Escape all user content before applying a limited set of supported formatting tokens.
 v=v.replace(/\{\{color:(#[0-9a-fA-F]{6})\|([^{}\n]{1,2000})\}\}/g,(_,color,body)=>'<span style="color:'+color+'">'+body+'</span>');
 // Whitelisted font families and pixel sizes only. The content is already HTML-escaped.
 v=v.replace(/\{\{font:([^|{}\n]{1,50})\|([^{}\n]{1,2000})\}\}/g,(full,name,body)=>Object.hasOwn(postFonts,name)?'<span style="font-family:'+postFonts[name]+'">'+body+'</span>':full);
 v=v.replace(/\{\{size:(\d{2})\|([^{}\n]{1,2000})\}\}/g,(full,n,body)=>Number(n)>=10&&Number(n)<=72?'<span style="font-size:'+Number(n)+'px">'+body+'</span>':full);
 v=v.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>');
 v=v.replace(/\+\+([^+\n]+)\+\+/g,'<u>$1</u>');
 v=v.replace(/\*([^*\n]+)\*/g,'<em>$1</em>');
 v=v.replace(/`([^`]+)`/g,'<code>$1</code>');
 v=v.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)"'<>]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
 return v;
}
const RICH_MARKER='<!--aevon-rich-v1-->';
function safeRichHtml(source){
 const doc=new DOMParser().parseFromString('<div id="safe-root">'+source+'</div>','text/html');
 const root=doc.getElementById('safe-root');
 const tags=new Set(['P','DIV','BR','STRONG','B','EM','I','U','S','H2','H3','H4','UL','OL','LI','BLOCKQUOTE','SPAN','A','IMG','CODE']);
 const fontNames=new Set(Object.keys(postFonts));
 function clean(node){
  if(node.nodeType===Node.TEXT_NODE)return document.createTextNode(node.textContent);
  if(node.nodeType!==Node.ELEMENT_NODE)return document.createDocumentFragment();
  if(!tags.has(node.tagName)){const fragment=document.createDocumentFragment();for(const child of Array.from(node.childNodes))fragment.append(clean(child));return fragment}
  const el=document.createElement(node.tagName.toLowerCase());
  if(node.tagName==='A'){
   const url=node.getAttribute('href')||'';
   if(/^https?:\/\//i.test(url)){el.setAttribute('href',url);el.setAttribute('target','_blank');el.setAttribute('rel','noopener noreferrer')}
  }
  if(node.tagName==='IMG'){
   const src=node.getAttribute('src')||'';
   if(!/^assets\/uploads\/[a-zA-Z0-9._-]+\.(png|jpe?g|gif|webp)$/i.test(src))return document.createDocumentFragment();
   el.setAttribute('src',src);el.setAttribute('alt',(node.getAttribute('alt')||'').slice(0,120));el.setAttribute('loading','lazy');
  }
  const style=node.style;
  if(style){
   if(/^#[0-9a-fA-F]{3,8}$/.test(style.color)||/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(style.color))el.style.color=style.color;
   const size=parseInt(style.fontSize,10);if(/^\d+px$/.test(style.fontSize)&&size>=10&&size<=72)el.style.fontSize=size+'px';
   const family=style.fontFamily.replace(/^['"]|['"]$/g,'');if(fontNames.has(family))el.style.fontFamily=postFonts[family];
   if(style.fontWeight==='bold'||Number(style.fontWeight)>=600)el.style.fontWeight='bold';
   if(style.fontStyle==='italic')el.style.fontStyle='italic';
   if(style.textDecorationLine.includes('underline'))el.style.textDecoration='underline';
  }
  for(const child of Array.from(node.childNodes))el.append(clean(child));return el;
 }
 const output=document.createElement('div');for(const child of Array.from(root.childNodes))output.append(clean(child));return output.innerHTML;
}
function markdown(s){
 if(String(s).startsWith(RICH_MARKER))return safeRichHtml(String(s).slice(RICH_MARKER.length));
 let lines=String(s).split(/\r?\n/),html='',list='';
 function close(){if(list){html+='</'+list+'>';list=''}}
 for(const raw of lines){let l=raw.trim();if(!l){close();continue}let m;
 if(m=l.match(/^!\[([^\]]{0,120})\]\((assets\/uploads\/[a-zA-Z0-9._-]+\.(?:png|jpg|jpeg|gif|webp))\)$/i)){
  close();html+='<figure class="post-image"><img loading="lazy" src="'+m[2]+'" alt="'+esc(m[1])+'"></figure>';
 }else if(m=l.match(/^(#{1,3})\s+(.+)$/)){close();let n=m[1].length;html+=`<h${n+1}>${inline(m[2])}</h${n+1}>`}
 else if(m=l.match(/^[-*]\s+(.+)$/)){if(list!=='ul'){close();html+='<ul>';list='ul'}html+=`<li>${inline(m[1])}</li>`}
 else if(m=l.match(/^\d+\.\s+(.+)$/)){if(list!=='ol'){close();html+='<ol>';list='ol'}html+=`<li>${inline(m[1])}</li>`}
 else if(l.startsWith('> ')){close();html+=`<blockquote>${inline(l.slice(2))}</blockquote>`}
 else{close();html+=`<p>${inline(l)}</p>`}}
 close();return html;
}
// Separate server collections for both Rules and Guides.
const serverCategories={lifesteal:{name:'LifeSteaL',icon:'❤',tagline:'High stakes. Every heart matters.',theme:'lifesteal'},'survival-economy':{name:'Survival Economy',icon:'✦',tagline:'Build, trade, and thrive together.',theme:'economy'}};
// Older posts without a server field remain visible in Survival Economy until reassigned in Admin.
const postServer=p=>serverCategories[p.server]?p.server:'survival-economy';
// Decorative, original Minecraft-inspired pixel scenery (no external images or game assets).
function serverArt(server){
 const life=server==='lifesteal';
 return `<div class="mc-art ${life?'mc-life':'mc-economy'}" aria-hidden="true">
  <div class="mc-sun"></div><div class="mc-cloud mc-cloud-one"></div><div class="mc-cloud mc-cloud-two"></div>
  <div class="mc-hill mc-hill-back"></div><div class="mc-hill mc-hill-front"></div>
  <div class="mc-block mc-block-a"></div><div class="mc-block mc-block-b"></div><div class="mc-block mc-block-c"></div>
  <div class="mc-spark mc-spark-one">${life?'❤':'✦'}</div><div class="mc-spark mc-spark-two">${life?'❤':'✦'}</div>
  <div class="mc-emblem">${life?'❤':'◆'}</div>
 </div>`;
}
function route(){
 let path;try{path=decodeURIComponent(location.hash.slice(1)||'/').replace(/\/+$/,'')||'/'}catch{notFound();return}
 const bits=path.split('/').filter(Boolean),category=bits[0];
 const world=(bits[0]==='rules'||bits[0]==='guides')?bits[1]:null;
 document.body.classList.toggle('world-lifesteal',world==='lifesteal');
 document.body.classList.toggle('world-economy',world==='survival-economy');

 document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===(category||'home')));
 document.title='AevonMC • Rules & Guides';
 if(!bits.length){main.innerHTML=`<section class="hero"><div class="eyebrow">Welcome to the skies</div><div class="hero-connect"><div class="connect-card server-card"><span class="live-count" id="minecraft-online" aria-live="polite">Checking players…</span><strong>aevonsmp.online</strong><button class="copy-server" type="button" data-copy-ip="aevonsmp.online" aria-label="Copy Minecraft server IP">Copy IP?</button></div><h1>Aevon<span>MC</span></h1><div class="connect-card discord-card"><span class="live-count" id="discord-online" aria-live="polite">Checking members…</span><strong>Discord Server</strong><a class="join-discord" href="https://discord.gg/Ad7JVWw5Jp" target="_blank" rel="noopener noreferrer">Click to Join?</a></div></div><p>Explore our server rules and helpful guides. Your next adventure starts here, above the clouds!</p></section><section class="home-grid">${Object.entries(categories).map(([id,c])=>`<a class="category-card" href="#/${id}"><span class="category-icon">${c.icon}</span><div><h2>${c.name}</h2><p>${c.desc}</p></div><span class="arrow">➜</span></a>`).join('')}</section>`;refreshLiveCounts();return}
 if(!categories[category]){notFound();return}
 const c=categories[category];
 if(bits.length===1){main.innerHTML=`<section class="page-heading"><div class="eyebrow">Choose your server</div><h1>${c.icon} ${c.name}</h1><p>Select a server to explore its ${c.name.toLowerCase()}.</p></section><section class="server-choices">${Object.entries(serverCategories).map(([id,v])=>`<a class="server-choice ${v.theme}" href="#/${category}/${id}">${serverArt(id)}<div class="server-choice-content"><span class="server-choice-icon">${v.icon}</span><h2>${v.name}</h2><p>${v.tagline}</p><span class="server-choice-action">View ${c.name} →</span></div></a>`).join('')}</section>`;return}
 const server=bits[1],v=serverCategories[server];if(!v){notFound();return}
 if(bits.length===2){main.innerHTML=`<section class="server-banner ${v.theme}">${serverArt(server)}<div class="server-banner-content"><div class="eyebrow">${c.name} • AevonMC</div><div class="server-symbol">${v.icon}</div><h1>${v.name}</h1><p>${v.tagline}</p><a class="server-back" href="#/${category}">← Choose another server</a></div></section><div class="toolbar"><input class="search" id="search" placeholder="Search ${v.name} ${c.name.toLowerCase()}..." aria-label="Search posts"><span class="count" id="count"></span></div><section class="posts" id="posts"></section>`;const input=document.getElementById('search');input.addEventListener('input',()=>renderCards(category,server,input.value));renderCards(category,server,'');return}
 if(bits.length!==3){notFound();return}
 const post=posts.find(p=>p.category===category&&postServer(p)===server&&p.slug===bits[2]&&p.published===true);
 if(!post){notFound();return}
 main.innerHTML=`<article class="article"><a class="back" href="#/${category}/${server}">← Back to ${v.name} ${c.name}</a><div class="post-server-label ${v.theme}">${v.icon} ${v.name} • ${c.name}</div><h1>${esc(post.title)}</h1><p class="summary">${esc(post.description||'')}</p><hr><div class="content">${markdown(post.content||'')}</div></article>`;
 document.title=post.title+' • '+v.name+' • AevonMC';
}
function renderCards(cat,server,query){
 const list=document.getElementById('posts'),count=document.getElementById('count');if(!list||!count)return;
 const filtered=posts.filter(p=>p.published===true&&p.category===cat&&postServer(p)===server&&[p.title,p.description,p.content].join(' ').toLowerCase().includes(query.toLowerCase()));
 count.textContent=filtered.length+' post'+(filtered.length===1?'':'s');
 list.innerHTML=filtered.length?filtered.map(p=>`<a class="post-card" href="#/${cat}/${server}/${encodeURIComponent(p.slug)}"><span class="icon">${categories[cat].icon}</span><h2>${esc(p.title)}</h2><p>${esc(p.description||'')}</p><span class="tag">${serverCategories[server].name}</span><span class="read">Read article →</span></a>`).join(''):'<div class="empty">☁ No posts in this server category yet.</div>';
}
function notFound(){main.innerHTML='<div class="empty" style="margin-top:100px"><h2>☁ Lost in the clouds?</h2><p>This page could not be found.</p><a class="button" href="#/">Return home</a></div>'}// Read committed content directly from GitHub, bypassing GitHub Pages deployment lag.
// The public repository is readable without credentials. Never expose admin tokens here.
const LIVE_POSTS_URL='https://raw.githubusercontent.com/aevonmc/AevonmcWebsite/main/posts.json';
const API_POSTS_URL='https://api.github.com/repos/aevonmc/AevonmcWebsite/contents/posts.json?ref=main';
const LOCAL_POSTS_URL='posts.json';
const LIVE_SIGNAL_KEY='aevonmc-public-posts-updated';
let lastPostsCheck=0,postsRequest=null,postsSource='';
function decodeGitHubContents(encoded){
 const binary=atob(encoded.replace(/\s/g,''));
 return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0))));
}
async function getFreshPosts(){
 // GitHub's Contents API reads the committed main-branch file, independent of Pages deployment.
 // A unique URL avoids browser/CDN reuse. Raw GitHub is a backup if the API is rate-limited.
 const stamp=Date.now();let errors=[];
 for(const [url,source] of [[API_POSTS_URL+'&_='+stamp,'GitHub repository'],[LIVE_POSTS_URL+'?v='+stamp,'GitHub raw']]){
  try{
   const response=await fetch(url,{cache:'no-store',headers:{'Accept':'application/vnd.github+json'}});
   if(!response.ok)throw Error('HTTP '+response.status);
   const payload=await response.json();
   const data=source==='GitHub repository'?decodeGitHubContents(payload.content||''):payload;
   if(!Array.isArray(data))throw Error('Invalid posts.json array');
   postsSource=source;return data;
  }catch(err){errors.push(source+': '+err.message)}
 }
 // Never silently show a stale GitHub Pages file as if it were current.
 throw Error('Cannot reach the current GitHub posts.json ('+errors.join('; ')+')');
}
function contentNotice(message){
 let el=document.getElementById('content-sync-notice');
 if(!el){el=document.createElement('div');el.id='content-sync-notice';el.setAttribute('role','status');main.before(el)}
 el.textContent=message;el.hidden=!message;
}
async function refreshPosts(){
 if(postsRequest)return postsRequest;
 postsRequest=(async()=>{
  try{
   const updated=await getFreshPosts();
   const changed=JSON.stringify(updated)!==JSON.stringify(posts);
   posts=updated;lastPostsCheck=Date.now();contentNotice('');
   if(changed){
    const search=document.getElementById('search');const query=search?.value||'';
    route();if(search&&document.getElementById('search')){
     document.getElementById('search').value=query;
     const parts=location.hash.slice(2).split('/');if(categories[parts[0]]&&serverCategories[parts[1]])renderCards(parts[0],parts[1],query);
    }
   }
  }catch(err){contentNotice('Unable to check new posts on GitHub. Showing last loaded content. Please try again later.');console.warn('Unable to refresh posts:',err)}
 })().finally(()=>{postsRequest=null});
 return postsRequest;
}
async function init(){
 document.getElementById('year').textContent=new Date().getFullYear();
 try{posts=await getFreshPosts();lastPostsCheck=Date.now();contentNotice('')}
 catch(err){console.error('Could not load posts:',err);main.innerHTML='<div class="empty">Could not load posts. Please refresh the page.</div>';return}
 window.addEventListener('hashchange',()=>{route();refreshPosts();scrollTo(0,0)});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshPosts()});
 window.addEventListener('focus',()=>{if(Date.now()-lastPostsCheck>3000)refreshPosts()});
 window.addEventListener('storage',event=>{if(event.key===LIVE_SIGNAL_KEY){
  try{const update=JSON.parse(event.newValue||'null');if(Array.isArray(update?.posts)){
   posts=update.posts;lastPostsCheck=Date.now();route();
  }}catch{}refreshPosts();
 }});
 setInterval(()=>{if(!document.hidden&&location.hash.startsWith('#/'))refreshPosts()},60000);
 route();
}
init();
// Homepage server address copy action.
document.addEventListener('click',async event=>{const button=event.target.closest('[data-copy-ip]');if(!button)return;const address=button.dataset.copyIp;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(address)}else{const input=document.createElement('textarea');input.value=address;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();if(!document.execCommand('copy'))throw Error('Clipboard unavailable');input.remove()}button.textContent='Copied!';setTimeout(()=>{if(button.isConnected)button.textContent='Copy IP?'},1800)}catch{button.textContent='Select IP above';setTimeout(()=>{if(button.isConnected)button.textContent='Copy IP?'},2200)}});

// Public status endpoints; no credentials or hard-coded player counts.
// Discord invite counts require Discord to return approximate_presence_count and browser CORS access.
async function fetchJsonWithTimeout(url,ms=8000){
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),ms);
 try{const response=await fetch(url,{signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}});
 if(!response.ok)throw Error('Status HTTP '+response.status);return await response.json()}
 finally{clearTimeout(timeout)}
}
let statusTimer=null;
async function refreshLiveCounts(){
 const minecraft=document.getElementById('minecraft-online');
 const discord=document.getElementById('discord-online');
 if(!minecraft&&!discord)return;
 if(minecraft){fetchJsonWithTimeout('https://api.mcstatus.io/v2/status/java/aevonsmp.online')
 .then(data=>{if(!minecraft.isConnected)return;const online=data?.players?.online,max=data?.players?.max;
 minecraft.textContent=data?.online&&Number.isFinite(online)&&Number.isFinite(max)?`Online ${online}/${max}`:data?.online===false?'Server Offline':'Player count unavailable'})
 .catch(()=>{if(minecraft.isConnected)minecraft.textContent='Player count unavailable'})}
 if(discord){fetchJsonWithTimeout('https://discord.com/api/v10/invites/Ad7JVWw5Jp?with_counts=true')
 .then(data=>{if(!discord.isConnected)return;const count=data?.approximate_presence_count;
 discord.textContent=Number.isFinite(count)?`Online ${count}`:'Online count unavailable'})
 .catch(()=>{if(discord.isConnected)discord.textContent='Online count unavailable'})}
 if(statusTimer)clearTimeout(statusTimer);
 statusTimer=setTimeout(()=>{if(document.getElementById('minecraft-online'))refreshLiveCounts()},60000);
}
