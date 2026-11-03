import unittest
from engine import new_game, throw, next_turn, correct_dart
class TrainingTests(unittest.TestCase):
 def test_single_x01(self):
  g=new_game(['solo']);throw(g,'S20');next_turn(g);self.assertEqual(g['turn'],0)
 def test_clock_levels(self):
  for diff,miss,good in [('standard','MISS','S1'),('double','S1','D1'),('triple','D1','T1')]:
   g=new_game(['solo'],mode='clock',difficulty=diff)
   throw(g,miss);self.assertEqual(g['training']['solo']['progress'],0)
   throw(g,good);self.assertEqual(g['training']['solo']['progress'],1)
 def test_clock_bull(self):
  g=new_game(['solo'],mode='clock',difficulty='double')
  for n in range(1,21):
   throw(g,f'D{n}');next_turn(g)
  throw(g,'S25');self.assertFalse(g['training_finished'])
  throw(g,'D25');self.assertTrue(g['training_finished'])
 def test_bobs(self):
  g=new_game(['solo'],mode='bobs27');throw(g,'MISS');next_turn(g)
  self.assertEqual(g['training']['solo']['points'],25)
 def test_correct(self):
  g=new_game(['solo'],mode='clock');throw(g,'S1');self.assertEqual(g['training']['solo']['progress'],1)
  correct_dart(g,0,'MISS');self.assertEqual(g['training']['solo']['progress'],0)
 def test_shanghai(self):
  g=new_game(['solo'],mode='shanghai')
  for dart in ('S1','D1','T1'):throw(g,dart)
  self.assertTrue(g['training_finished'])
 def test_scoring(self):
  g=new_game(['solo'],mode='scoring',rounds=1)
  for _ in range(3):throw(g,'T20')
  next_turn(g);self.assertTrue(g['training_finished']);self.assertEqual(g['training']['solo']['oneeighties'],1)
if __name__=='__main__':unittest.main()
