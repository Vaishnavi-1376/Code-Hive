const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios'); // NEW: Added axios for making HTTP requests

const { DBConnection } = require('./database/db');
const userRoutes = require('./routes/userRoutes');
const problemRoutes = require('./routes/problemRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

// const compilerRoutes = require('./routes/compilerRoutes'); // COMMENTED OUT: Compiler routes are now handled by a separate service
// const compilerController = require('./controllers/compilerController'); // COMMENTED OUT: Compiler controller logic is now in a separate service

const { protect } = require('./middleware/authMiddleware');

dotenv.config();
const app = express();

// --- MODIFIED START ---
// Dynamically set CORS origin from an environment variable.
// This allows you to configure allowed frontend URLs without changing code.
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
  'https://online-judge-fawn.vercel.app', // Your primary production frontend URL
  'https://online-judge-e18v7je9i-kotapati-lakshmi-vaishnavis-projects.vercel.app', // Your specific preview URL
  // Add 'http://localhost:3000' or similar if you test your frontend locally
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests, or same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}.`;
      console.error(msg); // Log the blocked origin for debugging
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
// --- MODIFIED END ---

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;

// NEW: Define the URL for your new compiler-ai-service
// --- MODIFIED START ---
const COMPILER_AI_SERVICE_URL = process.env.COMPILER_AI_SERVICE_URL || 'http://localhost:5001'; // Ensure this ENV variable is set on AWS!
// --- MODIFIED END ---

DBConnection();

// === NEW: Route for the root path ===
app.get('/', (req, res) => {
  res.json({ message: "Welcome to the CodeTrialz Backend API! Please use specific API endpoints like /api/problems or /run." });
});
// =====================================

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);

// app.use('/api/compile', compilerRoutes); // COMMENTED OUT: This route is now handled by the compiler-ai-service directly

// MODIFIED: The /api/submit route will now forward the request to the compiler-ai-service
app.post('/api/submit', protect, async (req, res, next) => {
    try {
        // Forward the request body (code, language, problemId, etc.) to the compiler-ai-service
        // Include problem details and submissionId so compiler-ai-service has context
        // and can return a full result for main-backend to save.
        const response = await axios.post(`${COMPILER_AI_SERVICE_URL}/api/submit`, {
            ...req.body, // Pass all body parameters from the original request
            userId: req.user._id // Pass the authenticated user ID
            // problemTitle and problemDescription can also be passed from main-backend if needed by AI
            // for now, compilerController handles fetching problem details from problemId
        });

        // Send the response from the compiler-ai-service back to the client
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error("Error forwarding /api/submit request to compiler-ai-service:", error.message);
        if (error.response) {
            // If the compiler-ai-service sent an error response, forward that status and data
            return res.status(error.response.status).json(error.response.data);
        }
        // If it's a network error or something else, send a generic 500 error
        next(new Error('Failed to connect to compiler-ai-service or unexpected error.'));
    }
});

// NEW: Proxy for /api/run to the compiler-ai-service
app.post('/api/run', protect, async (req, res, next) => { // Added `protect` middleware
    try {
        const { code, language, input } = req.body;
        // Forward the request body (code, language, input) to the compiler-ai-service
        const response = await axios.post(`${COMPILER_AI_SERVICE_URL}/api/run`, {
            code,
            language,
            input,
            // userId: req.user?._id // Optionally pass userId if compiler-ai-service needs it for temp folder naming
        });
        // Send the response from the compiler-ai-service back to the client
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error forwarding /api/run request to compiler-ai-service:', error.message);
        if (error.response) {
            // If the compiler-ai-service sent an error response, forward that status and data
            return res.status(error.response.status).json(error.response.data);
        }
        // If it's a network error or something else, send a generic 500 error
        next(new Error('Failed to connect to compiler-ai-service or unexpected error.'));
    }
});

// NEW: Proxy for /api/problems/:id/hint to the compiler-ai-service
app.post('/api/problems/:id/hint', protect, async (req, res, next) => {
    try {
        const { problemDescription, problemTitle, userCode, language } = req.body;
        const problemId = req.params.id; // Get problem ID from URL parameters

        const response = await axios.post(`${COMPILER_AI_SERVICE_URL}/api/hint`, {
            problemId, // Pass problemId if the AI service needs to fetch problem details itself
            problemDescription,
            problemTitle,
            userCode,
            language,
            userId: req.user._id // Pass user ID for context/logging in AI service
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error forwarding /api/problems/:id/hint request to compiler-ai-service:', error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        next(new Error('Failed to connect to compiler-ai-service for hint or unexpected error.'));
    }
});


app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});