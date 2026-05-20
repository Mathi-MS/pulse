import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Lock, Mail, User, ArrowRight, Zap } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, error } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      return setLocalError('Passwords do not match');
    }

    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-darkbg-950 px-4 overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-indigo-600/10 blur-[120px] animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-purple-600/10 blur-[130px] animate-pulse-glow"></div>

      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d121f] bg-opacity-65 p-8 shadow-2xl glass-card relative z-10">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-neon">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Create your account
          </h2>
          <p className="mt-1.5 text-xs text-slate-400">
            Start collecting and analyzing user events in real-time.
          </p>
        </div>

        {/* Errors display */}
        {(error || localError) && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-xs text-red-400 text-center">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Carter"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 bg-opacity-70 py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 bg-opacity-70 py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 bg-opacity-70 py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 bg-opacity-70 py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white transition-all duration-200 shadow-neon"
          >
            {isLoading ? 'Creating Account...' : 'Get Started'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Login redirection */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}
