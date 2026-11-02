import { get, commit, manifest } from './db.js';
const status = document.querySelector('#status'), progress = document.querySelector('#progress'), button = document.querySelector('#start');
async function display() {
  const info = await manifest(), state = await get('meta','state');
  const current = state?.version === info.version ? state : { next:0 };
  progress.max = info.chunks.length; progress.value = current.next || 0;
  status.textContent = current.ready ? `词库已就绪：${info.entries.toLocaleString()} 条词条。现在可返回网页划词。` : `${info.entries.toLocaleString()} 条词条，已导入 ${current.next || 0}/${info.chunks.length} 批。`;
  button.disabled = !!current.ready;
}
button.onclick = async () => {
 button.disabled = true;
 try {
  await navigator.locks.request('ecdict-import', async () => {
   const info = await manifest(); let state = await get('meta','state');
   if (state?.version !== info.version) { state = { version:info.version,next:0,ready:false }; await commit('entries',[],state,true); }
   for (let i = state.next; i < info.chunks.length; i++) {
    const chunk = info.chunks[i]; const response = await fetch(chrome.runtime.getURL(`data/${chunk.file}`));
    if (!response.ok) throw new Error('缺少词库分片：'+chunk.file);
    const bytes = await response.arrayBuffer();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
    if (hash !== chunk.sha256) throw new Error('词库完整性校验失败：'+chunk.file);
    const rows = JSON.parse(new TextDecoder().decode(bytes));
    if (rows.length !== chunk.count) throw new Error('词库条数校验失败');
    await commit(chunk.table,rows,{ version:info.version,next:i+1,ready:i+1===info.chunks.length });
    progress.max = info.chunks.length; progress.value = i+1;
    status.textContent = `正在导入 ${i+1}/${info.chunks.length} 批…`;
   }
  });
  await display();
 } catch (error) { status.textContent = `导入未完成：${error.message}。可以重试继续。`; button.disabled = false; }
};
display().catch(error => { status.textContent = error.message; });
