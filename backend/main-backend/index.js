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

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;

// NEW: Define the URL for your new compiler-ai-service
const COMPILER_AI_SERVICE_URL = process.env.COMPILER_AI_SERVICE_URL || 'http://localhost:5001';

DBConnection();

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


app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});