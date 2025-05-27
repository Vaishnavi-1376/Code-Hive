import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MdEdit, MdSave, MdCancel } from 'react-icons/md';

const UserProfile = () => {
  const { token, user: authUser } = useAuth();
  const [user, setUser] = useState(authUser || null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    profilePic: null,
  });
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedUser = res.data;
      setUser(fetchedUser);
      setFormData({
        username: fetchedUser.username || '',
        fullName: fetchedUser.fullName || '',
        email: fetchedUser.email || '',
        profilePic: null,
      });

      if (fetchedUser.profilePic) {
        setProfilePicPreview(`http://localhost:5000${fetchedUser.profilePic}`);
      } else {
        setProfilePicPreview(null);
      }

    } catch (err) {
      console.error('Fetch profile error:', err);
      setError('Failed to load profile. Please login again.');
      if (err.response?.status === 401) {
          localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
      setError('You are not logged in.');
    }
  }, [token]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSubmitLoading(true);

    try {
      const updateData = new FormData();
      updateData.append('username', formData.username);
      updateData.append('fullName', formData.fullName);

      if (formData.profilePic) {
        updateData.append('profilePic', formData.profilePic);
      }

      const res = await axios.put('http://localhost:5000/api/users/profile', updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessMessage(res.data.message || 'Profile updated successfully!');
      await fetchProfile();
      setEditing(false);
      setFormData({ ...formData, profilePic: null });
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error);
      setError(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, profilePic: file });
    if (file) {
      setProfilePicPreview(URL.createObjectURL(file));
    } else {
      setProfilePicPreview(user?.profilePic ? `http://localhost:5000${user.profilePic}` : null);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    if (user) {
      setFormData({
        username: user.username || '',
        fullName: user.fullName || '',
        email: user.email || '',
        profilePic: null,
      });
      setProfilePicPreview(user.profilePic ? `http://localhost:5000${user.profilePic}` : null);
    }
    setError('');
    setSuccessMessage('');
  };

  const getInitials = () => {
    const name = user?.fullName || user?.username || user?.email || '';
    const parts = name.trim().split(' ');
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0][0].toUpperCase();
    } else if (parts.length > 1 && parts[0].length > 0 && parts[1].length > 0) {
      return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
    }
    return '';
  };

  if (!token) return <p className="text-center mt-10 text-red-500">Please login.</p>;
  if (loading) return <p className="text-center mt-10">Loading profile...</p>;
  if (error && !user) return <p className="text-center mt-10 text-red-500">{error}</p>;


  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gray-50 px-4 py-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8 md:p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl"></div>

        <div className="relative z-10 -mt-16 mb-6">
          {profilePicPreview ? (
            <img
              src={profilePicPreview}
              alt="Profile"
              className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-md"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 text-white flex items-center justify-center mx-auto text-5xl font-bold border-4 border-white shadow-md">
              {getInitials()}
            </div>
          )}
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}


        {!editing ? (
          <>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {user?.fullName || 'N/A'}
            </h2>
            <p className="text-lg text-gray-600 mb-6">@{user?.username || 'N/A'}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left px-4 md:px-8">
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="text-md font-medium text-gray-800">{user?.email || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500">User ID</p>
                <p className="text-md font-medium text-gray-800">{user?._id || 'N/A'}</p>
              </div>
              {user?.userType && (
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm col-span-full">
                  <p className="text-sm text-gray-500">Account Type</p>
                  <p className="text-md font-medium text-gray-800 capitalize">{user.userType}</p>
                </div>
              )}
            </div>

            <button
              className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full transition duration-300 shadow-md hover:shadow-lg flex items-center justify-center mx-auto"
              onClick={() => setEditing(true)}
            >
              <MdEdit className="mr-2" /> Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleUpdate} className="text-left px-4 md:px-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Edit Profile</h2>

            <div className="mb-4">
              <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
              <input
                type="text"
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                placeholder="Your Full Name"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Username</label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                placeholder="Your Username"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                readOnly
                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 bg-gray-100 cursor-not-allowed"
                placeholder="Your Email"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="profilePic" className="block text-gray-700 text-sm font-bold mb-2">Profile Picture</label>
              <input
                type="file"
                id="profilePic"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {profilePicPreview && (
                <div className="mt-4 text-center">
                  <img src={profilePicPreview} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover mx-auto border border-gray-300" />
                  <p className="text-xs text-gray-500 mt-2">New picture preview</p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <button
                type="submit"
                disabled={submitLoading}
                className="bg-green-600 text-white font-semibold py-3 px-8 rounded-full hover:bg-green-700 transition duration-300 shadow-md flex items-center justify-center"
              >
                <MdSave className="mr-2" /> {submitLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded-full hover:bg-gray-400 transition duration-300 shadow-md flex items-center justify-center"
                onClick={cancelEdit}
              >
                <MdCancel className="mr-2" /> Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfile;