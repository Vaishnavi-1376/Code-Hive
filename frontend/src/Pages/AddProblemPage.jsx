import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader'; 

const AddProblemPage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('Easy');
    const [tags, setTags] = useState('');
    const [sampleInput, setSampleInput] = useState('');
    const [sampleOutput, setSampleOutput] = useState('');
    const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '' }]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { token, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user || (user.userType && user.userType.toLowerCase() !== 'admin')) {
                setError('You are not authorized to add problems. Redirecting to dashboard...');
                setTimeout(() => navigate('/dashboard'), 2000);
            }
            setPageLoading(false); // <-- Only runs after !authLoading
        }
    }, [user, authLoading, navigate]);

    const handleAddTestCase = () => {
        setTestCases([...testCases, { input: '', expectedOutput: '' }]);
    };

    const handleRemoveTestCase = (index) => {
        const newTestCases = testCases.filter((_, i) => i !== index);
        setTestCases(newTestCases);
    };

    const handleTestCaseChange = (index, field, value) => {
        const newTestCases = [...testCases];
        newTestCases[index][field] = value;
        setTestCases(newTestCases);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        if (!token) {
            setError('You must be logged in to add a problem.');
            setLoading(false);
            return;
        }

        if (user && user.userType && user.userType.toLowerCase() !== 'admin') {
            setError('You are not authorized to add problems.');
            setLoading(false);
            return;
        }

        const hasEmptyTestCase = testCases.some(tc => !tc.input.trim() || !tc.expectedOutput.trim());
        if (hasEmptyTestCase) {
            setError('All test case input and expected output fields must be filled.');
            setLoading(false);
            return;
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            };

            const problemData = {
                title,
                description,
                difficulty,
                tags: (tags || '').split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
                sampleInput,
                sampleOutput,
                testCases,
            };

            const res = await axios.post('http://localhost:5000/api/problems', problemData, config);

            setMessage('Problem added successfully!');
            setTitle('');
            setDescription('');
            setDifficulty('Easy');
            setTags('');
            setSampleInput('');
            setSampleOutput('');
            setTestCases([{ input: '', expectedOutput: '' }]);
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);

        } catch (err) {
            console.error('Error adding problem:', err.response?.data || err);
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to add problem. Please check console for details.');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
                <Loader />
                <p className="text-lg text-gray-700 ml-4">Checking authorization...</p>
            </div>
        );
    }

    if (error && error.includes('not authorized')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 w-full max-w-lg text-center text-red-600 font-bold">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 w-full max-w-3xl">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Add New Problem</h2>

                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Problem Title</label>
                        <input
                            type="text"
                            id="title"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-400"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            id="description"
                            rows="6"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-400"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                        <select
                            id="difficulty"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-800"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                        <input
                            type="text"
                            id="tags"
                            placeholder="e.g., arrays, sorting, dynamic programming"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-400"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="sampleInput" className="block text-sm font-medium text-gray-700 mb-1">Sample Input</label>
                        <textarea
                            id="sampleInput"
                            rows="3"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-400"
                            value={sampleInput}
                            onChange={(e) => setSampleInput(e.target.value)}
                        ></textarea>
                    </div>

                    <div>
                        <label htmlFor="sampleOutput" className="block text-sm font-medium text-gray-700 mb-1">Sample Output</label>
                        <textarea
                            id="sampleOutput"
                            rows="3"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-400"
                            value={sampleOutput}
                            onChange={(e) => setSampleOutput(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Cases</h3>
                        {testCases.map((testCase, index) => (
                            <div key={index} className="flex flex-col space-y-3 mb-4 p-4 border border-purple-100 rounded-md bg-white shadow-sm">
                                <p className="text-sm font-medium text-gray-700">Test Case {index + 1}</p>
                                <div>
                                    <label htmlFor={`input-${index}`} className="block text-sm font-medium text-gray-600 mb-1">Input</label>
                                    <textarea
                                        id={`input-${index}`}
                                        rows="2"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-400"
                                        value={testCase.input}
                                        onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                                <div>
                                    <label htmlFor={`expectedOutput-${index}`} className="block text-sm font-medium text-gray-600 mb-1">Expected Output</label>
                                    <textarea
                                        id={`expectedOutput-${index}`}
                                        rows="2"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-400"
                                        value={testCase.expectedOutput}
                                        onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                                {testCases.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTestCase(index)}
                                        className="mt-2 self-end bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded-md shadow-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Remove Test Case
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddTestCase}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300 mt-4"
                        >
                            Add Another Test Case
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold py-2 px-4 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-300"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Adding Problem...
                            </div>
                        ) : (
                            'Add Problem'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddProblemPage;
