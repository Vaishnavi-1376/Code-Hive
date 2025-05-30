const express = require('express');
const router = express.Router();
const {
    createProblem,
    getProblems,
    getProblemById,
    updateProblem,
    deleteProblem,
    getProblemHint, 
} = require('../controllers/problemController');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', protect, authorizeRoles('admin'), createProblem);
router.get('/', getProblems);
router.get('/:id', getProblemById);
router.put('/:id', protect, authorizeRoles('admin'), updateProblem);
router.delete('/:id', protect, authorizeRoles('admin'), deleteProblem);
router.post('/:id/hint', protect, getProblemHint); 

module.exports = router;