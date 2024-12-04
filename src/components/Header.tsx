import React, { useState } from 'react';
import { Dumbbell, LogOut, User, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useEffect } from 'react';

export function Header() {
  const { isAuthenticated, logout } = useAuthStore();
  const { pendingInvites, loadPendingInvites } = useNotificationStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadPendingInvites();
    }
  }, [isAuthenticated, loadPendingInvites]);

  return (
    <header className="bg-black/50 backdrop-blur-sm border-b border-blue-500/10 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center justify-between w-full">
          <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <Dumbbell className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-400 text-transparent bg-clip-text">
              Yujin Fit
            </span>
          </Link>
        
          {isAuthenticated ? (
            <nav className={`
              ${isMenuOpen ? 'flex' : 'hidden'} 
              md:flex flex-col md:flex-row items-center 
              fixed md:relative top-16 md:top-0 left-0 right-0
              bg-black/95 md:bg-transparent
              p-4 md:p-0 space-y-4 md:space-y-0 md:space-x-6
              border-b border-blue-500/10 md:border-0
            `}>
              <Link 
                to="/dashboard" 
                className="text-gray-300 hover:text-blue-400 transition-colors"
                onClick={closeMenu}
              >
                Dashboard
              </Link>
              <Link 
                to="/workouts" 
                className="text-gray-300 hover:text-blue-400 transition-colors"
                onClick={closeMenu}
              >
                Workouts
              </Link>
              <Link 
                to="/partners" 
                className="text-gray-300 hover:text-blue-400 transition-colors"
                onClick={closeMenu}
              >
                <div className="relative">
                  FitFam
                  {pendingInvites > 0 && (
                    <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {pendingInvites}
                    </span>
                  )}
                </div>
              </Link>
              <Link 
                to="/profile" 
                className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors"
                onClick={closeMenu}
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  closeMenu();
                }}
                className="flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </nav>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-300 hover:text-blue-400 transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button 
            className="md:hidden text-gray-300 hover:text-white"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </header>
  );
}