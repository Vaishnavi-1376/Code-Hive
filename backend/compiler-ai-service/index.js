const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs-extra');

const compilerController = require('./compilerController');
const geminiService = require('./geminiService');

dotenv.config();
const app = express();


const compilerAllowedOrigins = process.env.COMPILER_CORS_ORIGIN ? process.env.COMPILER_CORS_ORIGIN.split(',') : [
  'https://mycodehive.vercel.app', 
  'https://online-judge-fawn.vercel.app', 
  'https://online-judge-e18v7je9i-kotapati-lakshmi-vaishnavis-projects.vercel.app',
  'http://localhost:5173' 
];

app.use(cors({
  origin: (origin, callback) => {
   
    if (!origin) return callback(null, true);

    if (compilerAllowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for the compiler service does not allow access from the specified Origin: ${origin}.`;
      console.error(msg);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const COMPILER_SERVICE_PORT = process.env.COMPILER_SERVICE_PORT || 5001;
const tempDir = path.join(__dirname, 'temp');
const tempCodeDir = path.join(__dirname, 'temp_code');

if (!fs.existsSync(tempDir)){
    fs.mkdirSync(tempDir);
}
if (!fs.existsSync(tempCodeDir)){
    fs.mkdirSync(tempCodeDir);
}

app.post('/api/submit', compilerController.submitCode);
app.post('/api/run', compilerController.runCode);

app.post('/api/hint', async (req, res, next) => {
    try {
        const { prompt, userCode, language } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required for AI hint generation.' });
        }

        const hintResult = await geminiService.getAIResponse(prompt, userCode, language);

        res.status(200).json({ hint: hintResult });

    } catch (error) {
        console.error("Error in AI hint generation (compiler-ai-service):", error.message);
        console.error(error.stack);
        res.status(500).json({
            aiExplanation: "AI Service Error",
            error: "Failed to generate AI hint. Please try again later. Check compiler-ai-service logs."
        });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Something broke in the compiler/AI service!', error: err.message });
});

app.listen(COMPILER_SERVICE_PORT, () => {
    console.log(`Compiler/AI Service running on port ${COMPILER_SERVICE_PORT}`);
});