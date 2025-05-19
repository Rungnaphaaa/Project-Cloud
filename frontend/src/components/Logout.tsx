import { useState } from 'react';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    setShowConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('userID');
    localStorage.removeItem('role');
    localStorage.removeItem('isLogin');
    window.location.href = '/frontend/home';
  };

  const cancelLogout = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition duration-300 shadow-md font-medium"
      >
        <LogOut size={16} />
        <span>Logout</span>
      </button>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Overlay with KFC-style background */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          
          {/* Modal card with accent colors */}
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 border-t-4 border-red-600 animate-fadeIn">
            {/* Header with icon */}
            <div className="flex justify-center mb-4 relative">
              <div className="absolute -top-12 bg-white rounded-full p-3 shadow-lg border-2 border-red-100">
                <LogOut size={28} className="text-red-600" />
              </div>
            </div>
            
            <div className="mt-6">
              {/* Clean heading */}
              <h3 className="text-xl font-bold text-center mb-3 text-gray-800">
                Logout
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 mb-6 text-center">
                Do you want to log out of Fairytopia?
              </p>
              
              {/* Styled buttons */}
              <div className="flex gap-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 py-3 px-4 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition duration-300 shadow-md font-medium text-sm"
                >
                  Yes
                </button>
              </div>
              
              {/* Footer text */}
              <p className="text-xs text-gray-400 text-center mt-4">
                Thank you for using Fairytopia.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}