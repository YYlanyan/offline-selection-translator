// 手写演示词条，不代表完整词典。
export const entries = {
  hello: ['həˈləʊ', '感叹词', '你好；喂'],
  world: ['wɜːld', '名词', '世界'],
  apple: ['ˈæpəl', '名词', '苹果'],
  book: ['bʊk', '名词 / 动词', '书；预订'],
  read: ['riːd', '动词', '阅读；读懂（过去式读音为 /red/）'],
  browser: ['ˈbraʊzə', '名词', '浏览器'],
  extension: ['ɪkˈstenʃən', '名词', '扩展；扩展程序'],
  offline: ['ˌɒfˈlaɪn', '形容词 / 副词', '离线的；离线地'],
  dictionary: ['ˈdɪkʃənəri', '名词', '词典'],
  translation: ['trænzˈleɪʃən', '名词', '翻译；译文'],
  translate: ['trænzˈleɪt', '动词', '翻译'],
  select: ['sɪˈlekt', '动词', '选择；选中'],
  query: ['ˈkwɪəri', '名词 / 动词', '查询；询问'],
  float: ['fləʊt', '动词', '漂浮；浮动'],
  quick: ['kwɪk', '形容词', '快速的'],
  local: ['ˈləʊkəl', '形容词', '本地的'],
  privacy: ['ˈprɪvəsi', '名词', '隐私'],
  code: ['kəʊd', '名词 / 动词', '代码；编码'],
  learn: ['lɜːn', '动词', '学习'],
  go: ['ɡəʊ', '动词', '去；前往'],
  'look up': ['', '短语', '查阅；查找'],
  'thank you': ['', '短语', '谢谢你'],
  'good morning': ['', '短语', '早上好']
};
const forms = { apples: 'apple', books: 'book', went: 'go', gone: 'go', browsers: 'browser', extensions: 'extension', dictionaries: 'dictionary', translated: 'translate', translating: 'translate' };
export function lookup(text) {
  const normalized = text.normalize('NFKC').trim().replace(/^[“”"'‘’.,!?;:()]+|[“”"'‘’.,!?;:()]+$/g, '').replace(/\s+/g, ' ').toLowerCase();
  const word = Object.hasOwn(entries, normalized) ? normalized : forms[normalized];
  if (!word || !Object.hasOwn(entries, word)) return null;
  const [phonetic, partOfSpeech, meaning] = entries[word];
  return { word, phonetic, partOfSpeech, meaning };
}
