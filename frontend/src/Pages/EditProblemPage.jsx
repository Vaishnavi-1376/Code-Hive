import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EditProblemPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user, loading: authLoading } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('Easy');
    const [tags, setTags] = useState('');
    const [sampleInput, setSampleInput] = useState('');
    const [sampleOutput, setSampleOutput] = useState('');
    const [testCases, setTestCases] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [problemLoading, setProblemLoading] = useState(true); 
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        
        if (authLoading) return;
        if (!user || (user.userType && user.userType.toLowerCase() !== 'admin')) {
            setError('You are not authorized to edit problems. Redirecting to dashboard...');
            setTimeout(() => navigate('/dashboard'), 2000); 
            setProblemLoading(false); 
            return;
        }

        if (token) {
            const fetchProblem = async () => {
                try {
                    const config = {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    };
                    const res = await axios.get(`http://localhost:5000/api/problems/${id}`, config);
                    const problemData = res.data;

                    setTitle(problemData.title);
                    setDescription(problemData.description);
                    setDifficulty(problemData.difficulty);

                    if (problemData.tags) {
                        if (Array.isArray(problemData.tags)) {
                            setTags(problemData.tags.join(', '));
                        } else if (typeof problemData.tags === 'string') {
                            setTags(problemData.tags);
                        } else {
                            setTags('');
                        }
                    } else {
                        setTags('');
                    }
                    setSampleInput(problemData.sampleInput || '');
                    setSampleOutput(problemData.sampleOutput || '');
                    setTestCases(Array.isArray(problemData.testCases) && problemData.testCases.length > 0
                        ? problemData.testCases
                        : [{ input: '', expectedOutput: '' }]);

                } catch (err) {
                    console.error('Error fetching problem for edit:', err.response?.data || err);
                    if (err.response?.status === 403) {
                        setError('You do not have permission to edit this problem.');
                        setTimeout(() => navigate('/dashboard'), 2000);
                    } else {
                        setError(err.response?.data?.message || 'Failed to load problem for editing.');
                    }
                } finally {
                    setProblemLoading(false);
                }
            };
            fetchProblem();
        }
    }, [id, token, user, authLoading, navigate]); 

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
        setSubmitting(true);

        if (!user || (user.userType && user.userType.toLowerCase() !== 'admin')) {
            setError('You are not authorized to edit problems. Please log in as an admin.');
            setSubmitting(false);
            return;
        }

        const hasEmptyTestCase = testCases.some(tc => !tc.input.trim() || !tc.expectedOutput.trim());
        if (hasEmptyTestCase) {
            setError('All test case input and expected output fields must be filled.');
            setSubmitting(false);
            return;
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            };

            const updatedProblemData = {
                title,
                description,
                difficulty,
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''), 
                sampleInput,
                sampleOutput,
                testCases,
            };

            await axios.put(`http://localhost:5000/api/problems/${id}`, updatedProblemData, config);

            setMessage('Problem updated successfully!');
            setTimeout(() => {
                navigate(`/problems/${id}`);
            }, 1500);

        } catch (err) {
            console.error('Error updating problem:', err.response?.data || err);
            if (err.response?.status === 403) {
                setError('Failed to update problem: You do not have administrator permissions.');
            } else {
                setError(err.response?.data?.message || 'Failed to update problem. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (problemLoading || authLoading) {
        return <div className="text-center mt-20 text-lg text-gray-700">Loading problem for editing...</div>;
    }

    if (!user || (user.userType && user.userType.toLowerCase() !== 'admin')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 w-full max-w-lg text-center text-red-600 font-bold">
                    {error || "Access Denied: You are not authorized to view this page."}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 w-full max-w-3xl">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Edit Problem</h2>

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
                        disabled={submitting}
                    >
                        {submitting ? 'Updating Problem...' : 'Update Problem'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProblemPage;