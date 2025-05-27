import React, { useEffect, useState } from 'react'; 
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const DashboardPage = () => {
    const [problems, setProblems] = useState([]);
    const [problemsLoading, setProblemsLoading] = useState(true); 
    const [problemsError, setProblemsError] = useState(null); 

    const { user, loading: authLoading } = useAuth(); 

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/problems');
                setProblems(res.data);
                setProblemsLoading(false);
            } catch (err) {
                console.error('Error fetching problems:', err);
                setProblemsError('Failed to fetch problems.');
                setProblemsLoading(false);
            }
        };

        fetchProblems();
    }, []); 

    const isAdmin = user && user.userType && user.userType.toLowerCase() === 'admin';

    if (authLoading || problemsLoading) {
        return <div className="text-center mt-20 text-lg text-gray-700">Loading dashboard...</div>;
    }

    if (problemsError) {
        return <div className="text-center mt-20 text-red-500 text-lg">{problemsError}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold text-center text-gray-800 mb-8"></h1>
            {isAdmin && (
                <div className="text-center mb-8">
                    <Link
                        to="/add-problem"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                    >
                        Add New Problem
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {problems.length > 0 ? (
                    problems.map((problem) => (
                        <div
                            key={problem._id}
                            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-200"
                        >
                            <Link to={`/problems/${problem._id}`}>
                                <h2 className="text-2xl font-semibold text-blue-700 hover:text-blue-900 mb-2">
                                    {problem.title}
                                </h2>
                            </Link>
                            <p className="text-gray-600 mb-3">{problem.description.substring(0, 100)}...</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {problem.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <span
                                className={`inline-block text-sm font-bold px-3 py-1 rounded-full ${
                                    problem.difficulty === 'Easy'
                                        ? 'bg-green-200 text-green-800'
                                        : problem.difficulty === 'Medium'
                                        ? 'bg-yellow-200 text-yellow-800'
                                        : 'bg-red-200 text-red-800'
                                }`}
                            >
                                {problem.difficulty}
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500 text-xl">No problems available yet.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;