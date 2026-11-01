import base64, binascii, io, json, random, re, threading, uuid, webbrowser
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
from engine import new_game, throw, next_turn, correct_dart, advance_leg, rematch
import database

ROOT=Path(__file__).resolve().parent
LOCK=threading.RLock()
# v0.1.6 deliberately starts with an empty SQLite database; state.json is untouched.
STATE=database.load()
def save():
    database.save(STATE)


MAX_UPLOAD_BYTES = 25 * 1024 * 1024

def optimize_avatar(data_url):
    """Decode an uploaded image locally; persist only a small WebP data URL."""
    from PIL import Image, ImageOps, UnidentifiedImageError
    try:
        import pillow_heif
        pillow_heif.register_heif_opener()
    except ImportError:
        pass
    if not isinstance(data_url, str) or not data_url.startswith('data:image/'):
        raise ValueError('Ungültiges Avatarbild')
    header, sep, payload = data_url.partition(',')
    if not sep or ';base64' not in header.lower():
        raise ValueError('Ungültiges Bildformat')
    try:
        binary = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError):
        raise ValueError('Ungültige Bilddaten')
    if len(binary) > MAX_UPLOAD_BYTES:
        raise ValueError('Originalbild zu groß (maximal 25 MB)')
    try:
        with Image.open(io.BytesIO(binary)) as image:
            if image.width * image.height > 100_000_000:
                raise ValueError('Bildauflösung zu groß (maximal 100 Megapixel)')
            image = ImageOps.exif_transpose(image)
            image = ImageOps.fit(image.convert('RGB'), (256, 256), method=Image.Resampling.LANCZOS)
            output = io.BytesIO()
            image.save(output, format='WEBP', quality=85, method=4)
    except (UnidentifiedImageError, OSError) as error:
        raise ValueError('Bild nicht lesbar. Für HEIC bitte pillow-heif installieren.') from error
    return 'data:image/webp;base64,' + base64.b64encode(output.getvalue()).decode('ascii')

