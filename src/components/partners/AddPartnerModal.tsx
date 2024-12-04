import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { searchUsers, sendPartnerInvite } from '../../services/partners';

interface UserSearchResult {
  id: string;
  name: string;
  username: string;
}

export function AddPartnerModal({ onClose }: { onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitingUser, setInvitingUser] = useState<string | null>(null);
  const [filteredResults, setFilteredResults] = useState<UserSearchResult[]>([]);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        try {
          setIsLoading(true);
          setError(null);
          const results = await searchUsers(searchQuery);
          setSearchResults(results || []);
          setFilteredResults(results || []);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to search users');
          setSearchResults([]);
          setFilteredResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
        setFilteredResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleSendInvite = async (userId: string) => {
    try {
      setInvitingUser(userId);
      setError(null);
      await sendPartnerInvite(userId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInvitingUser(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black/90 border border-blue-500/10 rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add Workout Partner</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white pl-12"
            minLength={3}
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
        </div>

        {isLoading && (
          <p className="text-center text-gray-400 py-4">Searching...</p>
        )}

        {error && (
          <p className="text-center text-red-400 py-4">{error}</p>
        )}

        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <p className="text-center text-gray-400 py-4">Type at least 3 characters to search</p>
        )}

        <div className="space-y-4">
          {filteredResults.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 rounded-lg border border-blue-500/10 hover:border-blue-500/30 transition-colors"
            >
              <div>
                <h3 className="text-lg font-medium text-white">
                  {user.name} <span className="text-gray-400">@{user.username}</span>
                </h3>
              </div>
              <button
                onClick={() => handleSendInvite(user.id)}
                disabled={invitingUser === user.id}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-green-400 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {invitingUser === user.id ? 'Sending...' : 'Send Invite'}
                </span>
              </button>
            </div>
          ))}
          {searchQuery.length >= 3 && !isLoading && searchResults.length === 0 && (
            <p className="text-center text-gray-400 py-4">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
}