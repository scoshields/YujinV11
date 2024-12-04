import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { signIn } from '../../services/auth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      
      const { user } = await signIn(email, password);
      if (!user) throw new Error('Login failed');
      
      await login(user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
      <div className="flex justify-center mb-6">
        <LogIn className="w-12 h-12 text-blue-500" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-500 to-green-400 text-transparent bg-clip-text">
        Welcome Back
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-green-400 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Sign In
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300">
          Forgot Password?
        </Link>
      </div>
      {error && (
        <p className="mt-4 text-center text-red-400">
          {error}
        </p>
      )}
      <p className="mt-6 text-center text-gray-400">
        Don't have an account?{' '}
        <Link to="/signup" className="text-blue-400 hover:text-blue-300">
          Sign up
        </Link>
      </p>
    </div>
  );
}