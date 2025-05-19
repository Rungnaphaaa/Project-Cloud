import { useState, useRef, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ChevronLeft, Star, Check, X, AlertCircle } from 'lucide-react';
import { createUser, loginUser } from '../../api/userApi';
import { useNavigate } from 'react-router-dom';
import type { ChangeEvent } from 'react';

// Toast notification component
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  isVisible: boolean;
}

const Toast = ({ message, type, onClose, isVisible }: ToastProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-100',
          border: 'border-green-500',
          iconColor: 'text-green-500',
          icon: <Check size={20} />,
        };
      case 'error':
        return {
          bg: 'bg-red-100',
          border: 'border-red-500',
          iconColor: 'text-red-500',
          icon: <AlertCircle size={20} />,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-100',
          border: 'border-yellow-500',
          iconColor: 'text-yellow-500',
          icon: <AlertCircle size={20} />,
        };
      default:
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-500',
          iconColor: 'text-blue-500',
          icon: <AlertCircle size={20} />,
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`${styles.bg} border-l-4 ${styles.border} p-4 rounded shadow-lg max-w-md flex items-start`}>
        <div className={`${styles.iconColor} flex-shrink-0 mr-3`}>
          {styles.icon}
        </div>
        <div className="flex-grow">
          <p className="text-sm text-gray-800">{message}</p>
        </div>
        <button onClick={onClose} className="ml-4 text-gray-500 hover:text-gray-700">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });
  const footerRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  interface ShowToastFn {
    (message: string, type?: 'success' | 'error' | 'warning' | 'info'): void;
  }

  const showToast: ShowToastFn = (message, type = 'info') => {
    setToast({
      message,
      type,
      isVisible: true
    });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  interface NewUser {
    name: string;
    email: string;
    password: string;
    role_id: string;
  }

  interface LoginData {
    email: string;
    password: string;
  }

  interface LoginResponse {
    user: {
      user_id: string | number;
      role_name?: string;
    };
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    if (!isLogin) {
      if (!formData.name || !formData.confirmPassword) {
        showToast("Please fill out the membership application form completely.", "error");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showToast("Passwords do not match. Please check again.", "error");
        return;
      }

      try {
        const newUser: NewUser = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role_id: '2',
        };

        await createUser(newUser);
        showToast("Account created successfully. Please log in.", "success");
        setIsLogin(true);
      } catch (error) {
        console.error("Signup error:", error);
        showToast("Unable to register. Please try again.", "error");
      }

      return;
    }

    else {
      try {
        const loginData: LoginData = {
          email: formData.email,
          password: formData.password,
        };

        const data: LoginResponse = await loginUser(loginData);
        localStorage.setItem('userID', String(data.user.user_id));
        localStorage.setItem('role', data.user.role_name ?? '');
        localStorage.setItem('isLogin', 'true');
        showToast("Login successful", "success");
        setTimeout(() => {
          navigate(`/profile/${data.user.user_id}`);
        }, 1000);
      } catch (error) {
        console.error('Error during login:', error);
        showToast("Login failed. Email or password is incorrect.", "error");
      }
    }
  };

  interface FormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }


  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />

      {/* Navigation Bar */}
      <nav className="bg-black text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/frontend/home" className="flex items-center gap-2 text-xl font-bold hover:text-red-500 transition">
                <span className="text-red-600 text-2xl">🍗</span>
                <span>Frytopia</span>
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <a href="/frontend/home" className="px-3 py-2 rounded-md hover:bg-red-600 transition">Home</a>
              <button
                onClick={() => footerRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 py-2 rounded-md hover:bg-red-600 transition"
              >
                About
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Featured Banner */}
      <div className="bg-black text-white py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center gap-2">
            <Star size={16} className="text-yellow-400" />
            <p className="text-sm font-medium">Welcome to Frytopia - Your Home of Delicious Fried Chicken!</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          {/* Header */}
          <div className="flex items-center mb-8">
            <a href="/frontend/home" className="text-red-600 hover:text-red-700 transition">
              <ChevronLeft size={22} strokeWidth={2.5} />
            </a>
            <h1 className="text-2xl font-bold text-center flex-grow text-gray-900">
              {isLogin ? 'Login' : 'Sign Up'}
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-black">
            {/* Name Field - Only for Sign Up */}
            {!isLogin && (
              <div>
                <label className="block text-gray-800 text-sm font-medium mb-2" htmlFor="name">
                  Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-red-600" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 focus:border-red-600 focus:ring focus:ring-red-200 focus:ring-opacity-50 bg-gray-50 rounded-lg focus:outline-none focus:bg-white transition duration-200"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-gray-800 text-sm font-medium mb-2" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-red-600" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 focus:border-red-600 focus:ring focus:ring-red-200 focus:ring-opacity-50 bg-gray-50 rounded-lg focus:outline-none focus:bg-white transition duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-800 text-sm font-medium mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-red-600" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 focus:border-red-600 focus:ring focus:ring-red-200 focus:ring-opacity-50 bg-gray-50 rounded-lg focus:outline-none focus:bg-white transition duration-200"
                  placeholder="Enter password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="text-gray-500 hover:text-red-600 focus:outline-none transition duration-200"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Confirm Password Field - Only for Sign Up */}
            {!isLogin && (
              <div>
                <label className="block text-gray-800 text-sm font-medium mb-2" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-red-600" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 focus:border-red-600 focus:ring focus:ring-red-200 focus:ring-opacity-50 bg-gray-50 rounded-lg focus:outline-none focus:bg-white transition duration-200"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            )}

            {/* Forgot Password - Only for Login */}
            {isLogin && (
              <div className="flex justify-end">
                <a href="#" className="text-sm text-red-600 hover:text-red-700 transition font-medium">
                  Forgot your password?
                </a>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 font-medium transition duration-200 mt-6"
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500 font-medium"> or </span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-lg py-3 px-4 hover:bg-gray-50 transition duration-200 shadow-sm">
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09c1.97 3.92 6.02 6.62 10.71 6.62z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29v-3.09h-3.98c-.8 1.58-1.26 3.37-1.26 5.38s.46 3.8 1.26 5.38l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42c-2.07-1.94-4.78-3.13-8.02-3.13-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span className="font-medium">Continue with Google</span>
            </button>
            <button className="w-full flex items-center justify-center bg-blue-600 text-white rounded-lg py-3 px-4 hover:bg-blue-700 transition duration-200 shadow-sm">
              <svg className="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
              <span className="font-medium">Continue with Facebook</span>
            </button>
          </div>

          {/* Toggle between Login and Sign Up */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-red-600 hover:text-red-700 transition font-medium"
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer ref={footerRef} className="bg-black text-white pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} "In a world full of flavors, be the crunch. 🔥" — Frytopia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}