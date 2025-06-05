// main-backend/routes/problemRoutes.js

const express = require('express');
const router = express.Router();
const {
    createProblem,
    getProblems,
    getProblemById,
    updateProblem,
    deleteProblem,
    getProblemHint,
    submitSolution, // <--- ADDED: Import new controller function
} = require('../controllers/problemController');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Admin routes for problems
router.post('/', protect, authorizeRoles('admin'), createProblem);
router.put('/:id', protect, authorizeRoles('admin'), updateProblem);
router.delete('/:id', protect, authorizeRoles('admin'), deleteProblem);

// Public routes for problems (or user-accessible)
router.get('/', getProblems);
router.get('/:id', getProblemById);
router.post('/:id/hint', protect, getProblemHint);

// NEW ROUTE: For submitting a user's solution to a problem
// This will create a new Submission record in your database.
router.post('/:id/submit', protect, submitSolution); // <--- ADDED: New route for submission

module.exports = router;