// frontend/src/pages/ProblemDetailPage.jsx

import React, { useEffect, useState } from 'react';
import API from '../utils/api'; // This is the API utility that likely adds '/api/'
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import { getAIResponse } from '../utils/ai'; // <--- RESTORED THIS LINE!   

const ProblemDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [problem, setProblem] = useState(null);
    const [problemLoading, setProblemLoading] = useState(true);
    const [problemError, setProblemError] = useState('');
    const [deleteMessage, setDeleteMessage] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [code, setCode] = useState('');
    const [output, setOutput] = useState('');
    const [compiling, setCompiling] = useState(false);
    const [compilerError, setCompilerError] = useState('');
    const [userInput, setUserInput] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [submissionResults, setSubmissionResults] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState('');
    const [overallVerdict, setOverallVerdict] = useState('');
    const { token, user, loading: authLoading } = useAuth();
    const [aiRunCodeExplanation, setAiRunCodeExplanation] = useState('');
    const [aiHint, setAiHint] = useState('');
    const [hintLoading, setHintLoading] = useState(false);

    const initialCodeSnippets = {
        javascript: '// Write your JavaScript code here\nconsole.log("Hello, World!");',
        python: '# Write your Python code here\nprint("Hello, World!")',
        java: '// Write your Java code here\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
        cpp: '// Write your C++ code here\n#include <iostream>\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
        c: '// Write your C code here\n#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
    };

    const getPrismLanguage = (lang) => {
        switch (lang) {
            case 'javascript':
                return languages.js;
            case 'python':
                return languages.python;
            case 'java':
                return languages.java;
            case 'cpp':
                return languages.cpp;
            case 'c':
                return languages.c;
            default:
                return languages.clike;
        }
    };

    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        setLanguage(newLanguage);
        setCode(initialCodeSnippets[newLanguage] || '');
        setOutput('');
        setCompilerError('');
        setSubmissionResults(null);
        setSubmissionError('');
        setOverallVerdict('');
        setAiRunCodeExplanation('');
        setAiHint('');
    };

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const res = await API.get(`/problems/${id}`);
                setProblem(res.data);
                setCode(initialCodeSnippets[language]);
            } catch (err) {
                console.error(`Error fetching problem with ID ${id}:`, err.response?.data || err);
                setProblemError(err.response?.data?.message || 'Failed to fetch problem details.');
            } finally {
                setProblemLoading(false);
            }
        };

        fetchProblem();
    }, [id, language]);

    const handleDelete = async () => {
        if (!user || (user.userType && user.userType.toLowerCase() !== 'admin')) {
            setDeleteError('You are not authorized to delete problems.');
            return;
        }

        if (window.confirm('Are you sure you want to delete this problem? This action cannot be undone.')) {
            setDeleteMessage('');
            setDeleteError('');
            try {
                await API.delete(`/problems/${id}`);
                setDeleteMessage('Problem deleted successfully!');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            } catch (err) {
                console.error('Error deleting problem:', err.response?.data || err);
                setDeleteError(err.response?.data?.message || 'Failed to delete problem. You might not have permission.');
            }
        }
    };

    const handleRunCode = async () => {
        setCompiling(true);
        setOutput('');
        setCompilerError('');
        setSubmissionResults(null); // Clear previous submission results for 'Run Code'
        setSubmissionError('');
        setOverallVerdict('');
        setAiRunCodeExplanation('');

        if (!token) {
            setCompilerError('You must be logged in to run code.');
            setCompiling(false);
            return;
        }

        try {
            // This API call goes to your compiler-ai-service, likely proxied through main-backend
            // Ensure your main-backend's proxy or direct call points to the compiler-ai-service
            const res = await API.post('/run', { // This endpoint is likely in your main-backend that forwards to compiler-ai-service
                code,
                language,
                input: userInput,
            });

            setOutput(res.data.output);
            setAiRunCodeExplanation(res.data.aiExplanation || '');
        } catch (err) {
            console.error('Error running code:', err.response?.data || err);
            setCompilerError(err.response?.data?.error || err.response?.data?.message || 'Failed to run code. Please check your code for syntax errors or unexpected output.');
            setAiRunCodeExplanation(err.response?.data.aiExplanation || '');
        } finally {
            setCompiling(false);
        }
    };

    const handleSubmitCode = async () => {
        setSubmitting(true);
        setSubmissionResults(null);
        setSubmissionError('');
        setOutput(''); // Clear run code output as we are submitting
        setCompilerError(''); // Clear run code errors
        setOverallVerdict('');
        setAiRunCodeExplanation('');

        if (!token) {
            setSubmissionError('You must be logged in to submit code.');
            setSubmitting(false);
            return;
        }
        if (!problem || !problem._id) {
            setSubmissionError('Problem ID not found. Cannot submit code.');
            setSubmitting(false);
            return;
        }
        // User ID is handled by the backend's protect middleware (req.user._id)
        // No need to send user.id from frontend

        try {
            // STEP 1: Send code to the compiler-ai-service for evaluation against test cases
            // Assuming your compiler-ai-service has an endpoint like '/submit-tests'
            // or '/evaluate' that takes code, language, and test cases.
            // THIS IS A CRITICAL ASSUMPTION. Verify your compiler-ai-service's endpoint.
            const evaluationRes = await API.post('/submit', { // This endpoint is likely in your main-backend that forwards to compiler-ai-service
                code,
                language,
                problemId: problem._id, // Send problem ID for compiler service to get test cases
                testCases: problem.testCases, // <-- Ensure problem.testCases is available here
                problemTitle: problem.title,
                problemDescription: problem.description,
                timeLimit: problem.timeLimit // Pass if your problem model includes it
            });

            const { verdict, testResults, output: compilerOutput, compilerOutput: actualCompilerOutput, aiExplanation } = evaluationRes.data;

            setSubmissionResults(testResults);
            setOverallVerdict(verdict || 'Unknown Verdict');
            setAiRunCodeExplanation(aiExplanation || ''); // Display AI explanation if provided by compiler service

            // STEP 2: Record the submission in your main-backend database
            // This API call goes to your main-backend's new route: /api/problems/:id/submit
            try {
                await API.post(`/problems/${problem._id}/submit`, {
                    code,
                    language,
                    verdict, // Use the verdict obtained from the compiler-ai-service
                    output: compilerOutput, // Standard output from running code
                    compilerOutput: actualCompilerOutput, // Errors/warnings from compilation itself
                    testResults, // Detailed test case results
                    // You might also want to send runtime and memory usage if your compiler-ai-service provides them
                    // runtime: evaluationRes.data.runtime,
                    // memory: evaluationRes.data.memory,
                });
                console.log('Submission successfully recorded in main-backend!');
            } catch (recordErr) {
                console.error('Error recording submission in main-backend:', recordErr.response?.data || recordErr);
                setSubmissionError(prev => prev + '\nFailed to record submission in database.');
                // You might still show the compiler results even if database save fails
            }

        } catch (err) {
            console.error('Error during code evaluation/submission:', err.response?.data || err);
            const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to submit code. Please check your code or try again.';
            setSubmissionError(errorMessage);
            setOverallVerdict(err.response?.data?.verdict || 'Submission Failed'); // Display compiler verdict on error too
            if (err.response?.data.aiExplanation) {
                setAiRunCodeExplanation(err.response?.data.aiExplanation);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleGetHint = async () => {
        setAiHint('');
        setHintLoading(true);

        if (!token) {
            setAiHint('You must be logged in to get hints.');
            setHintLoading(false);
            return;
        }

        try {
            // This API call goes to your main-backend, which then forwards to your compiler-ai-service
            const res = await API.post(`/problems/${id}/hint`, {
                problemDescription: problem.description,
                problemTitle: problem.title,
                userCode: code
            });
            // The main-backend's /hint endpoint should return { hint: "..." } or similar
            // based on how your compiler-ai-service's /hint endpoint is structured.
            // Adjust `res.data.hint` if the structure is different (e.g., res.data.aiExplanation).
            setAiHint(res.data.hint || res.data.aiExplanation || 'No hint available.');
        } catch (err) {
            console.error('Error getting AI hint:', err.response?.data || err.message);
            setAiHint(err.response?.data?.error || err.response?.data?.message || 'Sorry, I could not generate a hint at this time. Please try again later.');
        } finally {
            setHintLoading(false);
        }
    };

    const canEditOrDelete = !authLoading && user && user.userType && user.userType.toLowerCase() === 'admin';

    if (authLoading || problemLoading) {
        return <div className="text-center mt-20 text-lg text-gray-700">Loading problem details...</div>;
    }

    if (problemError) {
        return (
            <div className="text-center mt-20 text-lg text-red-600">
                Error: {problemError}
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="text-center mt-20 text-lg text-gray-600">
                Problem not found.
            </div>
        );
    }

    let displayTags = [];
    if (problem.tags) {
        if (Array.isArray(problem.tags)) {
            displayTags = problem.tags;
        } else if (typeof problem.tags === 'string') {
            displayTags = problem.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        }
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:flex-1 bg-white shadow-xl rounded-xl p-8 md:p-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{problem.title}</h1>

                    {deleteMessage && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                            {deleteMessage}
                        </div>
                    )}
                    {deleteError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                            {deleteError}
                        </div>
                    )}

                    <div className="flex items-center space-x-4 mb-6">
                        <span className={`px-4 py-2 rounded-full text-lg font-semibold ${
                            problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                            problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                            {problem.difficulty}
                        </span>
                        {displayTags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {displayTags.map((tag, index) => (
                                    <span key={tag + index} className="inline-block bg-blue-100 rounded-full px-3 py-1 text-sm font-semibold text-blue-800">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {canEditOrDelete && (
                        <div className="flex space-x-4 mb-6">
                            <Link
                                to={`/edit-problem/${problem._id}`}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                            >
                                Edit Problem
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                            >
                                Delete Problem
                            </button>
                        </div>
                    )}

                    <h2 className="text-2xl font-bold text-gray-800 mb-3 border-b pb-2">Description</h2>
                    <div className="prose max-w-none text-gray-700 mb-8" dangerouslySetInnerHTML={{ __html: problem.description.replace(/\n/g, '<br />') }}>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-3 border-b pb-2">Sample Input</h2>
                    <pre className="bg-gray-100 p-4 rounded-md text-sm font-mono text-gray-800 overflow-auto mb-8">
                        {problem.sampleInput || 'No sample input provided.'}
                    </pre>

                    <h2 className="text-2xl font-bold text-gray-800 mb-3 border-b pb-2">Sample Output</h2>
                    <pre className="bg-gray-100 p-4 rounded-md text-sm font-mono text-gray-800 overflow-auto mb-8">
                        {problem.sampleOutput || 'No sample output provided.'}
                    </pre>

                    <button
                        onClick={handleGetHint}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!user || hintLoading || authLoading}
                    >
                        {hintLoading ? 'Getting Hint...' : 'Get AI Hint'}
                    </button>

                    {aiHint && (
                        <div className="bg-gray-800 p-4 rounded-lg mt-4 text-white">
                            <h3 className="text-xl font-semibold mb-2">AI Problem Hint</h3>
                            <pre className="whitespace-pre-wrap font-sans text-sm">{aiHint}</pre>
                        </div>
                    )}

                </div>

                <div className="lg:flex-1 bg-white shadow-xl rounded-xl p-8 md:p-10">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Code Editor</h2>

                    <div className="mb-4">
                        <label htmlFor="language-select" className="block text-gray-700 text-sm font-bold mb-2">
                            Select Language:
                        </label>
                        <select
                            id="language-select"
                            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={language}
                            onChange={handleLanguageChange}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="c">C</option>
                        </select>
                    </div>

                    <div className="bg-gray-800 rounded-md overflow-hidden font-mono text-sm">
                        <Editor
                            value={code}
                            onValueChange={setCode}
                            highlight={code => highlight(code, getPrismLanguage(language), language)}
                            padding={10}
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 14,
                                backgroundColor: '#2d2d2d',
                                color: '#f8f8f2',
                                minHeight: '200px',
                            }}
                        />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-4">Input for 'Run Code'</h2>
                    <textarea
                        className="w-full p-4 bg-gray-900 text-gray-50 font-mono text-sm rounded-md border border-gray-700 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Enter input for your code here ..."
                    ></textarea>

                    <div className="flex space-x-4 mt-4">
                        <button
                            onClick={handleRunCode}
                            disabled={compiling || !token || authLoading}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {compiling ? 'Running Code...' : 'Run Code'}
                        </button>
                        <button
                            onClick={handleSubmitCode}
                            disabled={submitting || !token || authLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit Code'}
                        </button>
                    </div>

                    {compilerError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 whitespace-pre-wrap">
                            Error: {compilerError}
                        </div>
                    )}

                    {aiRunCodeExplanation && (
                        <div className="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-3 rounded relative mt-4">
                            <h4 className="font-bold text-lg mb-1">AI Assistant's Insight:</h4>
                            <pre className="whitespace-pre-wrap font-sans text-sm text-blue-800">{aiRunCodeExplanation}</pre>
                        </div>
                    )}

                    {submissionError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 whitespace-pre-wrap">
                            Submission Error: {submissionError}
                        </div>
                    )}

                    <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-4">Output (from 'Run Code')</h2>
                    <pre className="bg-gray-100 p-4 rounded-md text-sm font-mono text-gray-800 overflow-auto min-h-[100px] whitespace-pre-wrap">
                        {output || 'Your code output will appear here after clicking "Run Code".'}
                    </pre>

                    {submissionResults && (
                        <div className="mt-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                Submission Results
                                {overallVerdict && (
                                    <span className={`ml-4 px-3 py-1 rounded-full text-lg font-semibold ${
                                        overallVerdict === 'Accepted' ? 'bg-green-200 text-green-900' :
                                        (overallVerdict === 'Wrong Answer' || overallVerdict === 'Time Limit Exceeded' || overallVerdict === 'Runtime Error' || overallVerdict === 'Compilation Error' || overallVerdict === 'Submission Failed') ? 'bg-red-200 text-red-900' :
                                        'bg-gray-200 text-gray-900'
                                    }`}>
                                        {overallVerdict}
                                    </span>
                                )}
                            </h2>
                            {submissionResults.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {submissionResults.map((result, index) => (
                                        <div
                                            key={index}
                                            className={`p-4 rounded-md shadow-md ${
                                                result.passed ? 'bg-green-100 border border-green-400 text-green-800' : 'bg-red-100 border border-red-400 text-red-800'
                                            }`}
                                        >
                                            <h3 className="font-bold text-lg mb-2">Test Case {index + 1}</h3>
                                            <p>Status: <span className="font-semibold">{result.message.split('\n')[0]}</span></p>
                                            {!result.passed && (
                                                <>
                                                    <p className="text-sm mt-1">Expected: <pre className="inline whitespace-pre-wrap">{result.expectedOutput}</pre></p>
                                                    <p className="text-sm">Your Output: <pre className="inline whitespace-pre-wrap">{result.userOutput}</pre></p>
                                                    {result.message.includes('\n') && (
                                                        <p className="text-sm mt-2">Details: <pre className="whitespace-pre-wrap">{result.message}</pre></p>
                                                    )}
                                                    {result.aiExplanation && (
                                                        <div className="bg-blue-100 border border-blue-400 text-blue-800 px-3 py-2 rounded-md mt-2">
                                                            <h5 className="font-bold text-md mb-1">AI Debugging Assistant:</h5>
                                                            <pre className="whitespace-pre-wrap font-sans text-sm text-blue-800">{result.aiExplanation}</pre>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600">No test cases found for this problem or an issue occurred during submission setup.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProblemDetailPage;