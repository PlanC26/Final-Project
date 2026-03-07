import React from 'react';

export default function ProtectedRoute({ children, setPage }) {
 
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
 
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-[#F4FFFF] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="flex justify-center mb-4">
            <svg className="h-16 w-16 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to access this page.</p>
          <div className="space-y-3">
            <button
              onClick={() => setPage("login")}
              className="w-full bg-[#384959] text-white py-2 px-4 rounded-lg hover:bg-[#2c3a47] transition"
            >
              Go to Login
            </button>
            <button
              onClick={() => setPage("home")}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
            >
              Back to Home
            </button>
          </div>
          </div>
      </div>
    );
  }
  
  
  return children;
}