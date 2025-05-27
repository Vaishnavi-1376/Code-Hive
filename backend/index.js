const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { DBConnection } = require('./database/db');
const userRoutes = require('./routes/userRoutes');
const problemRoutes = require('./routes/problemRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const compilerRoutes = require('./routes/compilerRoutes');
const compilerController = require('./controllers/compilerController');
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

DBConnection();

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/compile', compilerRoutes);
app.post('/api/submit', protect, compilerController.submitCode); 
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});