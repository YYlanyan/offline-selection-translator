const {siteDefault,windowDefault,parse} = globalThis.DictPreferences;
const form = document.querySelector('#preferences');
const message = document.querySelector('#preferences-status');
const field = name => form.elements.namedItem(name);
async function load() {
  const values = await chrome.storage.local.get(['sitePolicy','windowPrefs']);
  const site = {...siteDefault,...values.sitePolicy}, win = {...windowDefault,...values.windowPrefs};
  field('siteMode').value = site.mode;
  field('blacklist').value = site.blacklist.join('\n');
  field('whitelist').value = site.whitelist.join('\n');
  field('windowMode').value = win.mode;
  form.querySelector('button[type="submit"]').disabled = false;
}
form.onsubmit = async event => {
  event.preventDefault();
  try {
    const previous = await chrome.storage.local.get('sitePolicy');
    const blacklist=parse(field('blacklist').value);
    const until=previous.sitePolicy?.blacklistUntil || {};
    const blacklistUntil=Object.fromEntries(Object.entries(until).filter(([domain,expires])=>blacklist.includes(domain)&&Number.isFinite(expires)&&expires>Date.now()));
    const sitePolicy = {mode:field('siteMode').value,blacklist,blacklistUntil,whitelist:parse(field('whitelist').value)};
    const current = await chrome.storage.local.get('windowPrefs');
    await chrome.storage.local.set({sitePolicy,windowPrefs:{...windowDefault,...current.windowPrefs,mode:field('windowMode').value}});
    message.textContent = '已保存，已加载的网页立即生效。';
  } catch(error) {message.textContent = error.message;}
};
document.querySelector('#reset-position').onclick = async () => {
  try {await chrome.storage.local.set({windowPrefs:{...windowDefault,mode:field('windowMode').value}});message.textContent='窗口位置已重置到左上角。';}
  catch(error){message.textContent=error.message;}
};
chrome.storage.onChanged.addListener((changes,area)=>{
  if(area==='local' && changes.windowPrefs) field('windowMode').value=changes.windowPrefs.newValue?.mode || 'follow';
});
load().catch(error=>{message.textContent=error.message;});
