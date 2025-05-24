import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-20">Loading dashboard...</div>;
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 w-full max-w-lg text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Welcome to Your Dashboard, <br />
          {user ? (user.fullName || user.username || user.email) : 'Guest'}!
        </h2>
        <p className="text-gray-600 mb-8">
          This is your personalized dashboard. You can customize this page to show
          relevant information, quick links, or recent activities.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/problems"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
          >
            Go To Problems
          </Link>
          <Link
            to="/submissions"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
          >
            View Submissions
          </Link>
          <Link
            to="/profile"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
          >
            Manage Profile
          </Link>

          { }
          { }
          <Link
            to="/add-problem"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
          >
            Add New Problem { }
          </Link>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;