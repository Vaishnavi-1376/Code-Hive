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

async function getAIResponse(prompt) {
    if (!API_KEY || !model) {
        console.error("Attempted to call getAIResponse with missing API_KEY or uninitialized model.");
        throw new Error("AI service not configured. Please check API key setup and ensure you have an API key.");
    }
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error("Error calling Gemini API:", error.message);
        throw new Error("Failed to get AI response from Gemini API: " + error.message);
    }
}

module.exports = { getAIResponse };