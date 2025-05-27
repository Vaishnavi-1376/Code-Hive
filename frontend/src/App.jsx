import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/nav';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './Pages/Dashboard';
import ProfilePage from './Pages/ProfilePage';
import LoginPage from './Pages/LoginPage';
import SignupPage from './Pages/SignupPage';
import VerifyEmail from './Pages/VerifyEmail';
import CompilerPage from './Pages/CompilerPage';
import AddProblemPage from './Pages/AddProblemPage';
import ProblemsListPage from './Pages/ProblemListPage';
import ProblemDetailPage from './Pages/ProblemDetailPage';
import EditProblemPage from './Pages/EditProblemPage';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <div className="main-content">
          <Routes>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify/:token" element={<VerifyEmail />} />
            <Route path="/problems" element={<ProblemsListPage />} />
            <Route path="/problems/:id" element={<ProblemDetailPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/compiler" element={<ProtectedRoute><CompilerPage /></ProtectedRoute>} />
            <Route path="/add-problem" element={<ProtectedRoute><AddProblemPage /></ProtectedRoute>} />
            <Route path="/edit-problem/:id" element={<ProtectedRoute><EditProblemPage /></ProtectedRoute>} />

          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;