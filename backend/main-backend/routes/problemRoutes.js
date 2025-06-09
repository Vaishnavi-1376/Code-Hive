const express = require('express');
const router = express.Router();
const {
    createProblem,
    getProblems,
    getProblemById,
    updateProblem,
    deleteProblem,
    getProblemHint,
    submitSolution, 
} = require('../controllers/problemController');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');


router.post('/', protect, authorizeRoles('admin'), createProblem);
router.put('/:id', protect, authorizeRoles('admin'), updateProblem);
router.delete('/:id', protect, authorizeRoles('admin'), deleteProblem);
router.get('/', getProblems);
router.get('/:id', getProblemById);
router.post('/:id/hint', protect, getProblemHint);
router.post('/:id/submit', protect, submitSolution); 

module.exports = router;