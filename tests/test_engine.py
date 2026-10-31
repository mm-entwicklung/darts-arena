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
 def test_double_in_ignores_non_double_and_counts_entry(self):
  g=new_game(['a','b'],start=501,checkin='double')
  throw(g,'S20');throw(g,'T20');self.assertEqual(g['scores']['a'],501)
  throw(g,'D20');self.assertEqual(g['scores']['a'],461);self.assertTrue(g['entered']['a'])
 def test_master_in_accepts_triple_and_bull(self):
  g=new_game(['a','b'],checkin='master')
  throw(g,'T20');self.assertEqual(g['scores']['a'],441)
  next_turn(g);throw(g,'D25');self.assertEqual(g['scores']['b'],451)
 def test_double_in_bull_and_independent_players(self):
  g=new_game(['a','b'],checkin='double')
  throw(g,'D25');self.assertEqual(g['scores']['a'],451)
  next_turn(g);throw(g,'S20');self.assertEqual(g['scores']['b'],501)
 def test_straight_in_default(self):
  g=new_game(['a','b']);throw(g,'S20');self.assertEqual(g['scores']['a'],481)
 def test_invalid_checkin(self):
  with self.assertRaises(ValueError):new_game(['a','b'],checkin='invalid')
 def test_max_players(self):
  self.assertEqual(len(new_game([str(i) for i in range(32)])['players']),32)
  with self.assertRaises(ValueError):new_game([str(i) for i in range(33)])
if __name__=='__main__':unittest.main()
