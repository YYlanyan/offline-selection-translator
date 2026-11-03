import { lookup } from './db.js';
import './blacklist-expiry.js';
let opening;
async function ensureEngine() {
  if(!opening) opening=(async()=>{
    const contexts=await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT']});
    if(!contexts.length) await chrome.offscreen.createDocument({url:'offscreen.html',reasons:['IFRAME_SCRIPTING'],justification:'Embed and script a same-origin translation iframe to run the Window-only Translator API without a visible settings tab.'});
    for(let i=0;i<30;i++) {
      try {const result=await chrome.runtime.sendMessage({target:'translator-engine',type:'PING'});if(result?.ready)return;}catch{}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    throw new Error('隐藏翻译引擎未能启动，请重新加载扩展。');
  })().finally(()=>{opening=null;});
  return opening;
}
async function translate(text, direction) {
  let timer;
  try {
    await ensureEngine();
    return await Promise.race([
      chrome.runtime.sendMessage({target:'translator-engine',type:'TRANSLATE',text,direction,createdAt:Date.now()}),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('翻译超时，请稍后重试。')),60000);})
    ]);
  } catch(error) {return {error:error.message,needsSetup:true};}
  finally{clearTimeout(timer);}
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.target === 'translator-engine') return;
  if (message?.type === 'OPEN_SETTINGS') {chrome.runtime.openOptionsPage();respond({ok:true});return;}
  if (!['LOOKUP','TRANSLATE'].includes(message?.type)) return;
  if (typeof message.text !== 'string' || !message.text.trim() || message.text.length > 3000) { respond({ error: '请选择 1–3000 个字符的中文或英文。' }); return; }
  (async()=>{
    const hasChinese = /[\p{Script=Han}]/u.test(message.text);
    const direction = hasChinese && !/[A-Za-z]/.test(message.text) ? 'zh-en' : 'en-zh';
    if (message.type === 'TRANSLATE' || hasChinese) return translate(message.text, direction);
    const words = message.text.trim().split(/\s+/);
    if (words.length > 5 || message.text.length > 120) return translate(message.text, direction);
    try {
      const entry = await lookup(message.text);
      if (entry) return {entry};
    } catch(error) {
      if (words.length === 1) return {error:error.message};
    }
    if (words.length > 1) return translate(message.text, direction);
    return {entry:null};
  })().then(respond).catch(error=>respond({error:error.message}));
  return true;
});
