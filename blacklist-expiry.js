// Keep timed entries correct even if all matching tabs have been closed.
const ALARM='blacklist-expiry';
let scheduling=Promise.resolve();
async function reconcile() {
  const {sitePolicy}=await chrome.storage.local.get('sitePolicy');
  const policy=sitePolicy || {};
  const until=policy.blacklistUntil || {};
  const now=Date.now();
  const blacklist=(policy.blacklist || []).filter(item=>!Number.isFinite(until[item]) || until[item]>now);
  const blacklistUntil=Object.fromEntries(Object.entries(until).filter(([item,time])=>blacklist.includes(item)&&Number.isFinite(time)&&time>now));
  if(blacklist.length !== (policy.blacklist || []).length || Object.keys(blacklistUntil).length !== Object.keys(until).length) {
    await chrome.storage.local.set({sitePolicy:{...policy,blacklist,blacklistUntil}});
  }
  const next=Math.min(...Object.values(blacklistUntil));
  await chrome.alarms.clear(ALARM);
  if(Number.isFinite(next)) await chrome.alarms.create(ALARM,{when:Math.max(next,Date.now()+1000)});
}
function schedule(){scheduling=scheduling.then(reconcile).catch(error=>console.error('Blacklist expiry:',error));}
chrome.alarms.onAlarm.addListener(alarm=>{if(alarm.name===ALARM)schedule();});
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.sitePolicy)schedule();});
chrome.runtime.onStartup.addListener(schedule);
chrome.runtime.onInstalled.addListener(schedule);
schedule();
