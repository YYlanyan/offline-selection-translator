import csv,json,hashlib,pathlib,sys,unicodedata
src=pathlib.Path(sys.argv[1]); dest=pathlib.Path(__file__).resolve().parents[1]/'data'; dest.mkdir(exist_ok=True)
def norm(s): return ' '.join(unicodedata.normalize('NFKC',s).strip().lower().split())
entries={}; forms={}
with src.open(encoding='utf-8-sig',newline='') as f:
 for row in csv.DictReader(f):
  key=norm(row['word']); meaning=(row.get('translation') or row.get('definition') or '').replace('\\n','\n')
  if not key or not meaning: continue
  entries[key]={'key':key,'word':row['word'],'phonetic':row.get('phonetic',''),'partOfSpeech':'','meaning':meaning}
  for item in row.get('exchange','').split('/'):
   kind,sep,value=item.partition(':')
   if not sep: continue
   for variant in value.split(','):
    variant=norm(variant)
    if kind=='0': forms.setdefault(key,set()).add(variant)
    elif kind in ('p','d','i','3','r','t','s'): forms.setdefault(variant,set()).add(key)
rows=list(entries.values()); aliases=[{'key':k,'words':sorted(v)} for k,v in forms.items() if k]
files=[]
for table,data in [('entries',rows),('forms',aliases)]:
 for start in range(0,len(data),4000):
  name=f'{table}-{start//4000:04}.json'; payload=json.dumps(data[start:start+4000],ensure_ascii=False,separators=(',',':')).encode(); (dest/name).write_bytes(payload)
  files.append({'file':name,'table':table,'count':len(data[start:start+4000]),'sha256':hashlib.sha256(payload).hexdigest()})
manifest={'version':hashlib.sha256(src.read_bytes()).hexdigest()[:16],'source':'https://github.com/skywind3000/ECDICT','entries':len(rows),'forms':len(aliases),'chunks':files}
(dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)); print(len(rows),'entries;',len(aliases),'forms;',len(files),'chunks')
