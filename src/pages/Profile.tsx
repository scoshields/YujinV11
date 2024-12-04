import React, { useState, useEffect } from 'react';
import { User, Save } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getCurrentUser } from '../services/auth';

interface FormData {
  name: string;
  email: string;
  username: string;
  height: string;
  weight: string;
}

export function Profile() {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState<FormData>(() => ({
    name: user?.name ?? '',
    email: user?.email ?? '',
    username: user?.username ?? '',
    height: user?.height?.toString() ?? '',
    weight: user?.weight?.toString() ?? ''
  }));

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const userData = await getCurrentUser();
        if (userData) {
          setFormData({
            name: userData.name,
            email: userData.email,
            username: userData.username,
            height: userData.height.toString(),
            weight: userData.weight.toString()
          });
        }
      } catch (err) {
        console.error('Failed to load user data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      const updatedUser = {
        ...user,
        name: formData.name,
        email: formData.email,
        username: formData.username,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight)
      };
      updateUser(updatedUser);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pt-16 pb-8">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">Loading profile data...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black pt-16 pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <User className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
              <p className="text-gray-400 mt-1">Manage your account settings</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
                  required
                  pattern="[A-Za-z0-9_]+"
                  title="Username can only contain letters, numbers, and underscores"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Height (in)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
                    required
                    min="36"
                    max="96"
                    step="0.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
                    required
                    min="50"
                    max="500"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-blue-500 to-green-400 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Save className="w-5 h-5" />
              <span>Save Changes</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}