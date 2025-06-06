const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); 

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables. AI features will likely fail.');
}

let genAI;
let model;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
} else {
    console.warn("GoogleGenerativeAI and model not initialized due to missing API_KEY.");
}

// MODIFIED: Accept userCode and language
async function getAIResponse(prompt, userCode, language) { 
    if (!API_KEY || !model) {
        console.error("Attempted to call getAIResponse with missing API_KEY or uninitialized model.");
        throw new Error("AI service not configured. Please check API key setup and ensure you have an API key.");
    }
    
    try {
        // CONSTRUCT A MORE DETAILED PROMPT FOR GEMINI
        const fullPrompt = `
You are an AI assistant for a coding judge platform. Provide a helpful hint for the user's code.
Focus on common issues, logic errors, or optimization. Do NOT provide the full solution.
The user's request: "${prompt}"
The programming language: "${language}"
The user's code:
\`\`\`${language}
${userCode}
\`\`\`

Provide only the hint, directly.
        `;

        // OPTIONAL: Log the full prompt you're sending to Gemini for debugging
        console.log("Sending prompt to Gemini:", fullPrompt); 

        const result = await model.generateContent(fullPrompt); // Use the fullPrompt
        const response = await result.response;
        const text = response.text();

        // OPTIONAL: Log the successful response from Gemini
        console.log("Received AI hint from Gemini:", text); 
        
        return text;
    } catch (error) {
        console.error("Error calling Gemini API:", error.message);
        console.error("Gemini API Error Stack:", error.stack); // Log full stack for debugging
        throw new Error("Failed to get AI response from Gemini API: " + error.message);
    }
}

module.exports = { getAIResponse };