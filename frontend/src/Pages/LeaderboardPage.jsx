import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api'; 

const LeaderboardPage = () => {
    const { user, token } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!token) { 
                setLoading(false);
                setError('Please log in to view the leaderboard.');
                return;
            }

            try {
                const res = await api.get('/users/leaderboard'); 
                setLeaderboard(res.data);
            } catch (err) {
                console.error('Error fetching leaderboard:', err);
                setError('Failed to load leaderboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [token]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-purple-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-xl font-medium text-purple-600">Loading leaderboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center text-red-600 text-lg">{error}</div>
                </div>
            </div>
        );
    }

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return '🥇';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return '🏅';
        }
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 1:
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 2:
                return 'text-gray-600 bg-gray-50 border-gray-200';
            case 3:
                return 'text-amber-600 bg-amber-50 border-amber-200';
            default:
                return 'text-purple-600 bg-purple-50 border-purple-200';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <header className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700">
                            🏆 Global Leaderboard
                        </span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        See how you stack up against other coders based on problems solved
                    </p>
                </header>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    {leaderboard.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📊</div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Rankings Yet</h3>
                            <p className="text-gray-500">Start solving problems to appear on the leaderboard!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Rank</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Problems Solved</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {leaderboard.map((userEntry, index) => {
                                        const rank = index + 1;
                                        const isCurrentUser = user && userEntry._id === user._id;

                                        return (
                                            <tr
                                                key={userEntry._id}
                                                className={`${isCurrentUser ? 'bg-purple-25 border-l-4 border-purple-500' : 'hover:bg-gray-50'} transition-colors duration-200`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRankColor(rank)}`}>
                                                        <span className="mr-2">{getRankIcon(rank)}</span>
                                                        <span className="font-bold">#{rank}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                                                                {userEntry.fullName ? userEntry.fullName.charAt(0).toUpperCase() : 'U'}
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 flex items-center">
                                                                {userEntry.fullName || 'Anonymous User'}
                                                                {isCurrentUser && (
                                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                @{userEntry.username || 'unknown'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="text-2xl font-bold text-indigo-600">
                                                        {userEntry.problemsSolvedCount}
                                                    </div>
                                                    <div className="text-xs text-gray-500">problems</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {userEntry.problemsSolvedCount > 0 ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            New
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {leaderboard.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                            <div className="text-3xl font-bold text-purple-600">{leaderboard.length}</div>
                            <div className="text-sm text-gray-600 mt-1">Total Participants</div>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                            <div className="text-3xl font-bold text-indigo-600">
                                {Math.max(...leaderboard.map(u => u.problemsSolvedCount))}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Highest Score</div>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                            <div className="text-3xl font-bold text-blue-600">
                                {Math.round(leaderboard.reduce((sum, u) => sum + u.problemsSolvedCount, 0) / leaderboard.length)}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Average Score</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaderboardPage;