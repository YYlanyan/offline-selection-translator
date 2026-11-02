(() => {
  let host, panel, currentRect, requestId = 0;
  const {siteDefault,windowDefault,allowed} = globalThis.DictPreferences;
  let sitePolicy = {...siteDefault}, windowPrefs = {...windowDefault}, ready = false, manualPosition = null, dragging = false, pendingRender = null, pinButton;
  const enabled = () => ready && allowed(new URL(location.href),sitePolicy);
  const fixed = () => windowPrefs.mode === 'fixed';
  const loaded = chrome.storage.local.get(['sitePolicy','windowPrefs']).then(values=>{
    sitePolicy = {...siteDefault,...values.sitePolicy}; windowPrefs = {...windowDefault,...values.windowPrefs}; ready = true;
  }).catch(()=>{ready=false;});
  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area!=='local') return;
    if(changes.sitePolicy) {sitePolicy={...siteDefault,...changes.sitePolicy.newValue};if(!enabled()) close();}
    if(changes.windowPrefs) {windowPrefs={...windowDefault,...changes.windowPrefs.newValue};manualPosition=null;position();updatePin();}
  });
  function updatePin() { if(pinButton) {pinButton.textContent=fixed()?'取消固定':'固定';pinButton.setAttribute('aria-pressed',String(fixed()));} }
  async function togglePin() {
    const rect=panel.getBoundingClientRect();
    windowPrefs={mode:fixed()?'follow':'fixed',x:rect.left,y:rect.top};manualPosition=null;position();updatePin();
    try {await chrome.storage.local.set({windowPrefs});} catch {pinButton.title='位置保存失败，刷新页面后可能丢失';}
  }
  function startDrag(event) {
    if(event.button!==0 || event.target.closest('button')) return;
    event.preventDefault(); event.stopPropagation();
    const handle=event.currentTarget, rect=panel.getBoundingClientRect(), startX=event.clientX,startY=event.clientY;
    dragging=true; handle.setPointerCapture(event.pointerId);
    const move=e=>{manualPosition={x:rect.left+e.clientX-startX,y:rect.top+e.clientY-startY};position();};
    const end=()=>{
      handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);handle.removeEventListener('lostpointercapture',end);
      dragging=false;
      if(panel && fixed()) {const r=panel.getBoundingClientRect();windowPrefs={mode:'fixed',x:r.left,y:r.top};chrome.storage.local.set({windowPrefs}).catch(()=>{});}
      if(pendingRender) {const args=pendingRender;pendingRender=null;render(...args);}
    };
    handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',end);
  }
  const close = () => { requestId++; pendingRender=null; dragging=false; host?.remove(); host = panel = null; pinButton=null; manualPosition=null; };
  function position() {
    if (!panel || !currentRect) return;
    const margin = 12;
    const width = panel.getBoundingClientRect().width;
    const height = panel.getBoundingClientRect().height;
    let left = Math.max(margin, Math.min(currentRect.left, innerWidth - width - margin));
    let top = currentRect.bottom + 10;
    if (top + height > innerHeight - margin) top = Math.max(margin, currentRect.top - height - 10);
    const chosen=manualPosition || (fixed()?windowPrefs:null);
    if(chosen) {left=Number.isFinite(chosen.x)?chosen.x:24;top=Number.isFinite(chosen.y)?chosen.y:24;}
    left=Math.max(margin,Math.min(left,innerWidth-width-margin));top=Math.max(margin,Math.min(top,innerHeight-height-margin));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }
  function render(text, entry, status, result = {}) {
    if(!enabled()) return;
    if(dragging) {pendingRender=[text,entry,status,result];return;}
    if (!host) {
      host = document.createElement('div');
      host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;';
      const shadow = host.attachShadow({ mode: 'closed' });
      const style = document.createElement('style');
      style.textContent = `
        :host { color-scheme: light; }
        * { box-sizing:border-box; }
        section { position:fixed; pointer-events:auto; width:380px; max-width:calc(100vw - 24px); max-height:calc(100vh - 24px); overflow:auto; padding:20px; background:#fff; color:#172a31; border:1px solid #dce7e6; border-radius:16px; box-shadow:0 12px 40px #102c3226; font:14px/1.6 system-ui,sans-serif; }
        header { cursor:move; touch-action:none; user-select:none; min-height:28px; color:#157c70; font-size:11px; letter-spacing:1px; margin-bottom:10px; }
        button { float:right; border:0; background:#eff5f4; border-radius:6px; cursor:pointer; padding:0 7px; color:#425b60; font-size:20px; }
        .pin {font-size:12px;padding:4px 7px;margin-right:8px;}
        h2 { font-size:23px; line-height:1.3; margin:0 0 6px; overflow-wrap:anywhere; }
        .action { float:none; font-size:13px; padding:7px 10px; margin:4px 8px 4px 0; }
        .sentence { font-size:15px; font-weight:400; max-height:110px; overflow:auto; }
        .sound,.hint { color:#75868b; font-size:12px; }
        .meaning { margin:12px 0; white-space:pre-wrap; }
        footer { border-top:1px solid #eef2f2; padding-top:10px; font-size:11px; color:#75868b; }
      `;
      panel = document.createElement('section');
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-label', '离线查词结果');
      panel.setAttribute('aria-live', 'polite');
      shadow.append(style, panel);
      document.documentElement.append(host);
    }
    panel.replaceChildren();
    const add = (tag, value, cls) => {
      const el = document.createElement(tag); el.textContent = value;
      if (cls) el.className = cls;
      panel.append(el); return el;
    };
    const header = add('header', result.translation ? (result.direction === 'zh-en' ? '离线句子翻译 · 中文 → 英语' : '离线句子翻译 · 英语 → 中文') : '离线划词');
    const button = document.createElement('button'); button.textContent = '×'; button.setAttribute('aria-label', '关闭'); button.onclick = close; header.append(button);
    pinButton=document.createElement('button');pinButton.className='pin';pinButton.onclick=togglePin;header.append(pinButton);updatePin();
    header.addEventListener('pointerdown',startDrag);
    add('h2', entry?.word || text, !entry && text.length > 50 ? 'sentence' : '');
    if (entry?.phonetic) add('div', `/${entry.phonetic}/`, 'sound');
    if (entry) {
      add('div', [entry.partOfSpeech, entry.meaning].filter(Boolean).join(" · "), 'meaning');
      if (entry.word !== text.toLowerCase()) add('div', `选中：${text}`, 'hint');
    } else add('div', result.translation || status, 'meaning');
    if (result.needsSetup) {
      const setup = add('button', '模型设置（也可点击扩展图标）', 'action');
      setup.onclick = () => chrome.runtime.sendMessage({type:'OPEN_SETTINGS'});
    }
    if (!result.translation && !result.busy && !result.needsSetup && text.length <= 3000) {
      const retry = add('button', (/[\p{Script=Han}]/u.test(text) ? '翻译成英文' : '翻译成中文'), 'action');
      retry.onclick = () => query(text, 'TRANSLATE');
    }
    add('footer', result.translation ? 'Chrome 本地模型 · Esc 关闭' : 'ECDICT / Chrome 本地模型 · Esc 关闭');
    position();
  }
  async function selected(event) {
    if (dragging || (host && event.composedPath().includes(host))) return;
    if(!ready) return;
    if(!enabled()) {close();return;}
    const target = event.target;
    if (target instanceof Element && (target.closest('input,textarea,select') || target.isContentEditable)) { if(!fixed()) close(); return; }
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text || !selection.rangeCount) { if(!fixed()) close(); return; }
    manualPosition=null;requestId++;
    currentRect = selection.getRangeAt(0).getBoundingClientRect();
    if (text.length > 3000) { render('选区过长', null, '请缩短到 3000 个字符以内。', {busy:true}); return; }
    await query(text);
  }
  async function query(text, type = 'LOOKUP') {
    if(!enabled()) {close();return;}
    const id = ++requestId;
    render(text, null, type === 'TRANSLATE' || text.split(/\s+/).length > 5 ? '正在本地翻译…' : '正在查询 / 翻译…', {busy:true});
    try {
      const result = await chrome.runtime.sendMessage({ type, text });
      if (id !== requestId) return;
      render(text, result?.entry, result?.error || '词库未收录，可尝试句子翻译。', result || {});
    } catch {
      if (id === requestId) render(text, null, '扩展连接已失效，请刷新当前网页后重试。');
    }
  }
  document.addEventListener('pointerup', selected);
  document.addEventListener('keyup', event => {
    if (event.key === 'Escape') close();
    else if (event.key === 'Shift' || (event.shiftKey && event.key.startsWith('Arrow'))) selected(event);
  });
  document.addEventListener('pointerdown', event => { if (host && !fixed() && !dragging && !event.composedPath().includes(host)) close(); });
  document.addEventListener('scroll', event => { if (!fixed() && !dragging && (!host || !event.composedPath().includes(host))) close(); }, true);
  window.addEventListener('resize', position);
})();
