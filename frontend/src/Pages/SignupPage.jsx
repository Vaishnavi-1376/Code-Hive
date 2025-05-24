import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import API from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import Loader from '../components/Loader';

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
  } = useForm({ resolver: yupResolver(schema) });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      const { confirmPassword, ...rest } = data;
      await API.post('/users/signup', rest);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-8 bg-white rounded shadow-md">
      <h1 className="text-3xl font-semibold mb-6 text-center">Sign Up</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="block mb-1 font-medium">Full Name</label>
        <input
          {...register('fullName')}
          type="text"
          className={`w-full border rounded px-3 py-2 mb-2 ${errors.fullName ? 'border-danger' : 'border-gray-300'
            }`}
          placeholder="Full Name"
        />
        {errors.fullName && <p className="text-danger mb-2">{errors.fullName.message}</p>}

        <label className="block mb-1 font-medium">Username</label>
        <input
          {...register('username')}
          type="text"
          className={`w-full border rounded px-3 py-2 mb-2 ${errors.username ? 'border-danger' : 'border-gray-300'
            }`}
          placeholder="Username"
        />
        {errors.username && <p className="text-danger mb-2">{errors.username.message}</p>}

        <label className="block mb-1 font-medium">Email</label>
        <input
          {...register('email')}
          type="email"
          className={`w-full border rounded px-3 py-2 mb-2 ${errors.email ? 'border-danger' : 'border-gray-300'
            }`}
          placeholder="abc@gmail.com"
        />
        {errors.email && <p className="text-danger mb-2">{errors.email.message}</p>}

        <label className="block mb-1 font-medium">Password</label>
        <input
          {...register('password')}
          type="password"
          className={`w-full border rounded px-3 py-2 mb-2 ${errors.password ? 'border-danger' : 'border-gray-300'
            }`}
          placeholder="Your password"
        />
        {errors.password && <p className="text-danger mb-2">{errors.password.message}</p>}

        <label className="block mb-1 font-medium">Confirm Password</label>
        <input
          {...register('confirmPassword')}
          type="password"
          className={`w-full border rounded px-3 py-2 mb-4 ${errors.confirmPassword ? 'border-danger' : 'border-gray-300'
            }`}
          placeholder="Confirm password"
        />
        {errors.confirmPassword && <p className="text-danger mb-2">{errors.confirmPassword.message}</p>}

        {error && <p className="text-danger mb-2 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-secondary text-white py-2 rounded font-semibold"
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      <p className="mt-4 text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
