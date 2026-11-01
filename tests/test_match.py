import unittest
from engine import new_game, throw, advance_leg, rematch, correct_dart

class MatchTests(unittest.TestCase):
    def test_legs_sets_and_rematch(self):
        g = new_game(['a','b'], start=2, out='single', legs=2, sets=2)
        for i in range(4):
            self.assertEqual(g['players'][g['turn']], ['a','b','a','b'][i])
            throw(g, 'D1')
            if i < 3:
                self.assertIsNone(g['match_winner'])
                advance_leg(g)
        # alternating starters produce one set for each player, not a match win
        self.assertEqual(g['set_wins'], {'a':1,'b':0})
        self.assertIsNone(g['match_winner'])
    def test_single_leg_match(self):
        g = new_game(['a','b'], start=2, out='single')
        throw(g,'D1')
        self.assertEqual(g['match_winner'],'a')
        r=rematch(g)
        self.assertEqual(r['set_wins'], {'a':0,'b':0})
        self.assertEqual(r['players'],g['players'])
    def test_correct_win(self):
        g = new_game(['a','b'], start=2, out='single')
        throw(g,'D1')
        correct_dart(g,0,'MISS')
        self.assertIsNone(g['winner'])
        self.assertIsNone(g['match_winner'])
        self.assertEqual(g['leg_wins']['a'],0)
