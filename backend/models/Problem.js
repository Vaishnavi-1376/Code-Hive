const mongoose = require('mongoose');
const ProblemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Problem title is required'],
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Problem description is required'],
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Easy',
    },
    tags: [
        {
            type: String,
            trim: true,
        }
    ],
    sampleInput: {
        type: String,
        default: '',
    },
    sampleOutput: {
        type: String,
        default: '',
    },
    testCases: [
        {
            input: {
                type: String,
                required: true,
            },
            expectedOutput: {
                type: String,
                required: true,
            },
        },
    ],

    timeLimit: { 
        type: Number,
        default: 2000, 
        min: 100, 
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

ProblemSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Problem', ProblemSchema);