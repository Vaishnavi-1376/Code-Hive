import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';

const ProblemDetailPage = () => {
    const { id } = useParams();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteMessage, setDeleteMessage] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [code, setCode] = useState('// Write your JavaScript code here\nconsole.log("Hello, World!");');
    const [output, setOutput] = useState('');
    const [compiling, setCompiling] = useState(false);
    const [compilerError, setCompilerError] = useState('');
    const { token, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const config = {};
                if (token) {
                    config.headers = { Authorization: `Bearer ${token}` };
                }
                const res = await axios.get(`http://localhost:5000/api/problems/${id}`, config);
                setProblem(res.data);
            } catch (err) {
                console.error(`Error fetching problem with ID ${id}:`, err.response?.data || err);
                setError(err.response?.data?.message || 'Failed to fetch problem details.');
            } finally {
                setLoading(false);
            }
        };

        fetchProblem();
    }, [id, token]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this problem? This action cannot be undone.')) {
            setDeleteMessage('');
            setDeleteError('');
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };
                await axios.delete(`http://localhost:5000/api/problems/${id}`, config);
                setDeleteMessage('Problem deleted successfully!');
                setTimeout(() => {
                    navigate('/problems');
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

        if (!token) {
            setCompilerError('You must be logged in to run code.');
            setCompiling(false);
            return;
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            };

            const res = await axios.post('http://localhost:5000/api/compile', {
                code,
                language: 'javascript',
            }, config);

            setOutput(res.data.output);
        } catch (err) {
            console.error('Error running code:', err.response?.data || err);
            setCompilerError(err.response?.data?.error || err.response?.data?.message || 'Failed to run code. Please check your code for syntax errors.');
        } finally {
            setCompiling(false);
        }
    };

    const canEditOrDelete = user && (user.role === 'admin' || (problem && problem.createdBy === user._id));

    if (loading) {
        return <div className="text-center mt-20 text-lg text-gray-700">Loading problem details...</div>;
    }

    if (error) {
        return (
            <div className="text-center mt-20 text-lg text-red-600">
                Error: {error}
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
            <div className="bg-white shadow-xl rounded-xl p-8 md:p-10">
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
                    <span className={`px-4 py-2 rounded-full text-lg font-semibold ${problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
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

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Code Editor</h2>
                    <div className="bg-gray-800 rounded-md overflow-hidden font-mono text-sm">
                        <Editor
                            value={code}
                            onValueChange={setCode}
                            highlight={code => highlight(code, languages.js)}
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
                    <button
                        onClick={handleRunCode}
                        disabled={compiling || !token}
                        className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {compiling ? 'Running Code...' : 'Run Code'}
                    </button>

                    {compilerError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
                            Error: {compilerError}
                        </div>
                    )}

                    <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-4">Output</h2>
                    <pre className="bg-gray-100 p-4 rounded-md text-sm font-mono text-gray-800 overflow-auto min-h-[100px]">
                        {output || 'Your code output will appear here.'}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default ProblemDetailPage;