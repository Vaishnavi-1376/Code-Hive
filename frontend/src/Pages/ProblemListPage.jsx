import React, { useEffect, useState } from 'react';
import API from '../utils/api'; // Import your configured API utility
import { Link } from 'react-router-dom';

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

const ProblemsListPage = () => {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                // Use the API utility which should be configured with your EC2 backend URL
                const res = await API.get('/problems'); // Changed from axios.get('http://localhost:5000/api/problems')
                setProblems(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching problems:', err.response?.data || err);
                setError('Failed to fetch problems. Please try again later.');
                setLoading(false);
            }
        };

        fetchProblems();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 text-xl font-medium text-purple-600">
                <svg className="animate-spin h-8 w-8 mr-3 text-purple-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading problems...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 text-red-600 text-xl font-bold">
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
             <div className="absolute top-1/4 left-[10%] w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-slow-blob"></div>
             <div className="absolute top-[60%] right-[15%] w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-slow-blob animation-delay-2000"></div>
             <div className="absolute bottom-1/4 left-[35%] w-56 h-56 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-slow-blob animation-delay-4000"></div>

            <div className="relative z-10 max-w-4xl mx-auto"> {/* Adjusted max-width for a more typical list view */}
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-12 text-center leading-tight tracking-tighter drop-shadow-sm">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700">
                        Explore Challenges
                    </span>
                </h1>

                {/* Changed from grid to a simple div for list-like appearance */}
                <div className="bg-white rounded-xl shadow-lg border border-purple-100 divide-y divide-gray-200 overflow-hidden">
                    {problems.length > 0 ? (
                        problems.map((problem, index) => (
                            // Each problem is now a Link acting as a row
                            <Link
                                key={problem._id}
                                to={`/problems/${problem._id}`}
                                className="block p-4 sm:p-6 flex items-center justify-between transition-colors duration-200 hover:bg-gray-50"
                                // Removed individual card animations and hover transforms
                            >
                                {/* Left Section: Title and Tags */}
                                <div className="flex flex-col flex-grow mr-4"> {/* Added margin-right for spacing */}
                                    <h2 className="text-lg font-semibold text-gray-800 hover:text-purple-700 transition-colors duration-200 leading-snug">
                                        {problem.title}
                                    </h2>
                                    <div className="flex flex-wrap gap-2 mt-2"> {/* Added margin-top for spacing from title */}
                                        {problem.tags && problem.tags.length > 0 && problem.tags.map((tag, tagIndex) => (
                                            <span
                                                key={tagIndex}
                                                className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-sm" // Slightly smaller tag padding
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Section: Difficulty Badge */}
                                <div className="flex-shrink-0"> {/* Prevents badge from shrinking */}
                                    {getDifficultyBadge(problem.difficulty)}
                                </div>
                            </Link>
                        ))
                    ) : (
                        <p className="p-6 text-center text-gray-500 text-xl py-10">
                            No challenges currently available.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProblemsListPage;