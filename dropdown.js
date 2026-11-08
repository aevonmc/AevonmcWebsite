/* AevonMC navigation: click to toggle; hover-out closes after 500ms; click outside closes immediately. */
(()=>{
 const menus=[...document.querySelectorAll('.topbar .nav-dropdown')];
 const timers=new WeakMap();
 function cancel(menu){const t=timers.get(menu);if(t!==undefined){clearTimeout(t);timers.delete(menu)}}
 function close(menu){cancel(menu);menu.open=false}
 function closeOthers(except){for(const menu of menus)if(menu!==except)close(menu)}
 for(const menu of menus){
  menu.addEventListener('toggle',()=>{if(menu.open)closeOthers(menu)});
  menu.addEventListener('pointerenter',()=>cancel(menu));
  menu.addEventListener('pointerleave',e=>{if(e.pointerType==='touch'||!menu.open)return;cancel(menu);timers.set(menu,setTimeout(()=>close(menu),500))});
  menu.querySelectorAll('.nav-menu a').forEach(a=>a.addEventListener('click',()=>close(menu)));
 }
 document.addEventListener('pointerdown',e=>{if(!menus.some(menu=>menu.contains(e.target)))closeOthers(null)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeOthers(null);const focus=document.activeElement;if(focus&&focus.closest('.nav-dropdown'))focus.blur()}});
 window.addEventListener('hashchange',()=>closeOthers(null));
})();
