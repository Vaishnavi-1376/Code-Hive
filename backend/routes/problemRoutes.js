const express = require('express');
const router = express.Router();
const {
  createProblem,
  getProblems,
  getProblemById,
  updateProblem,
  deleteProblem, 
} = require('../controllers/problemController');
const { protect } = require('../middleware/authMiddleware');
router.post('/', protect, createProblem);
router.get('/', getProblems);
router.get('/:id', getProblemById);
router.put('/:id', protect, updateProblem); 
router.delete('/:id', protect, deleteProblem); 

module.exports = router;