import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../utils/api';

export default function VerifyEmail() {
  const { token } = useParams();
  const [message, setMessage] = useState('Verifying your email...');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        console.log('Verifying token:', token);

        const response = await API.get(`/users/verify/${token}`);
        setMessage(response.data.message || 'Email verified successfully!');
        setStatus('success');
      } catch (error) {
        setMessage(
          error.response?.data?.message || 'Email verification failed.'
        );
        setStatus('error');
      }
    };

    if (token) verifyEmail();
  }, [token]);

  return (
    <div className="max-w-md mx-auto mt-24 p-6 bg-white rounded shadow text-center">
      <h1
        className={`text-2xl font-semibold mb-4 ${status === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
      >
        {status === 'loading'
          ? 'Verifying...'
          : status === 'success'
            ? 'Success'
            : 'Failed'}
      </h1>
      <p>{message}</p>
    </div>
  );
}
