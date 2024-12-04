import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
        <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-500 to-green-400 text-transparent bg-clip-text">
          Check Your Email
        </h2>
        <p className="text-center text-gray-300 mb-6">
          We've sent password reset instructions to your email address.
        </p>
        <Link
          to="/login"
          className="flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-blue-500 to-green-400 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Login</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-500 to-green-400 text-transparent bg-clip-text">
        Reset Password
      </h2>
      <p className="text-center text-gray-300 mb-6">
        Enter your email address and we'll send you instructions to reset your password.
      </p>
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
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-green-400 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Reset Instructions'}
        </button>
      </form>
      {error && (
        <p className="mt-4 text-center text-red-400">
          {error}
        </p>
      )}
      <div className="mt-4 text-center">
        <Link to="/login" className="text-blue-400 hover:text-blue-300">
          Back to Login
        </Link>
      </div>
    </div>
  );
}