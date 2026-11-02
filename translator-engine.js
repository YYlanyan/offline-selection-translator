const engines = new Map();
const creating = new Map();
let queue = Promise.resolve();
const pairs = { 'en-zh': ['en', 'zh'], 'zh-en': ['zh', 'en'] };
async function engine(direction) {
  if (engines.has(direction)) return engines.get(direction);
  if (creating.has(direction)) return creating.get(direction);
  const promise = (async () => {
    if (!('Translator' in self)) throw new Error('当前 Chrome 不支持隐藏页面翻译，请更新 Chrome。');
    const [sourceLanguage, targetLanguage] = pairs[direction];
    const availability = await Translator.availability({sourceLanguage, targetLanguage});
    if (availability !== 'available') throw new Error(`请点击扩展图标中的“准备${direction === 'zh-en' ? '中英' : '英中'}模型”，完成首次初始化。`);
    const translator = await Translator.create({sourceLanguage, targetLanguage});
    engines.set(direction, translator);
    return translator;
  })().finally(() => creating.delete(direction));
  creating.set(direction, promise);
  return promise;
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.target !== 'translator-engine') return;
  if (message.type === 'PING') { respond({ready:true}); return; }
  if (message.type !== 'TRANSLATE') return;
  if (typeof message.text !== 'string' || !message.text.trim() || message.text.length > 3000 || !Object.hasOwn(pairs, message.direction)) {
    respond({error:'请选择 1–3000 个字符的中文或英文。'}); return;
  }
  const task = queue.then(async () => {
    if (Date.now() - message.createdAt > 45000) throw new Error('翻译排队超时，请重试。');
    return {translation:await (await engine(message.direction)).translate(message.text), direction:message.direction};
  });
  queue = task.catch(() => {});
  task.then(respond).catch(error => respond({error:error.message, needsSetup:!engines.has(message.direction)}));
  return true;
});
