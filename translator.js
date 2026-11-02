// Shared by popup and options: model download is started by the user's click.
const state = document.querySelector('#translation-status');
const buttons = [...document.querySelectorAll('[data-direction]')];
const pairs = {'en-zh':['en','zh'], 'zh-en':['zh','en']};
const label = {'en-zh':'英中', 'zh-en':'中英'};
async function showAvailability() {
  if (!('Translator' in self)) {state.textContent='当前环境不支持 Translator API。'; return;}
  const lines = await Promise.all(Object.entries(pairs).map(async ([direction,[sourceLanguage,targetLanguage]]) => {
    const value = await Translator.availability({sourceLanguage,targetLanguage});
    return `${label[direction]}：${value === 'available' ? '已就绪' : value === 'unavailable' ? '此设备不可用' : '需要下载'}`;
  }));
  state.textContent=lines.join('；');
}
for (const button of buttons) button.onclick = async () => {
  const direction=button.dataset.direction;
  const [sourceLanguage,targetLanguage]=pairs[direction];
  button.disabled=true;
  let translator;
  try {
    if(!('Translator' in self)) throw new Error('当前 Chrome 环境不支持 Translator API。');
    state.textContent=`正在准备${label[direction]}模型，请暂时保持此面板打开…`;
    translator=await Translator.create({sourceLanguage,targetLanguage,monitor(m){
      m.addEventListener('downloadprogress',e=>state.textContent=`${label[direction]}模型准备中：${Math.round(e.loaded*100)}%，请保持面板打开…`);
    }});
    await showAvailability();
  } catch(error) {state.textContent=`${label[direction]}模型准备失败：${error.message}`;}
  finally {translator?.destroy();button.disabled=false;}
};
showAvailability().catch(error=>{state.textContent=error.message;});
