// src/pages/SubmissionsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { Link } from 'react-router-dom';

const SubmissionsPage = () => {
    const { user, loading: authLoading } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    useEffect(() => {
        const fetchSubmissions = async () => {
            setLoading(true);
            setError(null);
            if (user && user.id && !authLoading) {
                console.log("Fetching submissions for user ID:", user.id);
                try {
                    const res = await API.get(`/users/${user.id}/submissions`, {
                        params: { page: currentPage, limit }
                    });
                    setSubmissions(res.data.submissions);
                    setTotalPages(res.data.totalPages);
                } catch (err) {
                    console.error('Error fetching submissions:', err.response?.data || err);
                    setError(err.response?.data?.message || 'Failed to load submissions.');
                    setSubmissions([]);
                } finally {
                    setLoading(false);
                }
            } else if (!authLoading) {
                console.warn("User object or user.id not available for submissions fetch:", user);
                setLoading(false);
                setError("User data not fully available. Please log in again.");
            }
        };

        fetchSubmissions();
    }, [user, authLoading, currentPage]);

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const getVerdictClass = (verdict) => {
        switch (verdict) {
            case 'Accepted': return 'bg-green-200 text-green-600';
            case 'Wrong Answer': return 'bg-red-200 text-red-600';
            case 'Time Limit Exceeded': return 'bg-yellow-200 text-yellow-600';
            case 'Runtime Error': return 'bg-red-200 text-red-600';
            case 'Compilation Error': return 'bg-orange-200 text-orange-600';
            default: return 'bg-gray-200 text-gray-600';
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <p>Loading submissions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 text-red-600">
                <p>Error: {error}</p>
                <Link to="/login" className="text-blue-500 hover:underline mt-4">Login again</Link>
            </div>
        );
    }

    if (!user || !user.id) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 text-red-600">
                <p>User not logged in or ID not available.</p>
                <Link to="/login" className="text-blue-500 hover:underline mt-4">Go to Login</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4">
            <h1 className="text-3xl font-bold text-center mb-8">My Submissions</h1>
            {submissions.length === 0 ? (
                <p className="text-center text-gray-500">No submissions found.</p>
            ) : (
                <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Problem</th>
                                <th className="py-3 px-6 text-left">Verdict</th>
                                <th className="py-3 px-6 text-left">Language</th>
                                <th className="py-3 px-6 text-left">Submitted At</th>
                                {/* Add a header for Action/Details if desired */}
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {submissions.map(submission => (
                                // *** MAKE THE ENTIRE ROW CLICKABLE TO THE SUBMISSION DETAIL PAGE ***
                                <tr
                                    key={submission._id}
                                    className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => window.location.href = `/submissions/${submission._id}`} // Or use useNavigate from react-router-dom
                                >
                                    <td className="py-3 px-6 text-left whitespace-nowrap">
                                        <Link to={`/problems/${submission.problem._id}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                                            {submission.problem.title}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-6 text-left">
                                        <span className={`py-1 px-3 rounded-full text-xs font-semibold ${getVerdictClass(submission.verdict)}`}>
                                            {submission.verdict}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 text-left">{submission.language}</td>
                                    <td className="py-3 px-6 text-left">{new Date(submission.submittedAt).toLocaleString()}</td>
                                    {/* Optional: Add a column for a dedicated "View Details" button within the row */}
                                    {/* <td className="py-3 px-6 text-center">
                                        <Link to={`/submissions/${submission._id}`} className="text-purple-600 hover:text-purple-800">
                                            View
                                        </Link>
                                    </td> */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-4 flex justify-between items-center bg-gray-100 border-t border-gray-200">
                        <button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className="bg-purple-500 text-white py-2 px-4 rounded disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="bg-purple-500 text-white py-2 px-4 rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmissionsPage;