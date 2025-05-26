import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api'; 

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verifying your email...');
  const [status, setStatus] = useState('loading'); 

  useEffect(() => {
    let redirectTimeout; 

    const verifyEmail = async () => {
      if (!token) {
        setMessage('No verification token found in the URL. Redirecting...');
        setStatus('error'); 
        redirectTimeout = setTimeout(() => {
          navigate('/login');
        }, 1000);
        return;
      }

      try {
        console.log('Verifying token:', token);
        const response = await API.get(`/users/verify/${token}`);

        setMessage(response.data.message || 'Email verified successfully!');
        setStatus('success');

        redirectTimeout = setTimeout(() => {
          navigate('/login');
        }, 3000); 

      } catch (error) {
        console.error('Email verification failed:', error.response?.data || error);
        const errorMessage = error.response?.data?.message || 'Email verification failed due to a server error.';

        if (errorMessage.includes('already verified')) {
          setMessage('Your email is already verified. Redirecting to login...');
          setStatus('redirecting');
          redirectTimeout = setTimeout(() => {
            navigate('/login');
          }, 1500); 
        } else if (errorMessage.includes('expired')) {
          setMessage('Your verification link has expired. Please request a new verification email. Redirecting to login...');
          setStatus('redirecting');
          redirectTimeout = setTimeout(() => {
            navigate('/login');
          }, 1000); 
        } else if (errorMessage.includes('Invalid verification link')) {
          setMessage('This verification link is invalid or has been used. If you already verified, please try logging in. Redirecting to login...');
          setStatus('redirecting');
          redirectTimeout = setTimeout(() => {
            navigate('/login');
          }, 1000); 
        } else {
          setMessage(errorMessage + ' Redirecting to login...');
          setStatus('error'); 
          redirectTimeout = setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      }
    };

    verifyEmail();

    return () => {
      clearTimeout(redirectTimeout);
    };
  }, [token, navigate]);

  return (
    <div className="max-w-md mx-auto mt-24 p-6 bg-white rounded shadow text-center">
      <h1
        className={`text-2xl font-semibold mb-4
          ${status === 'success' ? 'text-green-600' : ''}
          ${status === 'error' ? 'text-red-600' : ''}
          ${status === 'loading' || status === 'redirecting' ? 'text-gray-800' : ''}
        `}
      >
        {status === 'loading'
          ? 'Verifying...'
          : status === 'success'
            ? 'Success!'
            : status === 'error'
              ? 'Verification Failed!'
              : 'Redirecting...'} 
      </h1>
      <p>{message}</p>

      {(status === 'loading' || status === 'redirecting') && (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mt-4"></div>
      )}

      {status === 'error' && (
        <p className="mt-4 text-sm text-gray-500">
          Please ensure you are using the latest verification link sent to your email.
        </p>
      )}
      {(status === 'success' || status === 'redirecting') && (
        <p className="mt-4 text-sm text-gray-500">
          You will be redirected to the login page shortly.
        </p>
      )}
    </div>
  );
}