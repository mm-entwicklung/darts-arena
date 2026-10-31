import base64
import sqlite3
import tempfile
import unittest
from pathlib import Path

import database


class DatabaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / 'data' / 'darts_arena.db'

    def test_empty_and_restart(self):
        self.assertEqual(database.load(self.path), {'players': [], 'favorites': [], 'game': None})
        self.assertTrue(self.path.exists())
        self.assertEqual(database.load(self.path)['players'], [])

    def test_players_favorites_avatar_and_game(self):
        image = b'RIFFtestWEBP'
        avatar = 'data:image/webp;base64,' + base64.b64encode(image).decode()
        state = {'players': [{'id': 'p1', 'name': 'Änne', 'avatar': avatar},
                             {'id': 'p2', 'name': 'B', 'avatar': ''}],
                 'favorites': [{'id': 'f1', 'name': 'Familie', 'players': ['p2', 'p1']},
                               {'id': 'f2', 'name': 'Verein', 'players': ['p1']}],
                 'game': {'players': ['p1', 'p2'], 'round': 2}}
        database.save(state, self.path)
        self.assertEqual(database.load(self.path), state)
        with sqlite3.connect(self.path) as db:
            self.assertEqual(db.execute('SELECT avatar_webp FROM players WHERE id="p1"').fetchone()[0], image)
        state['players'][0]['avatar'] = ''
        state['favorites'].pop()
        state['game'] = None
        database.save(state, self.path)
        self.assertEqual(database.load(self.path), state)

    def test_failed_save_rolls_back(self):
        valid = {'players': [{'id': 'p', 'name': 'Test', 'avatar': ''}],
                 'favorites': [], 'game': None}
        database.save(valid, self.path)
        invalid = {'players': [], 'favorites': [{'id': 'f', 'name': 'Bad', 'players': ['missing']}], 'game': None}
        with self.assertRaises(sqlite3.IntegrityError):
            database.save(invalid, self.path)
        self.assertEqual(database.load(self.path), valid)


if __name__ == '__main__':
    unittest.main()
