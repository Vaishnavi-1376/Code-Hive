const Problem = require('../models/Problem');
const Submission = require('../models/Submission'); 
const User = require('../models/User'); 
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const COMPILER_AI_SERVICE_URL = process.env.COMPILER_AI_SERVICE_URL || 'http://localhost:5001'; 

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
    const { userCode, language } = req.body; 
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
        const aiResponse = await axios.post(`${COMPILER_AI_SERVICE_URL}/api/hint`, {
            prompt: prompt, 
            problemId: problemId,
            userCode: userCode, 
            language: language 
        });

        res.status(200).json(aiResponse.data); 

    } catch (error) {
        console.error('Error in main-backend forwarding AI hint request:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            res.status(503).json({ error: 'AI Service Unreachable.', aiExplanation: 'Could not connect to the AI hint service.' });
        } else {
            res.status(500).json({ error: 'Internal Server Error', aiExplanation: 'An unexpected error occurred while processing the AI hint request.' });
        }
    }
});

const submitSolution = asyncHandler(async (req, res) => {
    const problemId = req.params.id; 
    const userId = req.user._id;    

    const {
        code,
        language,
        verdict, 
        output,
        compilerOutput,
        testResults,
        runtime, 
        memory,  
    } = req.body;

    
    if (!code || !language || !verdict) {
        res.status(400);
        throw new Error('Missing required fields for submission: code, language, and verdict.');
    }

    try {
        const problem = await Problem.findById(problemId);
        if (!problem) {
            res.status(404);
            throw new Error('Problem not found.');
        }

        const submission = await Submission.create({
            user: userId,
            problem: problemId,
            code,
            language,
            verdict,
            output: output || '', 
            compilerOutput: compilerOutput || '', 
            testResults: testResults || [], 
            ...(runtime !== undefined && { runtime }), 
            ...(memory !== undefined && { memory }),  
        });

        console.log(`New submission created: ${submission._id} for user ${userId}, problem ${problemId} with verdict: ${verdict}`);

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
    submitSolution,
};