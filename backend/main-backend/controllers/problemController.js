// main-backend/controllers/problemController.js

const Problem = require('../models/Problem');
const Submission = require('../models/Submission'); // <--- ADDED: Import Submission model
const User = require('../models/User'); // <--- ADDED: Import User model (for optional direct update later)
const asyncHandler = require('express-async-handler');
const axios = require('axios');

// Make sure this URL matches what you configured in main-backend/index.js
// If you updated main-backend/index.js to use http://localhost:5001,
// then this should also be 5001. If you're using a .env file,
// you'd typically access process.env.COMPILER_AI_SERVICE_URL here.
const COMPILER_AI_SERVICE_URL = process.env.COMPILER_AI_SERVICE_URL || 'http://localhost:5001'; // Ensure this points to your compiler-ai-service

const normalizeTags = (tags) => {
    if (Array.isArray(tags)) return tags.map(tag => tag.trim());
    if (typeof tags === 'string') return tags.split(',').map(tag => tag.trim());
    return [];
};

const createProblem = asyncHandler(async (req, res) => {
    const { title, description, difficulty, tags, sampleInput, sampleOutput, testCases } = req.body;

    if (!title || !description || !difficulty) {
        res.status(400);
        throw new Error('Please enter all required fields: title, description, difficulty');
    }

    const problemExists = await Problem.findOne({ title });
    if (problemExists) {
        res.status(400);
        throw new Error('Problem with this title already exists');
    }

    const problem = await Problem.create({
        title,
        description,
        difficulty,
        tags: normalizeTags(tags),
        sampleInput,
        sampleOutput,
        testCases: testCases || [],
        createdBy: req.user._id,
    });

    res.status(201).json(problem);
});

const getProblems = asyncHandler(async (req, res) => {
    const problems = await Problem.find({});
    res.status(200).json(problems);
});

const getProblemById = asyncHandler(async (req, res) => {
    const problem = await Problem.findById(req.params.id);

    if (problem) {
        res.status(200).json(problem);
    } else {
        res.status(404);
        throw new Error('Problem not found');
    }
});

const updateProblem = asyncHandler(async (req, res) => {
    const { title, description, difficulty, tags, sampleInput, sampleOutput, testCases } = req.body;

    const problem = await Problem.findById(req.params.id);
    if (!problem) {
        res.status(404);
        throw new Error('Problem not found');
    }

    if (title && title !== problem.title) {
        const problemExists = await Problem.findOne({ title });
        if (problemExists && problemExists._id.toString() !== problem._id.toString()) {
            res.status(400);
            throw new Error('Another problem with this title already exists.');
        }
    }

    problem.title = title || problem.title;
    problem.description = description || problem.description;
    problem.difficulty = difficulty || problem.difficulty;
    problem.tags = normalizeTags(tags) || problem.tags;
    problem.sampleInput = sampleInput !== undefined ? sampleInput : problem.sampleInput;
    problem.sampleOutput = sampleOutput !== undefined ? sampleOutput : problem.sampleOutput;
    problem.testCases = testCases || problem.testCases;
    problem.updatedAt = Date.now();

    const updatedProblem = await problem.save();

    res.status(200).json(updatedProblem);
});

const deleteProblem = asyncHandler(async (req, res) => {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
        res.status(404);
        throw new Error('Problem not found');
    }

    await Problem.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'Problem removed successfully' });
});

const getProblemHint = asyncHandler(async (req, res) => {
    const { userCode, language } = req.body; // Assuming these come from the frontend
    const problemId = req.params.id;
    const problem = await Problem.findById(problemId);
    if (!problem) {
        res.status(404);
        throw new Error('Problem not found.');
    }

    const actualProblemTitle = problem.title;
    const actualProblemDescription = problem.description;

    if (!actualProblemDescription || !actualProblemTitle) {
        res.status(400);
        throw new Error('Problem description and title are required from the database to generate a hint.');
    }

    let prompt = `I am trying to solve a coding problem titled "${actualProblemTitle}" with the following description:\n\n${actualProblemDescription}\n\n`;

    if (userCode) {
        const codeLanguage = language || 'plaintext';
        prompt += `Here is my current code in ${codeLanguage}:\n\n\`\`\`${codeLanguage}\n${userCode}\n\`\`\`\n\n`;
        prompt += `Please provide a hint that helps me debug or understand the problem better, considering my current code. Do NOT give away the full solution. Focus on common pitfalls, algorithmic ideas, or how to approach the problem's constraints. If my code has obvious syntax errors or runtime issues, point those out with a general explanation.`;
    } else {
        prompt += `Please provide a hint for this coding problem. Do NOT give away the full solution. Focus on common pitfalls, algorithmic ideas, or how to approach the problem's constraints.`;
    }

    try {
        // --- THIS IS THE CRITICAL CHANGE ---
        // Instead of directly calling getAIResponse, make an HTTP request to your compiler-ai-service
        const aiResponse = await axios.post(`${COMPILER_AI_SERVICE_URL}/api/hint`, {
            prompt: prompt, // Send the constructed prompt to the AI service
            problemId: problemId, // Optionally pass problemId
            userCode: userCode, // Optionally pass userCode
            language: language // Optionally pass language
            // Pass any other context your compiler-ai-service's AI endpoint might need
        });

        // The response from your compiler-ai-service should contain the hint
        // It's likely in aiResponse.data.aiExplanation as per your previous error message structure
        // Or if your compiler-ai-service returns { hint: "..." } then it's aiResponse.data.hint
        res.status(200).json(aiResponse.data); // Forward the entire response data from the AI service

    } catch (error) {
        console.error('Error in main-backend forwarding AI hint request:', error.message);
        if (error.response) {
            // If the compiler-ai-service sent an error response (e.g., 500 from its side), forward that
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            // The request was made but no response was received (e.g., network error, service down)
            res.status(503).json({ error: 'AI Service Unreachable.', aiExplanation: 'Could not connect to the AI hint service.' });
        } else {
            // Something else happened in setting up the request
            res.status(500).json({ error: 'Internal Server Error', aiExplanation: 'An unexpected error occurred while processing the AI hint request.' });
        }
    }
});

// NEW CONTROLLER FUNCTION: submitSolution
const submitSolution = asyncHandler(async (req, res) => {
    const problemId = req.params.id; // Problem ID from the URL parameter
    const userId = req.user._id;     // User ID from the `protect` middleware (assuming req.user is populated)

    // Destructure all expected fields from the request body for the submission
    const {
        code,
        language,
        verdict, // This is crucial: 'Accepted', 'Wrong Answer', etc.
        output,
        compilerOutput,
        testResults,
        runtime, // If your compiler service provides runtime/memory
        memory,  // If your compiler service provides runtime/memory
    } = req.body;

    // Basic validation
    if (!code || !language || !verdict) {
        res.status(400);
        throw new Error('Missing required fields for submission: code, language, and verdict.');
    }

    try {
        // Ensure the problem exists
        const problem = await Problem.findById(problemId);
        if (!problem) {
            res.status(404);
            throw new Error('Problem not found.');
        }

        // Create the new submission document
        const submission = await Submission.create({
            user: userId,
            problem: problemId,
            code,
            language,
            verdict,
            output: output || '', // Use default if not provided
            compilerOutput: compilerOutput || '', // Use default if not provided
            testResults: testResults || [], // Use default if not provided
            // Include runtime and memory if they are part of your submission body
            ...(runtime !== undefined && { runtime }), // Only add if defined
            ...(memory !== undefined && { memory }),   // Only add if defined
        });

        // Log for debugging
        console.log(`New submission created: ${submission._id} for user ${userId}, problem ${problemId} with verdict: ${verdict}`);

        // You *do not need* to update problemsSolvedCount on the User model directly here
        // because your `getUserStats` and `getLeaderboard` already calculate it
        // by aggregating accepted submissions.
        // If you still *want* a denormalized count on the User model for other reasons,
        // you would add that logic here (and remember to handle unique solved problems).

        res.status(201).json({
            message: 'Submission recorded successfully',
            submissionId: submission._id,
            verdict: submission.verdict,
        });

    } catch (error) {
        console.error('Error saving submission:', error);
        res.status(500).json({ message: 'Failed to record submission.', error: error.message });
    }
});

module.exports = {
    createProblem,
    getProblems,
    getProblemById,
    updateProblem,
    deleteProblem,
    getProblemHint,
    submitSolution, // <--- ADDED: Export the new function
};