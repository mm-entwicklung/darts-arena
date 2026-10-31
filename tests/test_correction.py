import unittest
from engine import new_game, throw, correct_dart

class CorrectionTests(unittest.TestCase):
    def test_x01_correction(self):
        g=new_game(['a','b'])
        throw(g,'T20');throw(g,'MISS');throw(g,'S20')
        correct_dart(g,0,'S20')
        self.assertEqual(g['scores']['a'],461)
        self.assertEqual(g['darts'],['S20','MISS','S20'])
        self.assertEqual([h['dart'] for h in g['history']],g['darts'])

    def test_double_in_replay(self):
        g=new_game(['a','b'],checkin='double')
        throw(g,'S20');throw(g,'D20')
        correct_dart(g,1,'S20')
        self.assertEqual(g['scores']['a'],501)
        self.assertFalse(g['entered']['a'])

    def test_cricket_replay(self):
        g=new_game(['a','b'],mode='cricket')
        throw(g,'T20');throw(g,'S20')
        correct_dart(g,0,'S20')
        self.assertEqual(g['marks']['a']['20'],2)
        self.assertEqual(g['scores']['a'],0)

    def test_undo_bust(self):
        g=new_game(['a','b'],start=32)
        throw(g,'T20')
        self.assertTrue(g['bust'])
        correct_dart(g,0,'D16')
        self.assertEqual(g['winner'],'a')
        self.assertFalse(g['bust'])

if __name__=='__main__': unittest.main()
