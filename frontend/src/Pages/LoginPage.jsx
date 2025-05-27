import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, error: authError, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await login(email, password);
        } catch (err) {
            console.error('Login attempt failed in LoginPage (caught from AuthContext):', err);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-gray-100">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Welcome Back!</h2> 

                {authError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                        <span className="block sm:inline font-medium">{authError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-5"> 
                        <input
                            type="email"
                            id="email"
                            placeholder="Your email address"
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition duration-200 text-gray-800 text-md placeholder-gray-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <input
                            type="password"
                            id="password"
                            placeholder="Your password"
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-gray-800 text-md placeholder-gray-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-semibold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline w-full transition duration-300 shadow-md text-lg" // Adjusted button style
                        disabled={authLoading}
                    >
                        {authLoading ? (
                             <div className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Logging in...
                            </div>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>

                <p className="mt-8 text-gray-600 text-md"> 
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-purple-600 hover:text-purple-700 hover:underline font-semibold transition duration-200"> {/* Link color adjusted */}
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;