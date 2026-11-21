// Fill these URLs when the public release files and project links are ready.
const links={github:"https://github.com/TagMyAudio/TagMyAudio",paypal:null,macarm:"https://github.com/TagMyAudio/TagMyAudio/releases/download/v1.8.6/TagMyAudio-1.8.6-macOS-arm64-community.zip",macintel:"https://github.com/TagMyAudio/TagMyAudio/releases/download/v1.8.6/TagMyAudio-1.8.6-macOS-x86_64-community.zip",mackit:"https://github.com/TagMyAudio/TagMyAudio/releases/download/v1.8.6/TagMyAudio-1.8.6-Build-macOS.zip",setup:"https://github.com/TagMyAudio/TagMyAudio/releases/download/v1.8.6/TagMyAudio-1.8.6-Windows-x64-Setup.exe",portable:"https://github.com/TagMyAudio/TagMyAudio/releases/download/v1.8.6/TagMyAudio-1.8.6-Windows-x64-Portable.exe",winkit:"https://github.com/TagMyAudio/TagMyAudio/releases/download/v1.8.6/TagMyAudio-1.8.6-Build-Win.zip"};
const language=document.querySelector('#language');
const captures=JSON.parse(document.querySelector('#capture-map').textContent);
const format=document.querySelector('#format');
const quality=document.querySelector('#qualite');
const profiles={mp3:{v:[192,256,320],d:320,u:'kbit/s'},flac:{v:[1,5,8],d:5,u:''},wav:{v:[16,24],d:24,u:'bit'},aac:{v:[128,192,256,320],d:256,u:'kbit/s'},alac:{v:[16,24],d:24,u:'bit'},vorbis:{v:[3,5,8,10],d:5,u:''},opus:{v:[96,128,192,256],d:192,u:'kbit/s'}};
function result(){document.querySelector('#profile-name').textContent=format.selectedOptions[0].textContent+' · '+quality.value+' '+profiles[format.value].u;const key=format.value==='flac'?'flacScale':format.value==='vorbis'?'vorbisScale':null;document.querySelector('#profile-help').textContent=key?'('+translations[language.value][key]+')':'';}
function fill(){const p=profiles[format.value];quality.replaceChildren(...p.v.map(v=>new Option(v+' '+p.u,v)));quality.value=p.d;result()}
format.addEventListener('change',fill);quality.addEventListener('change',result);fill();
function setLanguage(lang){if(!translations[lang])lang='en';language.value=lang;document.documentElement.lang=lang;document.querySelector('#application-capture').src=captures[lang];document.querySelector('#application-capture').alt='TagMyAudio · '+language.selectedOptions[0].textContent;document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=translations[lang][el.dataset.i18n]});document.querySelectorAll('.guide').forEach(el=>el.classList.toggle('active',el.dataset.lang===lang));document.querySelector('#language-toggle').textContent=language.selectedOptions[0].textContent+' ▾';document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.language===lang)));result();document.title='TagMyAudio — '+translations[lang].hero1+' '+translations[lang].hero2;}
language.addEventListener('change',()=>setLanguage(language.value));
setLanguage('en');
const dialog=document.querySelector('#link-dialog');
document.querySelectorAll('[data-link]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.link;if(key==='close'){dialog.close();return}if(links[key]){window.open(links[key],'_blank','noopener');return}dialog.showModal()}));
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});

// Read the complete guide directly, without pop-up or PDF-plugin dependencies.
const guideReader=document.querySelector('#guide-reader');
let guideObjectUrl=null;
function openGuide(a,push=true){
 const lang=a.dataset.guideLang;
 document.querySelector('#reader-download').textContent=translations[lang].download+' PDF';
 document.querySelector('#reader-title').textContent='TagMyAudio 1.8.6 · '+a.dataset.platform+' · '+document.querySelector('#language option[value="'+lang+'"]').textContent;
 const content=document.querySelector('#reader-content');
 content.replaceChildren(document.querySelector('#guide-body-'+lang).content.cloneNode(true));
 content.lang=lang;
 const download=document.querySelector('#reader-download');
 let url=a.dataset.pdfUrl;
 if(guideObjectUrl){URL.revokeObjectURL(guideObjectUrl);guideObjectUrl=null;}
 if(url.startsWith('data:application/pdf;base64,')){
  const bytes=Uint8Array.from(atob(url.split(',')[1]),c=>c.charCodeAt(0));
  guideObjectUrl=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));url=guideObjectUrl;
 }
 download.href=url;download.download='TagMyAudio-1.8.6-'+a.dataset.platform+'-'+lang+'.pdf';
 guideReader.hidden=false;document.body.classList.add('reading-guide');guideReader.scrollTop=0;if(push)history.pushState({guide:true},'', '#guide-'+a.dataset.platform+'-'+lang);
}
document.querySelectorAll('a[data-pdf]').forEach(a=>{
 a.dataset.pdfUrl=a.href;
 a.href=location.pathname+location.search+'#guide-'+a.dataset.platform+'-'+a.dataset.guideLang;
 a.target='_blank';a.rel='noopener';
});
function closeGuide(){guideReader.hidden=true;document.body.classList.remove('reading-guide')}
function routeGuide(){const a=[...document.querySelectorAll('a[data-pdf]')].find(a=>location.hash==='#guide-'+a.dataset.platform+'-'+a.dataset.guideLang);if(a)openGuide(a,false);else closeGuide()}
window.addEventListener('popstate',routeGuide);routeGuide();

const languageToggle=document.querySelector('#language-toggle'),languageOptions=document.querySelector('#language-options');
function closeLanguages(){languageOptions.hidden=true;languageToggle.setAttribute('aria-expanded','false')}
languageToggle.addEventListener('click',()=>{const open=languageOptions.hidden;languageOptions.hidden=!open;languageToggle.setAttribute('aria-expanded',String(open));if(open)languageOptions.scrollTop=0});
languageOptions.addEventListener('click',e=>{const b=e.target.closest('[data-language]');if(b){setLanguage(b.dataset.language);closeLanguages();languageToggle.focus()}});
document.addEventListener('click',e=>{if(!e.target.closest('.language-menu'))closeLanguages()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!languageOptions.hidden){closeLanguages();languageToggle.focus()}});
languageOptions.addEventListener('keydown',e=>{const options=[...languageOptions.querySelectorAll('button')],i=options.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?options.length-1:(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;options[n].focus()}});
