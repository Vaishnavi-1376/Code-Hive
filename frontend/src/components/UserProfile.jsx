import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MdEdit, MdSave, MdCancel, MdPerson, MdEmail, MdKey, MdAccountCircle } from 'react-icons/md';

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
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return '';
    };

    if (!token) return <p className="text-center mt-10 text-red-500">Please login to view your profile.</p>;
    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 text-xl font-medium text-purple-600">
            <svg className="animate-spin h-8 w-8 mr-3 text-purple-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading profile...
        </div>
    );
    if (error && !user) return <p className="text-center mt-10 text-red-500">{error}</p>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex justify-center items-center py-12 px-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 md:p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-t-2xl opacity-90"></div>

                <div className="relative z-10 -mt-20 mb-6">
                    {profilePicPreview ? (
                        <img
                            src={profilePicPreview}
                            alt="Profile"
                            className="w-36 h-36 rounded-full mx-auto object-cover border-4 border-white shadow-md"
                        />
                    ) : (
                        <div
                            className="w-36 h-36 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 text-white flex items-center justify-center mx-auto text-5xl font-bold border-4 border-white shadow-md leading-none"
                        >
                            {getInitials()}
                        </div>
                    )}
                </div>

                {error && <p className="text-red-500 text-sm mb-4 font-medium">{error}</p>}
                {successMessage && <p className="text-green-600 text-sm mb-4 font-medium">{successMessage}</p>}


                {!editing ? (
                    <>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2 mt-4 leading-tight">
                            {user?.fullName || 'Your Name'}
                        </h2>
                        <p className="text-lg text-gray-600 mb-8 font-normal">@{user?.username || 'username'}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left px-4 md:px-8">
                            <div className="bg-purple-50 p-4 rounded-lg shadow-sm flex items-center">
                                <MdEmail className="text-purple-600 text-xl mr-3" />
                                <div>
                                    <p className="text-sm text-gray-500">Email Address</p>
                                    <p className="text-md font-medium text-gray-800 break-words">{user?.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-lg shadow-sm flex items-center">
                                <MdKey className="text-indigo-600 text-xl mr-3" />
                                <div>
                                    <p className="text-sm text-gray-500">User ID</p>
                                    <p className="text-md font-medium text-gray-800 truncate">{user?._id || 'N/A'}</p>
                                </div>
                            </div>
                            {user?.userType && (
                                <div className="bg-blue-50 p-4 rounded-lg shadow-sm col-span-full flex items-center">
                                    <MdAccountCircle className="text-blue-600 text-xl mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-500">Account Type</p>
                                        <p className="text-md font-medium text-gray-800 capitalize">{user.userType}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-semibold py-3 px-8 rounded-full transition duration-300 shadow-md flex items-center justify-center mx-auto text-md"
                            onClick={() => setEditing(true)}
                        >
                            <MdEdit className="mr-2 text-xl" /> Modify Profile
                        </button>
                    </>
                ) : (
                    <form onSubmit={handleUpdate} className="text-left px-4 md:px-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Profile</h2>

                        <div className="mb-4">
                            <label htmlFor="fullName" className="block text-gray-700 text-sm font-semibold mb-2 flex items-center">
                                <MdPerson className="mr-2 text-purple-600" /> Full Name
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition duration-200 text-gray-800 text-md"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="username" className="block text-gray-700 text-sm font-semibold mb-2 flex items-center">
                                <MdAccountCircle className="mr-2 text-indigo-600" /> Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-gray-800 text-md"
                                placeholder="Choose a username"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2 flex items-center">
                                <MdEmail className="mr-2 text-blue-600" /> Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                readOnly
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600 text-md"
                                placeholder="Your email address (cannot be changed)"
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="profilePic" className="block text-gray-700 text-sm font-semibold mb-2 flex items-center">
                                <MdPerson className="mr-2 text-teal-600" /> Profile Picture
                            </label>
                            <input
                                type="file"
                                id="profilePic"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-600
                                file:mr-4 file:py-2.5 file:px-6
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-purple-100 file:text-purple-700
                                hover:file:bg-purple-200 transition duration-200 cursor-pointer"
                            />
                            {profilePicPreview && (
                                <div className="mt-4 text-center">
                                    <img src={profilePicPreview} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-purple-200 shadow-md" />
                                    <p className="text-xs text-gray-500 mt-2">New picture preview</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center gap-5 mt-6">
                            <button
                                type="submit"
                                disabled={submitLoading}
                                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 px-8 rounded-full transition duration-300 shadow-md flex items-center justify-center text-md"
                            >
                                <MdSave className="mr-2 text-xl" /> {submitLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                className="bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded-full hover:bg-gray-400 transition duration-300 shadow-md flex items-center justify-center text-md"
                                onClick={cancelEdit}
                            >
                                <MdCancel className="mr-2 text-xl" /> Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default UserProfile;