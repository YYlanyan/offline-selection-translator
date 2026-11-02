const {siteDefault,windowDefault,allowed,matches}=globalThis.DictPreferences;
const $=id=>document.getElementById(id);
let url,domain;
async function refresh(){
  const values=await chrome.storage.local.get(['sitePolicy','windowPrefs']);
  const policy={...siteDefault,...values.sitePolicy};
  $('mode').value=policy.mode;$('window-mode').value=values.windowPrefs?.mode||'follow';
  if(url){
    const active=policy.blacklist.filter(item=>matches(url,item) && !(Number.isFinite(policy.blacklistUntil?.[item]) && policy.blacklistUntil[item] <= Date.now()));
    const timed=active.map(item=>policy.blacklistUntil?.[item]).filter(value=>Number.isFinite(value));
    const remaining=timed.length ? `；黑名单到期：${new Date(Math.max(...timed)).toLocaleString()}` : '';
    $('site-status').textContent=(allowed(url,policy)?'当前网站：已启用':'当前网站：已禁用')+remaining;
  }
}
async function change(action){
  try{
    const values=await chrome.storage.local.get('sitePolicy');const policy={...siteDefault,...values.sitePolicy};
    policy.blacklistUntil={...policy.blacklistUntil};
    if(action==='remove') {
      for(const list of ['blacklist','whitelist']) policy[list]=policy[list].filter(item=>!matches(url,item));
      for(const item of Object.keys(policy.blacklistUntil)) if(matches(url,item)) delete policy.blacklistUntil[item];
    }
    else{
      const opposite=action==='blacklist'?'whitelist':'blacklist';
      policy[opposite]=policy[opposite].filter(item=>!matches(url,item));
      policy[action]=[...new Set([...policy[action],domain])];policy.mode=action;
      if(action==='blacklist') {
        const selected=$('black-duration').value;
        const minutes=selected==='custom'?Number($('custom-duration').value):Number(selected);
        if(selected!=='permanent' && (!Number.isInteger(minutes)||minutes<1||minutes>525600)) throw new Error('请输入 1–525600 分钟的时长。');
        if(selected==='permanent') delete policy.blacklistUntil[domain];
        else policy.blacklistUntil[domain]=Date.now()+minutes*60000;
      } else delete policy.blacklistUntil[domain];
    }
    await chrome.storage.local.set({sitePolicy:policy});await refresh();
  }catch(error){$('site-status').textContent=error.message;}
}
$('black-duration').onchange=()=>{$('custom-duration-label').hidden=$('black-duration').value!=='custom';};
$('black').onclick=()=>change('blacklist');$('white').onclick=()=>change('whitelist');$('remove').onclick=()=>change('remove');
$('mode').onchange=async()=>{try{const v=await chrome.storage.local.get('sitePolicy');await chrome.storage.local.set({sitePolicy:{...siteDefault,...v.sitePolicy,mode:$('mode').value}});await refresh();}catch(e){$('site-status').textContent=e.message;}};
$('window-mode').onchange=async()=>{try{const v=await chrome.storage.local.get('windowPrefs');await chrome.storage.local.set({windowPrefs:{...windowDefault,...v.windowPrefs,mode:$('window-mode').value}});}catch(e){$('site-status').textContent=e.message;}};
$('settings').onclick=()=>chrome.runtime.openOptionsPage();
(async()=>{
  await refresh();const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  const current=new URL(tab?.url||'about:blank');
  if(!['http:','https:','file:'].includes(current.protocol)||current.hostname==='chromewebstore.google.com'){ $('site').textContent='此页面不支持划词，请切换到普通网页。';return; }
  url=current;domain=url.protocol==='file:'?'file://':url.hostname.toLowerCase().replace(/\.$/,'');
  $('site').textContent=domain;
  for(const id of ['black','white','remove']) $(id).disabled=false;
  await refresh();
})().catch(error=>{$('site').textContent=error.message;});
