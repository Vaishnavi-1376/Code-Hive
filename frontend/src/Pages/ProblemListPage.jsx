import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProblemsListPage = () => {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const config = {};
                const res = await axios.get('http://localhost:5000/api/problems', config);
                setProblems(res.data);
            } catch (err) {
                console.error('Error fetching problems:', err.response?.data || err);
                setError(err.response?.data?.message || 'Failed to fetch problems.');
            } finally {
                setLoading(false);
            }
        };

        fetchProblems();
    }, []);

    if (loading) {
        return <div className="text-center mt-20 text-lg text-gray-700">Loading problems...</div>;
    }

    if (error) {
        return (
            <div className="text-center mt-20 text-lg text-red-600">
                Error: {error}
            </div>
        );
    }

    if (problems.length === 0) {
        return (
            <div className="text-center mt-20 text-lg text-gray-600">
                No problems found. Start by adding new problems!
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Problem Set</h1>

            <div className="bg-white shadow-xl rounded-xl overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {problems.map((problem) => (
                        <li key={problem._id} className="p-4 md:p-6 hover:bg-gray-50 transition duration-150 ease-in-out flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div className="flex-1 mb-2 sm:mb-0">
                                <Link to={`/problems/${problem._id}`} className="text-xl font-semibold text-blue-700 hover:text-blue-900">
                                    {problem.title}
                                </Link>
                                <div className="text-gray-500 text-sm mt-1">
                                    Difficulty: <span className={`font-medium ${problem.difficulty === 'Easy' ? 'text-green-600' :
                                            problem.difficulty === 'Medium' ? 'text-yellow-600' :
                                                'text-red-600'
                                        }`}>
                                        {problem.difficulty}
                                    </span>
                                    {problem.tags && problem.tags.length > 0 && (
                                        <span className="ml-4">
                                            Tags: {problem.tags.map(tag => (
                                                <span key={tag} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 mr-2 mb-1">
                                                    {tag}
                                                </span>
                                            ))}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-sm text-gray-500">
                                Created: {new Date(problem.createdAt).toLocaleDateString()}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ProblemsListPage;