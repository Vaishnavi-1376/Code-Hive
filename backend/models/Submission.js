const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    problem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    },
    code: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    verdict: {
        type: String,
        enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Submission Failed', 'Pending'],
        default: 'Pending'
    },
    output: { 
        type: String,
        default: ''
    },
    compilerOutput: { 
        type: String,
        default: ''
    },
    testResults: [
        {
            testCase: { 
                type: Number, 
            },
            passed: {
                type: Boolean,
                required: true
            },
            message: {
                type: String 
            },
            input: {
                type: String
            },
            expectedOutput: {
                type: String
            },
            userOutput: {
                type: String
            },
            aiExplanation: { 
                type: String
            }
        }
    ],
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Submission', SubmissionSchema);