import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AddProblemPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [tags, setTags] = useState(''); 
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [message, setMessage] = useState(''); 
  const [error, setError] = useState('');     
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); 
    setError('');   
    setLoading(true);

    if (!token) {
      setError('You must be logged in to add a problem.');
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      const problemData = {
        title,
        description,
        difficulty,
        tags: tags, 
        sampleInput,
        sampleOutput,
      };

      const res = await axios.post('http://localhost:5000/api/problems', problemData, config);

      setMessage('Problem added successfully!'); 
      setTitle('');
      setDescription('');
      setDifficulty('Easy');
      setTags('');
      setSampleInput('');
      setSampleOutput('');
      setTimeout(() => {
        navigate('/problems');
      }, 1500); 

    } catch (err) {
      console.error('Error adding problem:', err.response?.data || err);

      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to add problem. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 w-full max-w-3xl">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Add New Problem</h2>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Problem Title</label>
            <input
              type="text"
              id="title"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              rows="6"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">Difficulty</label>
            <select
              id="difficulty"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
            <input
              type="text"
              id="tags"
              placeholder="e.g., arrays, sorting, dynamic programming"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="sampleInput" className="block text-sm font-medium text-gray-700">Sample Input</label>
            <textarea
              id="sampleInput"
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
            ></textarea>
          </div>

          <div>
            <label htmlFor="sampleOutput" className="block text-sm font-medium text-gray-700">Sample Output</label>
            <textarea
              id="sampleOutput"
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={sampleOutput}
              onChange={(e) => setSampleOutput(e.target.value)}
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
            disabled={loading}
          >
            {loading ? 'Adding Problem...' : 'Add Problem'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProblemPage;