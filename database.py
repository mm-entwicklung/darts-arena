"""Local SQLite persistence for Darts Arena (schema v1, no JSON import)."""
import base64
import json
import sqlite3
from contextlib import closing
from pathlib import Path

DEFAULT_DB = Path(__file__).resolve().parent / 'data' / 'darts_arena.db'


def connect(path=DEFAULT_DB):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path, timeout=10)
    connection.execute('PRAGMA foreign_keys = ON')
    connection.execute('PRAGMA busy_timeout = 10000')
    return connection


def initialize(path=DEFAULT_DB):
    with closing(connect(path)) as db, db:
        db.executescript('''
            CREATE TABLE IF NOT EXISTS players (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                avatar_webp BLOB
            );
            CREATE TABLE IF NOT EXISTS favorites (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS favorite_players (
                favorite_id TEXT NOT NULL REFERENCES favorites(id) ON DELETE CASCADE,
                player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
                position INTEGER NOT NULL,
                PRIMARY KEY (favorite_id, player_id)
            );
            CREATE TABLE IF NOT EXISTS current_game (
                singleton INTEGER PRIMARY KEY CHECK(singleton = 1),
                state_json TEXT NOT NULL
            );
        ''')


def avatar_to_blob(value):
    if not value:
        return None
    prefix = 'data:image/webp;base64,'
    if not isinstance(value, str) or not value.startswith(prefix):
        raise ValueError('Avatar muss ein optimiertes WebP-Bild sein')
    return base64.b64decode(value[len(prefix):], validate=True)


def blob_to_avatar(value):
    return 'data:image/webp;base64,' + base64.b64encode(value).decode('ascii') if value else ''


def load(path=DEFAULT_DB):
    initialize(path)
    with closing(connect(path)) as db, db:
        players = [dict(id=pid, name=name, avatar=blob_to_avatar(avatar))
                   for pid, name, avatar in db.execute('SELECT id, name, avatar_webp FROM players ORDER BY rowid')]
        favorites = []
        for fid, name in db.execute('SELECT id, name FROM favorites ORDER BY rowid'):
            ids = [row[0] for row in db.execute('''
                SELECT player_id FROM favorite_players
                WHERE favorite_id = ? ORDER BY position''', (fid,))]
            favorites.append({'id': fid, 'name': name, 'players': ids})
        game_row = db.execute('SELECT state_json FROM current_game WHERE singleton = 1').fetchone()
        return {'players': players, 'favorites': favorites,
                'game': json.loads(game_row[0]) if game_row else None}


def save(state, path=DEFAULT_DB):
    """Persist a complete validated state atomically; failed writes roll back."""
    initialize(path)
    with closing(connect(path)) as db, db:
        # Deleting in dependency order preserves foreign key integrity.
        db.execute('DELETE FROM favorite_players')
        db.execute('DELETE FROM favorites')
        db.execute('DELETE FROM players')
        db.execute('DELETE FROM current_game')
        db.executemany('INSERT INTO players (id, name, avatar_webp) VALUES (?, ?, ?)',
                       [(p['id'], p['name'], avatar_to_blob(p.get('avatar', '')))
                        for p in state['players']])
        db.executemany('INSERT INTO favorites (id, name) VALUES (?, ?)',
                       [(f['id'], f['name']) for f in state['favorites']])
        db.executemany('''INSERT INTO favorite_players
                          (favorite_id, player_id, position) VALUES (?, ?, ?)''',
                       [(f['id'], pid, pos) for f in state['favorites']
                        for pos, pid in enumerate(f['players'])])
        if state['game'] is not None:
            db.execute('INSERT INTO current_game VALUES (1, ?)',
                       (json.dumps(state['game'], ensure_ascii=False),))