class Handler(BaseHTTPRequestHandler):
    def send(self,status,data,ctype='application/json'):
        b=(json.dumps(data,ensure_ascii=False).encode() if ctype=='application/json' else data)
        self.send_response(status);self.send_header('Content-Type',ctype+'; charset=utf-8');self.send_header('Content-Length',str(len(b)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(b)
    def do_GET(self):
        path=urlparse(self.path).path
        if path=='/api/state':
            with LOCK:self.send(200,STATE)
            return
        # Serve only known frontend asset directories; prevent path traversal.
        if path in ('/', '/index.html'):
            asset = ROOT / 'static' / 'index.html'
        elif path == '/app.js' or path.startswith('/js/') or path.startswith('/css/'):
            asset = (ROOT / 'static' / path.lstrip('/')).resolve()
            if not asset.is_relative_to((ROOT / 'static').resolve()):
                return self.send(404, {'error': 'Nicht gefunden'})
        else:
            return self.send(404, {'error': 'Nicht gefunden'})
        if not asset.is_file():
            return self.send(404, {'error': 'Nicht gefunden'})
        ctype = 'text/html' if asset.suffix == '.html' else 'text/css' if asset.suffix == '.css' else 'application/javascript'
        self.send(200, asset.read_bytes(), ctype)
    def do_POST(self):
        try:
            length=int(self.headers.get('Content-Length','0'))
            if length < 0 or length > 36_000_000:raise ValueError('Anfrage zu groß (maximal 25 MB Bild)')
            body=json.loads(self.rfile.read(length) or b'{}')
            with LOCK:
                path=urlparse(self.path).path
                if path=='/api/player':
                    name=str(body.get('name','')).strip()[:50]
                    if not name:raise ValueError('Name erforderlich')
                    avatar=body.get('avatar','')
                    if avatar and (not isinstance(avatar,str) or len(avatar)>300_000 or not re.match(r'^data:image/webp;base64,',avatar)):
                        raise ValueError('Avatar muss ein optimiertes WebP-Bild sein')
                    pid=body.get('id')
                    existing=next((p for p in STATE['players'] if p['id']==pid),None)
                    if existing:existing.update(name=name,avatar=avatar)
                    else:
                        if len(STATE['players'])>=32:raise ValueError('Maximal 32 Spieler')
                        STATE['players'].append({'id':uuid.uuid4().hex,'name':name,'avatar':avatar})
                elif path=='/api/avatar':
                    result = optimize_avatar(body.get('image'))
                    return self.send(200, {'avatar': result})
                elif path=='/api/test_players':
                    target=body.get('target')
                    if type(target) is not int or target not in (16, 32):
                        raise ValueError('Nur 16 oder 32 Testspieler möglich')
                    first_names = ('Alex', 'Ben', 'Chris', 'Daniel', 'Elliot', 'Finn', 'George', 'Henry',
                                   'Jamie', 'Kai', 'Liam', 'Max', 'Noah', 'Oliver', 'Paul', 'Robin',
                                   'Sam', 'Theo', 'Victor', 'William', 'Anna', 'Emma', 'Lena', 'Mia',
                                   'Nina', 'Paula', 'Sophie', 'Tina', 'Laura', 'Julia', 'Marie', 'Zoe')
                    last_names = ('Miller', 'Smith', 'Brown', 'Taylor', 'Wilson', 'Clark', 'Walker',
                                  'Young', 'King', 'Scott', 'Green', 'Hill', 'Baker', 'Adams',
                                  'Turner', 'Carter', 'Parker', 'Evans', 'Collins', 'Cooper')
                    existing_names = {p['name'].casefold() for p in STATE['players']}
                    while len(STATE['players']) < target:
                        name = f'{random.choice(first_names)} {random.choice(last_names)}'
                        if name.casefold() in existing_names:
                            continue
                        existing_names.add(name.casefold())
                        STATE['players'].append({'id': uuid.uuid4().hex, 'name': name, 'avatar': ''})
                elif path=='/api/favorites':
                    name = str(body.get('name', '')).strip()[:50]
                    ids = body.get('players', [])
                    if not name: raise ValueError('Listenname erforderlich')
                    if not isinstance(ids, list): raise ValueError('Ungültige Spielerliste')
                    known = {p['id'] for p in STATE['players']}
                    ids = list(dict.fromkeys(i for i in ids if isinstance(i, str) and i in known))
                    fid = body.get('id')
                    existing = next((f for f in STATE['favorites'] if f['id'] == fid), None)
                    if existing: existing.update(name=name, players=ids)
                    else:
                        if len(STATE['favorites']) >= 50: raise ValueError('Maximal 50 Favoritenlisten')
                        STATE['favorites'].append({'id': uuid.uuid4().hex, 'name': name, 'players': ids})
                elif path=='/api/favorites_delete':
                    STATE['favorites'] = [f for f in STATE['favorites'] if f['id'] != body.get('id')]
                elif path=='/api/delete':
                    pid=body.get('id')
                    if STATE['game'] and pid in STATE['game']['players']:raise ValueError('Spieler ist Teil des aktuellen Spiels')
                    STATE['players']=[p for p in STATE['players'] if p['id']!=pid]
                    for favorite in STATE['favorites']:
                        favorite['players'] = [i for i in favorite['players'] if i != pid]
                elif path=='/api/start':
                    ids=body.get('players',[])
                    if any(i not in [p['id'] for p in STATE['players']] for i in ids):raise ValueError('Unbekannter Spieler')
                    STATE['game']=new_game(ids,body.get('mode','x01'),int(body.get('start',501)),body.get('out','double'),body.get('cricket','standard'),body.get('checkin','straight'),body.get('legs',1),body.get('sets',1))
                elif path=='/api/throw':
                    if not STATE['game']:raise ValueError('Kein aktives Spiel')
                    throw(STATE['game'],body.get('dart',''))
                elif path=='/api/correct':
                    if not STATE['game']:raise ValueError('Kein aktives Spiel')
                    correct_dart(STATE['game'],body.get('index'),body.get('dart',''))
                elif path=='/api/next':
                    if not STATE['game']:raise ValueError('Kein aktives Spiel')
                    next_turn(STATE['game'])
                elif path=='/api/advance_leg':
                    if not STATE['game']:raise ValueError('Kein aktives Spiel')
                    advance_leg(STATE['game'])
                elif path=='/api/rematch':
                    if not STATE['game'] or not STATE['game'].get('match_winner'):raise ValueError('Match noch nicht beendet')
                    STATE['game']=rematch(STATE['game'])
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
