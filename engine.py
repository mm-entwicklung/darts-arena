from dataclasses import dataclass, field

VALID_MODES = ('x01', 'cricket')
CRICKET_NUMBERS = (20, 19, 18, 17, 16, 15, 25)

def parse_dart(value):
    s = str(value).strip().upper()
    if s in ('MISS','M','0'): return (0,0,0,'MISS')
    if s in ('SB','B','BULL','S25'): return (25,1,25,'S25')
    if s in ('DB','D25','BULLSEYE'): return (25,2,50,'D25')
    if len(s)<2 or s[0] not in 'SDT' or not s[1:].isdigit(): raise ValueError('Ungültiger Dart')
    n=int(s[1:]); mult={'S':1,'D':2,'T':3}[s[0]]
    if not 1<=n<=20: raise ValueError('Feld außerhalb 1–20')
    return (n,mult,n*mult,s)

def new_game(player_ids, mode='x01', start=501, out='double', cricket='standard'):
    if not 2<=len(player_ids)<=32 or len(set(player_ids))!=len(player_ids): raise ValueError('2–32 unterschiedliche Spieler erforderlich')
    if mode not in VALID_MODES: raise ValueError('Unbekannter Modus')
    if mode=='x01' and (not isinstance(start,int) or start<2 or start>10001): raise ValueError('Ungültiger Startwert')
    if out not in ('single','double','master'): raise ValueError('Ungültige Checkout-Regel')
    if cricket not in ('standard','cutthroat','noscore'): raise ValueError('Ungültige Cricket-Variante')
    return {'mode':mode,'players':list(player_ids),'turn':0,'darts':[], 'history':[], 'winner':None,
            'start':start,'out':out,'cricket':cricket,
            'scores':{p:start if mode=='x01' else 0 for p in player_ids},
            'marks':{p:{str(n):0 for n in CRICKET_NUMBERS} for p in player_ids},
            'turn_start':start if mode=='x01' else 0,'bust':False}

def _out_ok(hit, out):
    return out=='single' or (out=='double' and hit[1]==2) or (out=='master' and hit[1]>=2)

def _cricket_hit(game, player, hit):
    number, mult, _, _ = hit
    if number not in CRICKET_NUMBERS: return
    key=str(number); marks=game['marks'][player]
    extra=max(0,marks[key]+mult-3)
    marks[key]=min(3,marks[key]+mult)
    if not extra or game['cricket']=='noscore': return
    others=[p for p in game['players'] if p!=player and game['marks'][p][key]<3]
    if game['cricket']=='standard':
        if others: game['scores'][player]+=extra*number
    else:
        for other in others: game['scores'][other]+=extra*number

def _cricket_winner(game, player):
    if not all(v==3 for v in game['marks'][player].values()): return False
    scores=game['scores']; own=scores[player]
    if game['cricket']=='standard': return all(own>=scores[p] for p in game['players'])
    if game['cricket']=='cutthroat': return all(own<=scores[p] for p in game['players'])
    return True

def throw(game, value):
    if game['winner'] is not None: raise ValueError('Spiel ist beendet')
    if len(game['darts'])>=3 or game['bust']: raise ValueError('Aufnahme beendet; bitte weiter schalten')
    hit=parse_dart(value); p=game['players'][game['turn']]
    game['darts'].append(hit[3]); game['history'].append({'player':p,'dart':hit[3]})
    if game['mode']=='x01':
        remaining=game['scores'][p]-hit[2]
        if remaining<0 or (remaining==0 and not _out_ok(hit,game['out'])) or (remaining==1 and game['out']=='double'):
            game['scores'][p]=game['turn_start'];game['bust']=True
        else:
            game['scores'][p]=remaining
            if remaining==0: game['winner']=p
    else:
        _cricket_hit(game,p,hit)
        if _cricket_winner(game,p):game['winner']=p
    return game

def next_turn(game):
    if game['winner'] is not None: raise ValueError('Spiel ist beendet')
    if not game['darts']: raise ValueError('Mindestens ein Wurf erforderlich')
    game['turn']=(game['turn']+1)%len(game['players'])
    game['darts']=[];game['bust']=False
    game['turn_start']=game['scores'][game['players'][game['turn']]]
    return game
