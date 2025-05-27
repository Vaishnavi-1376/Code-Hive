import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getDifficultyBadge = (difficulty) => {
    let bgColor, textColor;
    switch (difficulty) {
        case 'Easy':
            bgColor = 'bg-emerald-50';
            textColor = 'text-emerald-700';
            break;
        case 'Medium':
            bgColor = 'bg-amber-50';
            textColor = 'text-amber-700';
            break;
        case 'Hard':
            bgColor = 'bg-rose-50';
            textColor = 'text-rose-700';
            break;
        default:
            bgColor = 'bg-gray-100';
            textColor = 'text-gray-600';
    }
    return (
        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-inner ${bgColor} ${textColor}`}>
            {difficulty}
        </span>
    );
};

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
                setProblemsError('Failed to fetch problems. Please try again later.');
                setProblemsLoading(false);
            }
        };

        fetchProblems();
    }, []);

    const isAdmin = user && typeof user.userType === 'string' && user.userType.toLowerCase() === 'admin';

    if (authLoading || problemsLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 text-xl font-medium text-purple-600">
                <svg className="animate-spin h-8 w-8 mr-3 text-purple-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Unfurling challenges...
            </div>
        );
    }

    if (problemsError) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 text-red-600 text-xl font-bold">
                {problemsError}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden">
            <div className="absolute top-1/4 left-[10%] w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-slow-blob"></div>
            <div className="absolute top-[60%] right-[15%] w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-slow-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-[35%] w-56 h-56 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-slow-blob animation-delay-4000"></div>
            <div className="relative z-10 max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <header className="text-center mb-24">
                    <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-5 leading-tight tracking-tighter drop-shadow-sm animate-fade-in-down">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700">
                            ELEVATE YOUR SKILLS
                        </span>
                    </h1>
                    <p className="text-xl sm:text-2xl text-gray-700 font-medium mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-slow">
                        Hone your logic. Elevate your code.
                    </p>
                    {isAdmin && (
                        <div className="animate-pop-in">
                            <Link
                                to="/add-problem"
                                className="inline-flex items-center px-10 py-4 border border-transparent text-lg font-bold rounded-full shadow-lg text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-indigo-50 focus:ring-opacity-75"
                            >
                                <svg className="-ml-2 mr-3 h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Create New Challenge
                            </Link>
                        </div>
                    )}
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {problems.length > 0 ? (
                        problems.map((problem, index) => (
                            <div
                                key={problem._id}
                                className="bg-white rounded-2xl border border-purple-100 p-7 flex flex-col justify-between shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl hover:border-purple-300 group relative overflow-hidden animate-fade-in-up"
                                style={{ animationDelay: `${0.1 * index}s` }}
                            >
                                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: 'inset 0 0 20px rgba(168, 85, 247, 0.2)' }}></div>

                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                <Link to={`/problems/${problem._id}`} className="block relative z-10">
                                    <h2 className="text-xl font-bold text-gray-800 group-hover:text-purple-700 transition-colors duration-200 mb-3 leading-snug">
                                        {problem.title}
                                    </h2>
                                </Link>
                                <p className="text-gray-600 text-sm mb-5 flex-grow line-clamp-3 relative z-10">
                                    {problem.description}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-5 relative z-10">
                                    {problem.tags.map((tag, tagIndex) => (
                                        <span
                                            key={tagIndex}
                                            className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center relative z-10">
                                    {getDifficultyBadge(problem.difficulty)}

                                    <Link
                                        to={`/problems/${problem._id}`}
                                        className="text-purple-600 hover:text-purple-800 text-base font-semibold flex items-center transition duration-200 group-hover:translate-x-1"
                                    >
                                        Solve Challenge
                                        <svg className="ml-1 h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 text-xl py-10">
                            No challenges currently available.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;