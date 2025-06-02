// src/Pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const DashboardPage = () => {
    const { user, loading: authLoading } = useAuth();
    const [userStats, setUserStats] = useState({
        problemsSolved: 0,
        rank: 'N/A',
        lastSubmission: null, // e.g., { problemTitle: 'Two Sum', verdict: 'Accepted' }
    });

    useEffect(() => {
        const fetchUserStats = async () => {
            if (user) {
                try {
                    const res = await axios.get(`http://localhost:5000/api/users/${user._id}/stats`);
                    setUserStats(res.data);
                } catch (err) {
                    console.error('Error fetching user stats:', err);
                    // Optionally set some default or error state for stats
                }
            }
        };
        fetchUserStats();
    }, [user]);

    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 text-xl font-medium text-purple-600">
                <svg className="animate-spin h-8 w-8 mr-3 text-purple-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading dashboard...
            </div>
        );
    }

    const isAdmin = user && typeof user.userType === 'string' && user.userType.toLowerCase() === 'admin';

    const StatCard = ({ title, value, linkText, linkTo, valueColorClass, icon }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between items-start">
            <div className="flex items-center justify-between w-full mb-4">
                <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
                {icon && <span className="text-purple-500 text-2xl">{icon}</span>}
            </div>
            <p className={`${valueColorClass} text-4xl font-bold mb-4`}>{value}</p>
            {linkTo && (
                <Link to={linkTo} className="text-purple-600 hover:text-purple-800 font-medium flex items-center text-sm mt-auto">
                    {linkText}
                    <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
            )}
        </div>
    );

    const LatestSubmissionCard = ({ submission }) => {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Latest Submission</h3>
                {submission ? (
                    <>
                        <p className="text-gray-700 text-md font-medium mb-2">{submission.problemTitle}</p>
                        <p className={`text-xl font-bold mb-4 ${submission.verdict === 'Accepted' ? 'text-green-600' : 'text-red-600'}`}>
                            {submission.verdict}
                        </p>
                        <Link to="/submissions" className="text-pink-600 hover:text-pink-800 font-medium flex items-center text-sm mt-auto">
                            View Details
                            <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                    </>
                ) : (
                    <div className="text-gray-500 text-center py-4 w-full flex flex-col items-center">
                        <p className="mb-2 text-sm">No recent submissions.</p>
                        <Link to="/problems" className="text-purple-600 hover:text-purple-800 font-medium text-sm">
                           Start Solving Now!
                        </Link>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 text-gray-900 pb-20">
            {/* No background blobs - kept clean */}

            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Main Welcome Section */}
                <header className="text-center mb-16"> {/* Increased bottom margin for more space */}
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-3 leading-tight tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700">
                            Welcome, {user?.fullName || user?.username || 'Coder'}!
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 font-normal max-w-xl mx-auto leading-relaxed">
                        Your personalized overview of progress and challenges.
                    </p>
                </header>

                {/* Key Metrics Section - Centered and Spaced */}
                <section className="mb-20"> {/* Increased bottom margin */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard
                            title="Problems Solved"
                            value={userStats.problemsSolved}
                            linkText="View All Submissions"
                            linkTo="/submissions"
                            valueColorClass="text-purple-600"
                            icon="✅"
                        />
                        <StatCard
                            title="Your Global Rank"
                            value={userStats.rank}
                            linkText="View Leaderboard"
                            linkTo="/leaderboard"
                            valueColorClass="text-indigo-600"
                            icon="🏆"
                        />
                        <LatestSubmissionCard submission={userStats.lastSubmission} />
                    </div>
                </section>

                {/* Main Calls to Action - Centered and Spaced */}
                <section className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-10"> {/* Increased bottom margin for heading */}
                        Ready to Begin?
                    </h2>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6"> {/* Increased gap for more space between buttons */}
                        <Link
                            to="/problems"
                            className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-bold rounded-md shadow-md text-white bg-gradient-to-r from-blue-600 to-teal-700 hover:from-blue-700 hover:to-teal-800 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-indigo-50"
                        >
                            <svg className="-ml-1 mr-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21H6.5a2 2 0 01-1.789-2.894l3.5-7A2 2 0 019.237 10h4.764zm-1.5 5h.01M10 11H9m-3 0a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            Explore Problems
                        </Link>

                        {isAdmin && (
                            <Link
                                to="/add-problem"
                                className="inline-flex items-center px-8 py-3 border border-purple-300 text-lg font-semibold rounded-md shadow-sm text-purple-700 bg-purple-100 hover:bg-purple-200 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-indigo-50"
                            >
                                <svg className="-ml-1 mr-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Create New Problem
                            </Link>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default DashboardPage;