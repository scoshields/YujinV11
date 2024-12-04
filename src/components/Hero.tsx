import React from 'react';
import { Users, Target, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-green-500/10" />
      <div className="relative container mx-auto px-4 py-32 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Transform Together
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Partner up, track progress, and achieve your fitness goals with our innovative workout tracking platform.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
          <Link 
            to="/signup" 
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-green-400 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Get Started Free
          </Link>
          <Link 
            to="/login" 
            className="w-full md:w-auto px-8 py-4 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
          >
            Sign In
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              icon: <Users className="w-8 h-8 text-blue-400" />,
              title: 'Partner Workouts',
              description: 'Find your perfect workout partner and stay motivated together'
            },
            {
              icon: <Target className="w-8 h-8 text-green-400" />,
              title: 'Track Progress',
              description: 'Monitor your improvements with detailed tracking and analytics'
            },
            {
              icon: <Zap className="w-8 h-8 text-orange-400" />,
              title: 'Daily Challenges',
              description: 'Keep motivated with new workout challenges every day'
            }
          ].map((feature, index) => (
            <div key={index} className="p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex justify-center mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}