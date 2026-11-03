from dataclasses import dataclass, field

VALID_MODES = ('x01', 'cricket', 'clock', 'random_clock', 'bobs27', 'shanghai', 'bull', 'scoring')
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

def new_game(player_ids, mode='x01', start=501, out='double', cricket='standard', checkin='straight', legs=1, sets=1, difficulty='standard', rounds=10):
    if not 1<=len(player_ids)<=32 or len(set(player_ids))!=len(player_ids): raise ValueError('1–32 unterschiedliche Spieler erforderlich')
    if mode not in VALID_MODES: raise ValueError('Unbekannter Modus')
    if mode=='x01' and (not isinstance(start,int) or start<2 or start>10001): raise ValueError('Ungültiger Startwert')
    if out not in ('single','double','master'): raise ValueError('Ungültige Checkout-Regel')
    if checkin not in ('straight','double','master'): raise ValueError('Ungültige Check-In-Regel')
    if cricket not in ('standard','cutthroat','noscore'): raise ValueError('Ungültige Cricket-Variante')
    if type(legs) is not int or not 1 <= legs <= 21: raise ValueError('Legs pro Set: 1–21 erforderlich')
    if type(sets) is not int or not 1 <= sets <= 15: raise ValueError('Sets zum Matchgewinn: 1–15 erforderlich')
    if difficulty not in ('standard','double','triple'): raise ValueError('Ungültige Schwierigkeitsstufe')
    if type(rounds) is not int or not 1 <= rounds <= 100: raise ValueError('Runden: 1–100 erforderlich')
    import random
    order=list(range(1,21))+[25]
    if mode=='random_clock':
        order=list(range(1,21));random.shuffle(order);order.append(25)
    training={pid:{'progress':0,'darts':0,'points':27 if mode=='bobs27' else 0,'hits':0,'done':False,'failed':False,'round_hits':0,'round_score':0,'shanghai_marks':[], 'best_visit':0,'visits':0,'hundreds':0,'oneforties':0,'oneeighties':0} for pid in player_ids}
    return {'difficulty':difficulty,'rounds':rounds,'target_order':order,'training':training,'training_finished':False,'legs_target':legs,'sets_target':sets,'leg_wins':{p:0 for p in player_ids},'set_wins':{p:0 for p in player_ids},'leg_number':1,'set_number':1,'match_winner':None,'last_leg_winner':None,'last_set_winner':None,'first_player':0,'mode':mode,'players':list(player_ids),'turn':0,'darts':[], 'history':[], 'winner':None,
            'start':start,'out':out,'checkin':checkin,'cricket':cricket,
            'entered':{p:checkin=='straight' for p in player_ids},
            'scores':{p:start if mode=='x01' else 0 for p in player_ids},
            'marks':{p:{str(n):0 for n in CRICKET_NUMBERS} for p in player_ids},
            'turn_start':start if mode=='x01' else 0,'bust':False,'visit_snapshot':None}

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
    if game.get('training_finished') or (game['winner'] is not None and game['mode'] in ('x01','cricket')): raise ValueError('Spiel ist beendet')
    if game['mode'] in TRAINING_MODES and game['training'][game['players'][game['turn']]]['done']: raise ValueError('Training abgeschlossen; bitte weiter schalten')
    if len(game['darts'])>=3 or game['bust']: raise ValueError('Aufnahme beendet; bitte weiter schalten')
    hit=parse_dart(value); p=game['players'][game['turn']]
    if not game['darts']:
        import copy
        game['visit_snapshot']={'scores':copy.deepcopy(game['scores']), 'marks':copy.deepcopy(game['marks']),
                                'entered':copy.deepcopy(game['entered']), 'turn_start':game['turn_start']}
    game['darts'].append(hit[3]); game['history'].append({'player':p,'dart':hit[3]})
    if game['mode'] not in ('x01','cricket'):
        _training_throw(game,p,hit)
    elif game['mode']=='x01':
        entered=game.setdefault('entered',{pid:True for pid in game['players']})
        rule=game.get('checkin','straight')
        if not entered[p]:
            if hit[2]==0 or (rule=='double' and hit[1]!=2) or (rule=='master' and hit[1] not in (2,3)):
                return game
            entered[p]=True
        remaining=game['scores'][p]-hit[2]
        if remaining<0 or (remaining==0 and not _out_ok(hit,game['out'])) or (remaining==1 and game['out']=='double'):
            game['scores'][p]=game['turn_start'];game['bust']=True
        else:
            game['scores'][p]=remaining
            if remaining==0: game['winner']=p
    else:
        _cricket_hit(game,p,hit)
        if _cricket_winner(game,p):game['winner']=p
    if game['winner'] is not None and game['mode'] in ('x01','cricket'): _record_leg_win(game)
    return game

