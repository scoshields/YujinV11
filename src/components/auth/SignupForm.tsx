import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { signUp, signIn } from '../../services/auth';

export function SignupForm() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      const userData = {
        name,
        username,
        email,
        height: parseFloat(height),
        weight: parseFloat(weight),
      };

      await signUp(email, password, userData);
      
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
      <div className="flex justify-center mb-6">
        <UserPlus className="w-12 h-12 text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-500 to-green-400 text-transparent bg-clip-text">
        Create Account
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
            Username * (unique)
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
            required
            pattern="[A-Za-z0-9_]+"
            title="Username can only contain letters, numbers, and underscores"
            minLength={3}
            maxLength={20}
          />
          <p className="text-xs text-gray-400 mt-1">3-20 characters, letters, numbers, and underscores only</p>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email *
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
            Password *
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
            required
            minLength={6}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-1">
              Height (in) *
            </label>
            <input
              type="number"
              id="height"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
              required
              min="36"
              max="96"
              step="0.5"
            />
            <p className="text-xs text-gray-400 mt-1">Enter height in inches</p>
          </div>
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-300 mb-1">
              Weight (lbs) *
            </label>
            <input
              type="number"
              id="weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
              required
              min="50"
              max="500"
              step="0.1"
            />
            <p className="text-xs text-gray-400 mt-1">Enter weight in pounds</p>
          </div>
        </div>
        <p className="text-xs text-gray-400">* Required fields</p>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-green-400 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      {error && (
        <p className="mt-4 text-center text-red-400">
          {error}
        </p>
      )}
      <p className="mt-4 text-center text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-400 hover:text-blue-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}