import React, { useState, useEffect } from 'react'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
            setPageLoading(false); 
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
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''), 
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
        return <div className="text-center mt-20 text-lg text-gray-700">Checking authorization...</div>;
    }

    if (error && error.includes('not authorized')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 w-full max-w-lg text-center text-red-600 font-bold">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 p-4">
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Problem Title</label>
                        <input
                            type="text"
                            id="title"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            id="description"
                            rows="6"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">Difficulty</label>
                        <select
                            id="difficulty"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                        <input
                            type="text"
                            id="tags"
                            placeholder="e.g., arrays, sorting, dynamic programming"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="sampleInput" className="block text-sm font-medium text-gray-700">Sample Input</label>
                        <textarea
                            id="sampleInput"
                            rows="3"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={sampleInput}
                            onChange={(e) => setSampleInput(e.target.value)}
                        ></textarea>
                    </div>

                    <div>
                        <label htmlFor="sampleOutput" className="block text-sm font-medium text-gray-700">Sample Output</label>
                        <textarea
                            id="sampleOutput"
                            rows="3"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={sampleOutput}
                            onChange={(e) => setSampleOutput(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Cases</h3>
                        {testCases.map((testCase, index) => (
                            <div key={index} className="flex flex-col space-y-2 mb-4 p-3 border border-gray-200 rounded-md bg-white">
                                <p className="text-sm font-medium text-gray-700">Test Case {index + 1}</p>
                                <div>
                                    <label htmlFor={`input-${index}`} className="block text-sm font-medium text-gray-600">Input</label>
                                    <textarea
                                        id={`input-${index}`}
                                        rows="2"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={testCase.input}
                                        onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                                <div>
                                    <label htmlFor={`expectedOutput-${index}`} className="block text-sm font-medium text-gray-600">Expected Output</label>
                                    <textarea
                                        id={`expectedOutput-${index}`}
                                        rows="2"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={testCase.expectedOutput}
                                        onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                                {testCases.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTestCase(index)}
                                        className="mt-2 self-end bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded-md shadow-sm"
                                    >
                                        Remove Test Case
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddTestCase}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300"
                        >
                            Add Another Test Case
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
                        disabled={loading}
                    >
                        {loading ? 'Adding Problem...' : 'Add Problem'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddProblemPage;