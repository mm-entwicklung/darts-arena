import base64, json, os, re, threading, webbrowser
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
from engine import new_game, throw, next_turn, correct_dart

ROOT=Path(__file__).resolve().parent
DATA=ROOT/'data'/'state.json'
LOCK=threading.RLock()
def initial():return {'players':[], 'game':None}
def load():
    try:return json.loads(DATA.read_text(encoding='utf-8'))
    except (FileNotFoundError,ValueError):return initial()
STATE=load()
def save():
    DATA.parent.mkdir(exist_ok=True)
    temp=DATA.with_suffix('.tmp');temp.write_text(json.dumps(STATE,ensure_ascii=False,indent=2),encoding='utf-8');os.replace(temp,DATA)

class Handler(BaseHTTPRequestHandler):
    def send(self,status,data,ctype='application/json'):
        b=(json.dumps(data,ensure_ascii=False).encode() if ctype=='application/json' else data)
        self.send_response(status);self.send_header('Content-Type',ctype+'; charset=utf-8');self.send_header('Content-Length',str(len(b)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(b)
    def do_GET(self):
        path=urlparse(self.path).path
        if path=='/api/state':
            with LOCK:self.send(200,STATE)
            return
        files={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css'}
        if path not in files:return self.send(404,{'error':'Nicht gefunden'})
        f=ROOT/'static'/files[path]
        self.send(200,f.read_bytes(),{'index.html':'text/html','app.js':'application/javascript','style.css':'text/css'}[files[path]])
    def do_POST(self):
        try:
            length=int(self.headers.get('Content-Length','0'))
            if length>2_000_000:raise ValueError('Anfrage zu groß')
            body=json.loads(self.rfile.read(length) or b'{}')
            with LOCK:
                path=urlparse(self.path).path
                if path=='/api/player':
                    name=str(body.get('name','')).strip()[:50]
                    if not name:raise ValueError('Name erforderlich')
                    avatar=body.get('avatar','')
                    if avatar and (not isinstance(avatar,str) or len(avatar)>1_500_000 or not re.match(r'^data:image/(png|jpeg|webp);base64,',avatar)):
                        raise ValueError('Avatar muss PNG, JPG oder WebP sein')
                    pid=body.get('id')
                    existing=next((p for p in STATE['players'] if p['id']==pid),None)
                    if existing:existing.update(name=name,avatar=avatar)
                    else:
                        if len(STATE['players'])>=32:raise ValueError('Maximal 32 Spieler')
                        import uuid
                        STATE['players'].append({'id':uuid.uuid4().hex,'name':name,'avatar':avatar})
                elif path=='/api/delete':
                    pid=body.get('id')
                    if STATE['game'] and pid in STATE['game']['players']:raise ValueError('Spieler ist Teil des aktuellen Spiels')
                    STATE['players']=[p for p in STATE['players'] if p['id']!=pid]
                elif path=='/api/start':
                    ids=body.get('players',[])
                    if any(i not in [p['id'] for p in STATE['players']] for i in ids):raise ValueError('Unbekannter Spieler')
                    STATE['game']=new_game(ids,body.get('mode','x01'),int(body.get('start',501)),body.get('out','double'),body.get('cricket','standard'),body.get('checkin','straight'))
                elif path=='/api/throw':
                    if not STATE['game']:raise ValueError('Kein aktives Spiel')
                    throw(STATE['game'],body.get('dart',''))
                elif path=='/api/correct':
                    if not STATE['game']:raise ValueError('Kein aktives Spiel')
                    correct_dart(STATE['game'],body.get('index'),body.get('dart',''))
                elif path=='/api/next':
                    if not STATE['game']:raise ValueError('Kein aktives Spiel')
                    next_turn(STATE['game'])
                elif path=='/api/reset':STATE['game']=None
                else:return self.send(404,{'error':'Unbekannte Aktion'})
                save();self.send(200,STATE)
        except (ValueError,TypeError,KeyError,json.JSONDecodeError) as e:self.send(400,{'error':str(e)})
        except Exception as e:
            print('Serverfehler:',repr(e));self.send(500,{'error':'Interner Serverfehler'})
    def log_message(self,fmt,*args):pass

if __name__=='__main__':
    server=ThreadingHTTPServer(('127.0.0.1',8765),Handler)
    print('Darts Arena: http://127.0.0.1:8765')
    threading.Timer(0.7,lambda:webbrowser.open('http://127.0.0.1:8765')).start()
    try:server.serve_forever()
    except KeyboardInterrupt:pass