def next_turn(game):
    if game.get('training_finished') or (game['winner'] is not None and game['mode'] in ('x01','cricket')): raise ValueError('Spiel ist beendet')
    if not game['darts']: raise ValueError('Mindestens ein Wurf erforderlich')
    if game['mode'] not in ('x01','cricket'):
        _training_end_visit(game)
        if game['training_finished']: return game
        available=[i for i,p in enumerate(game['players']) if not game['training'][p]['done']]
        game['turn']=next((i for i in [(game['turn']+j)%len(game['players']) for j in range(1,len(game['players'])+1)] if i in available),game['turn'])
    else:
        game['turn']=(game['turn']+1)%len(game['players'])
    game['darts']=[];game['bust']=False;game['visit_snapshot']=None
    game['turn_start']=game['scores'][game['players'][game['turn']]]
    return game

def correct_dart(game, index, value):
    """Re-evaluate the current visit from its pre-visit snapshot."""
    if not isinstance(index, int) or isinstance(index, bool) or not 0 <= index < len(game['darts']):
        raise ValueError('Ungültige Dart-Position')
    if game['mode'] not in ('x01','cricket'):
        return _correct_training(game,index,value)
    snapshot = game.get('visit_snapshot')
    if snapshot is None:
        raise ValueError('Diese ältere Aufnahme kann nicht korrigiert werden; bitte ein neues Spiel starten')
    import copy
    darts = list(game['darts'])
    darts[index] = parse_dart(value)[3]
    old_history = game['history'][:-len(game['darts'])]
    game['scores'] = copy.deepcopy(snapshot['scores'])
    game['marks'] = copy.deepcopy(snapshot['marks'])
    game['entered'] = copy.deepcopy(snapshot['entered'])
    if game.get('recorded_leg') == game.get('leg_number'):
        previous_winner = game['winner']
        game['leg_wins'][previous_winner] -= 1
        if game['last_set_winner'] == previous_winner and game['leg_wins'][previous_winner] == game['legs_target'] - 1:
            game['set_wins'][previous_winner] -= 1
        game['match_winner'] = None
    game['winner'] = None
    game['recorded_leg'] = None
    game['bust'] = False
    game['darts'] = []
    game['history'] = old_history
    game['turn_start'] = snapshot['turn_start']
    # A corrected throw can finish the leg or cause a bust. Later darts are
    # then discarded rather than applying them to a finished visit.
    for dart in darts:
        if game['winner'] is not None or game['bust']:
            break
        throw(game, dart)
    return game


def _record_leg_win(game):
    winner = game['winner']
    if game.get('recorded_leg') == game.get('leg_number'): return
    game['recorded_leg'] = game['leg_number']
    game['last_leg_winner'] = winner
    game['leg_wins'][winner] += 1
    if game['leg_wins'][winner] >= game['legs_target']:
        game['last_set_winner'] = winner
        game['set_wins'][winner] += 1
        if game['set_wins'][winner] >= game['sets_target']:
            game['match_winner'] = winner


def advance_leg(game):
    """Confirm a finished leg, advance the set or end the match."""
    winner = game.get('winner')
    if winner is None: raise ValueError('Das Leg ist noch nicht beendet')
    if game.get('match_winner'): raise ValueError('Das Match ist bereits beendet')
    if game['leg_wins'][winner] >= game['legs_target']:
        game['leg_wins'] = {p:0 for p in game['players']}
        game['set_number'] += 1
    game['leg_number'] += 1
    game['first_player'] = (game['first_player'] + 1) % len(game['players'])
    game['turn'] = game['first_player']
    game['darts'] = []
    game['history'] = []
    game['winner'] = None
    game['recorded_leg'] = None
    game['bust'] = False
    game['visit_snapshot'] = None
    game['scores'] = {p:game['start'] if game['mode']=='x01' else 0 for p in game['players']}
    game['marks'] = {p:{str(n):0 for n in CRICKET_NUMBERS} for p in game['players']}
    game['entered'] = {p:game['checkin']=='straight' for p in game['players']}
    game['turn_start'] = game['scores'][game['players'][game['turn']]]
    return game

