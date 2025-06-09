const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios'); 
const { DBConnection } = require('./database/db');
const userRoutes = require('./routes/userRoutes');
const problemRoutes = require('./routes/problemRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const { protect } = require('./middleware/authMiddleware');

dotenv.config();
const app = express();
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
  'https://online-judge-fawn.vercel.app', 
  'https://online-judge-e18v7je9i-kotapati-lakshmi-vaishnavis-projects.vercel.app', 
  'https://mycodehive.vercel.app/'
];


app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}.`;
      console.error(msg); 
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
const COMPILER_AI_SERVICE_URL = process.env.COMPILER_AI_SERVICE_URL || 'http://localhost:5001'; 


DBConnection();


app.get('/', (req, res) => {
  res.json({ message: "Welcome to the CodeTrialz Backend API! Please use specific API endpoints like /api/problems or /run." });
});


// API Routes
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.post('/api/submit', protect, async (req, res, next) => {
    try {
        const response = await axios.post(`${COMPILER_AI_SERVICE_URL}/api/submit`, {
            ...req.body, 
            userId: req.user._id
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error("Error forwarding /api/submit request to compiler-ai-service:", error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        next(new Error('Failed to connect to compiler-ai-service or unexpected error.'));
    }
});
app.post('/api/run', protect, async (req, res, next) => { 
    try {
        const { code, language, input } = req.body;
        const response = await axios.post(`${COMPILER_AI_SERVICE_URL}/api/run`, {
            code,
            language,
            input,
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error forwarding /api/run request to compiler-ai-service:', error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        next(new Error('Failed to connect to compiler-ai-service or unexpected error.'));
    }
});

app.post('/api/problems/:id/hint', protect, async (req, res, next) => {
    try {
        const { problemDescription, problemTitle, userCode, language } = req.body;
        const problemId = req.params.id; 
        const response = await axios.post(`${COMPILER_AI_SERVICE_URL}/api/hint`, {
            problemId, 
            problemDescription,
            problemTitle,
            userCode,
            language,
            userId: req.user._id 
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