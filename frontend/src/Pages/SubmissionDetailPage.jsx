// src/pages/SubmissionDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../utils/api'; // Ensure this path is correct

const SubmissionDetailPage = () => {
    const { id } = useParams(); // Get the submission ID from the URL
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSubmissionDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                // Assuming your API has an endpoint like /api/submissions/:id
                const res = await API.get(`/submissions/${id}`);
                setSubmission(res.data);
                setLoading(false);
            } catch (err) {
                console.error(`Error fetching submission ${id} details:`, err.response?.data || err);
                setError(err.response?.data?.message || 'Failed to load submission details. Please try again later.');
                setLoading(false);
            }
        };

        if (id) {
            fetchSubmissionDetails();
        }
    }, [id]); // Dependency array to re-fetch if ID changes

    // Helper to render verdict badge for consistency
    const getVerdictBadge = (verdict) => {
        let bgColor, textColor;
        switch (verdict) {
            case 'Accepted':
                bgColor = 'bg-emerald-100';
                textColor = 'text-emerald-800';
                break;
            case 'Wrong Answer':
            case 'Time Limit Exceeded':
            case 'Runtime Error':
            case 'Compilation Error': // Added for robustness
                bgColor = 'bg-red-100';
                textColor = 'text-red-800';
                break;
            default:
                bgColor = 'bg-gray-100';
                textColor = 'text-gray-800';
        }
        return (
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${bgColor} ${textColor}`}>
                {verdict}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 text-xl font-medium text-purple-600">
                <svg className="animate-spin h-8 w-8 mr-3 text-purple-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading submission details...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 text-red-600">
                <p className="text-xl font-medium mb-4">{error}</p>
                <Link to="/submissions" className="text-blue-500 hover:underline">Back to Submissions List</Link>
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 text-gray-500">
                <p className="text-xl font-medium mb-4">Submission not found.</p>
                <Link to="/submissions" className="text-blue-500 hover:underline">Back to Submissions List</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
            {/* Background elements for styling */}
            <div className="absolute top-1/4 left-[10%] w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-slow-blob"></div>
            <div className="absolute top-[60%] right-[15%] w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-slow-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-[35%] w-56 h-56 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-slow-blob animation-delay-4000"></div>

            <div className="relative z-10 max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-purple-100 p-8 sm:p-10">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8 text-center leading-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700">
                        Submission Details
                    </span>
                </h1>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Problem:</h2>
                        {/* Link to the problem detail page */}
                        <Link to={`/problems/${submission.problem._id}`} className="text-lg text-blue-600 hover:underline">
                            {submission.problem.title || 'N/A'}
                        </Link>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Verdict:</h2>
                        {getVerdictBadge(submission.verdict || 'N/A')}
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Language:</h2>
                        <p className="text-lg text-gray-700">{submission.language || 'N/A'}</p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Submitted At:</h2>
                        <p className="text-lg text-gray-700">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}</p>
                    </div>

                    {/* Display compilation output if available and not accepted */}
                    {submission.verdict !== 'Accepted' && submission.compilationOutput && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Compilation Output:</h2>
                            <pre className="bg-red-50 border border-red-200 rounded-md p-4 text-sm font-mono overflow-auto max-h-48 text-red-800">
                                <code>{submission.compilationOutput}</code>
                            </pre>
                        </div>
                    )}

                    {/* Display code if available (important for debugging) */}
                    {submission.code && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Submitted Code:</h2>
                            <pre className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm font-mono overflow-auto max-h-96">
                                <code>{submission.code}</code>
                            </pre>
                        </div>
                    )}

                    <div className="mt-8 flex justify-center space-x-4">
                        <Link
                            to="/submissions"
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                        >
                            ← Back to All Submissions
                        </Link>
                        {/* Optionally, add a link to the problem page itself */}
                        {submission.problem && submission.problem._id && (
                            <Link
                                to={`/problems/${submission.problem._id}`}
                                className="inline-flex items-center px-6 py-3 border border-purple-300 text-base font-medium rounded-full shadow-sm text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                            >
                                View Problem →
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubmissionDetailPage;