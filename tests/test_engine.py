import unittest
from engine import new_game,throw,next_turn,parse_dart
class EngineTests(unittest.TestCase):
 def test_parse(self):
  self.assertEqual(parse_dart('T20')[2],60)
  self.assertEqual(parse_dart('DB')[2],50)
  with self.assertRaises(ValueError):parse_dart('T25')
 def test_x01_bust(self):
  g=new_game(['a','b'],start=101)
  throw(g,'T20');throw(g,'T20')
  self.assertEqual(g['scores']['a'],101);self.assertTrue(g['bust'])
 def test_double_out(self):
  g=new_game(['a','b'],start=40)
  throw(g,'D20');self.assertEqual(g['winner'],'a')
 def test_wrong_out(self):
  g=new_game(['a','b'],start=40)
  throw(g,'S20');throw(g,'S20');self.assertEqual(g['scores']['a'],40)
 def test_turn(self):
  g=new_game(['a','b']);throw(g,'MISS');next_turn(g);self.assertEqual(g['players'][g['turn']],'b')
 def test_cricket_marks(self):
  g=new_game(['a','b'],mode='cricket');throw(g,'T20');throw(g,'T20');self.assertEqual(g['marks']['a']['20'],3);self.assertEqual(g['scores']['a'],60)
 def test_cutthroat(self):
  g=new_game(['a','b'],mode='cricket',cricket='cutthroat');throw(g,'T20');throw(g,'T20');self.assertEqual(g['scores']['b'],60)
 def test_max_players(self):
  self.assertEqual(len(new_game([str(i) for i in range(32)])['players']),32)
  with self.assertRaises(ValueError):new_game([str(i) for i in range(33)])
if __name__=='__main__':unittest.main()
