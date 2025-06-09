import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Nav = () => {
  const navigate = useNavigate();
  const { token, logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-6 py-5 flex justify-between items-center shadow-lg sticky top-0 z-50">
      <Link to="/" className="text-3xl font-extrabold tracking-tight text-white hover:text-blue-100 transition duration-300 ease-in-out">
        Code Hive
      </Link>

      <div className="flex items-center space-x-6 text-lg"> 
        {token ? (
          <>
            <span className="text-blue-100 text-base font-medium hidden md:inline">
              Hello, {user?.fullName || user?.username || user?.email}
            </span>

            <Link
              to="/profile"
              className="text-white hover:text-blue-200 hover:scale-105 transition duration-300 ease-in-out font-semibold px-3 py-1 rounded-md"
            >
              Profile
            </Link>

            {user && user.userType && user.userType.toLowerCase() === 'admin' && (
              <Link
                to="/dashboard" 
                className="text-white hover:text-blue-200 hover:scale-105 transition duration-300 ease-in-out font-semibold px-3 py-1 rounded-md"
              >
                Dashboard
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-2 px-5 rounded-full shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-white hover:text-blue-200 hover:scale-105 transition duration-300 ease-in-out font-semibold px-3 py-1 rounded-md"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-2 px-5 rounded-full shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Nav;