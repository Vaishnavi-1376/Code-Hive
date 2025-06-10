// src/pages/SignupPage.jsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import API from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
// import Loader from '../components/Loader'; // Loader is not used directly here, but kept if you plan to use it

const schema = yup.object().shape({
    fullName: yup.string().min(3, 'Min 3 characters').required('Full name is required'),
    username: yup.string().min(3, 'Min 3 characters').required('Username is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password'), null], 'Passwords must match')
        .required('Confirm your password'),
});

export default function Signup() {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset // Add reset to clear form after success
    } = useForm({ resolver: yupResolver(schema) });

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(''); // NEW STATE FOR SUCCESS MESSAGE
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        setError('');
        setSuccessMessage(''); // Clear any previous success message
        setLoading(true);
        try {
            const { confirmPassword, ...rest } = data;
            const res = await API.post('/users/signup', rest); // Capture the response

            // Set the success message from the backend response
            setSuccessMessage(res.data.message || 'Signup successful! Please check your email for verification.');
            reset(); // Optionally reset the form fields after successful signup

            // DO NOT navigate here. We want the message to be seen.
            // navigate('/login'); // <--- REMOVE OR COMMENT OUT THIS LINE
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
            setSuccessMessage(''); // Ensure success message is cleared on error
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
            <div className="max-w-2xl mx-auto mt-24 p-10 bg-white rounded shadow-md">
                <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">Sign Up</h1>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* Display error messages */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {/* Display success message */}
                    {successMessage && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{successMessage}</span>
                        </div>
                    )}

                    <label className="block mb-1 font-medium text-gray-700">Full Name</label>
                    <input
                        {...register('fullName')}
                        type="text"
                        className={`w-full border rounded px-3 py-2 mb-2 transition duration-200 text-gray-800 placeholder-gray-400
                            ${errors.fullName ? 'border-red-400 focus:outline-none focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500'
                            }`}
                        placeholder="Full Name"
                    />
                    {errors.fullName && <p className="text-red-500 mb-2">{errors.fullName.message}</p>}

                    <label className="block mb-1 font-medium text-gray-700">Username</label>
                    <input
                        {...register('username')}
                        type="text"
                        className={`w-full border rounded px-3 py-2 mb-2 transition duration-200 text-gray-800 placeholder-gray-400
                            ${errors.username ? 'border-red-400 focus:outline-none focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                            }`}
                        placeholder="Username"
                    />
                    {errors.username && <p className="text-red-500 mb-2">{errors.username.message}</p>}

                    <label className="block mb-1 font-medium text-gray-700">Email</label>
                    <input
                        {...register('email')}
                        type="email"
                        className={`w-full border rounded px-3 py-2 mb-2 transition duration-200 text-gray-800 placeholder-gray-400
                            ${errors.email ? 'border-red-400 focus:outline-none focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500'
                            }`}
                        placeholder="abc@gmail.com"
                    />
                    {errors.email && <p className="text-red-500 mb-2">{errors.email.message}</p>}

                    <label className="block mb-1 font-medium text-gray-700">Password</label>
                    <input
                        {...register('password')}
                        type="password"
                        className={`w-full border rounded px-3 py-2 mb-2 transition duration-200 text-gray-800 placeholder-gray-400
                            ${errors.password ? 'border-red-400 focus:outline-none focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500'
                            }`}
                        placeholder="Your password"
                    />
                    {errors.password && <p className="text-red-500 mb-2">{errors.password.message}</p>}
                    <label className="block mb-1 font-medium text-gray-700">Confirm Password</label>
                    <input
                        {...register('confirmPassword')}
                        type="password"
                        className={`w-full border rounded px-3 py-2 mb-4 transition duration-200 text-gray-800 placeholder-gray-400
                            ${errors.confirmPassword ? 'border-red-400 focus:outline-none focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                            }`}
                        placeholder="Confirm password"
                    />
                    {errors.confirmPassword && <p className="text-red-500 mb-2">{errors.confirmPassword.message}</p>}
                    {/* The general error display is already present, no need for the extra `error` p tag */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white py-2 rounded-full font-semibold transition duration-300 shadow-md"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing up...
                            </div>
                        ) : (
                            'Sign Up'
                        )}
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-purple-600 hover:text-purple-700 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}