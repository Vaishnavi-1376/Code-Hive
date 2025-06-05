const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs-extra'); // For file system operations, ensure it's installed

// Load the specific moved controller and service
const compilerController = require('./compilerController'); // Path is now relative to this index.js
const geminiService = require('./geminiService'); // Path is now relative to this index.js

dotenv.config();
const app = express();

// Use the same CORS settings as your main backend or adjust as needed
app.use(cors({
    origin: 'http://localhost:5173', // Allow your frontend to connect
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Define the port for this service (different from main-backend)
const COMPILER_SERVICE_PORT = process.env.COMPILER_SERVICE_PORT || 5001;

// Re-create the uploads path if it was used for temp/temp_code
// Note: If you need to serve static files from this service, re-add relevant paths.
// For compiler, often it's temp code execution, so actual static serving might not be needed here.
// However, ensure temp and temp_code folders exist if your compilerController relies on them.
const tempDir = path.join(__dirname, 'temp');
const tempCodeDir = path.join(__dirname, 'temp_code');

if (!fs.existsSync(tempDir)){
    fs.mkdirSync(tempDir);
}
if (!fs.existsSync(tempCodeDir)){
    fs.mkdirSync(tempCodeDir);
}

// API Routes for the Compiler/AI Service
// This service will now directly handle compilation and AI requests
app.post('/api/submit', compilerController.submitCode); // Handles code submission for judging

// NEW: Endpoint for just running code
app.post('/api/run', compilerController.runCode); // Handles direct code execution (e.g., "Run Code" button)


// NEW: Endpoint for AI Hint (previously commented out /api/gemini)
app.post('/api/hint', async (req, res, next) => {
    try {
        // Expecting prompt, userCode, and language from the main-backend
        const { prompt, userCode, language } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required for AI hint generation.' });
        }

        // Call the Gemini service function.
        // Ensure geminiService.getAIResponse in geminiService.js is updated
        // to accept these parameters and use them to generate the best hint.
        const hintResult = await geminiService.getAIResponse(prompt, userCode, language);

        // Send the AI hint back to the main-backend
        res.status(200).json({ hint: hintResult }); // Assuming getAIResponse returns the hint string directly

    } catch (error) {
        console.error("Error in AI hint generation (compiler-ai-service):", error.message);
        // Log the full stack trace for better debugging on the server side
        console.error(error.stack);
        // Send a proper 500 error response back to the main-backend
        res.status(500).json({
            aiExplanation: "AI Service Error",
            error: "Failed to generate AI hint. Please try again later. Check compiler-ai-service logs."
        });
    }
});


// Basic error handling for this service
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Something broke in the compiler/AI service!', error: err.message });
});

app.listen(COMPILER_SERVICE_PORT, () => {
    console.log(`Compiler/AI Service running on port ${COMPILER_SERVICE_PORT}`);
});