def rematch(game):
    return new_game(game['players'], game['mode'], game['start'], game['out'], game['cricket'], game['checkin'], game.get('legs_target',1), game.get('sets_target',1),game.get('difficulty','standard'),game.get('rounds',10))


TRAINING_MODES=('clock','random_clock','bobs27','shanghai','bull','scoring')
def _training_target(game,p):
    t=game['training'][p]; mode=game['mode']; progress=t['progress']
    if mode in ('clock','random_clock'): return game['target_order'][min(progress,20)]
    if mode=='bobs27': return (progress+1 if progress<20 else 25)
    if mode=='shanghai': return min(progress+1,7)
    return 25 if mode=='bull' else None

def _training_throw(game,p,hit):
    import copy
    if not game['darts'][:-1]:
        game['visit_snapshot']={'training':copy.deepcopy(game['training']), 'history_len':len(game['history'])-1}
    t=game['training'][p]; mode=game['mode']; n,mult,points,_=hit
    t['darts']+=1
    target=_training_target(game,p)
    if mode in ('clock','random_clock'):
        good=(n==target and (target==25 and (mult==2 if game['difficulty']!='standard' else True) or target!=25 and (game['difficulty']=='standard' or mult=={'double':2,'triple':3}[game['difficulty']])))
        if good: t['progress']+=1;t['hits']+=1
        if t['progress']>=21:t['done']=True
    elif mode=='bobs27':
        if n==target and mult==2:t['round_hits']+=1;t['hits']+=1;t['points']+=2*target
    elif mode=='shanghai':
        if n==target:
            t['points']+=points;t['hits']+=1
            if mult not in t['shanghai_marks']:t['shanghai_marks'].append(mult)
            if len(t['shanghai_marks'])==3:t['done']=True
    elif mode=='bull':
        if n==25:t['points']+=points;t['hits']+=1
    elif mode=='scoring':
        t['points']+=points
        if points:t['hits']+=1
        t['round_score']+=points
    if t['done']:
        _training_finish_check(game)

def _training_end_visit(game):
    p=game['players'][game['turn']];t=game['training'][p];mode=game['mode']
    if mode=='bobs27':
        if not t['round_hits']:t['points']-=2*_training_target(game,p)
        t['round_hits']=0;t['progress']+=1
        if t['points']<0:t['done']=True;t['failed']=True
        if t['progress']>=21:t['done']=True
    elif mode=='shanghai':
        t['progress']+=1;t['shanghai_marks']=[]
        if t['progress']>=7:t['done']=True
    elif mode in ('bull','scoring'):
        t['progress']+=1
        if mode=='scoring':
            score=t['round_score'];t['best_visit']=max(t['best_visit'],score)
            t['hundreds']+=score>=100;t['oneforties']+=score>=140;t['oneeighties']+=score==180
            t['round_score']=0
        if t['progress']>=game['rounds']:t['done']=True
    _training_finish_check(game)

def _training_finish_check(game):
    if all(t['done'] for t in game['training'].values()):
        game['training_finished']=True
        # Trainingsergebnisse sind keine Legs/Sets. Der beste Punktwert gewinnt
        # nur bei punktbasierten Trainingsspielen; Zielspiele enden mit dem Abschluss.
        if game['mode'] in ('bull','scoring','shanghai','bobs27'):
            eligible=[p for p in game['players'] if not game['training'][p]['failed']]
            if eligible:
                best=max(game['training'][p]['points'] for p in eligible)
                winners=[p for p in eligible if game['training'][p]['points']==best]
                if len(winners)==1:game['winner']=winners[0]
        elif len(game['players'])==1:game['winner']=game['players'][0]

def _correct_training(game,index,value):
    if type(index) is not int or not 0<=index<len(game['darts']):raise ValueError('Ungültige Dart-Position')
    snap=game.get('visit_snapshot')
    if not snap:raise ValueError('Aufnahme kann nicht korrigiert werden')
    import copy
    darts=list(game['darts']);darts[index]=parse_dart(value)[3]
    game['training']=copy.deepcopy(snap['training'])
    game['history']=game['history'][:snap['history_len']]
    game['darts']=[];game['winner']=None;game['training_finished']=False
    for d in darts:
        if game['training_finished']:break
        throw(game,d)
    return game
