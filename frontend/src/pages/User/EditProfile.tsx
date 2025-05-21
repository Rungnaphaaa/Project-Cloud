import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchUserById, updateUser, uploadProfileImage } from '../../api/userApi';
import type { User } from '../../interfaces/IUsers';
import {
    User as UserIcon,
    X,
    Menu,
    Star,
    Camera,
    Save,
    ChevronLeft,
    Trash2,
    Upload,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function EditProfile() {
    const { userID } = useParams();
    const navigate = useNavigate();
    const [_user, setUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const footerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const id = Number(userID);
                const data = await fetchUserById(id);
                setUser(data);
                setName(data.name || '');
                setEmail(data.email || '');
                setBio(data.bio || '');
                setProfileImage(data.profile_image_url || null);
                setPreviewImage(data.profile_image_url ? `${API}/${data.profile_image_url}` : null);
            } catch (err) {
                console.error('Failed to load user', err);
                setError('Failed to load user data. Please try again.');
            }
        };

        if (userID) {
            loadUser();
        }
    }, [userID]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processUploadedFile(file);
        }
    };

    const processUploadedFile = (file: File) => {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file');
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);
        setSelectedFile(file);
        setError(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            processUploadedFile(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const removeImage = () => {
        if (previewImage?.startsWith('blob:')) {
            URL.revokeObjectURL(previewImage);
        }
        setPreviewImage(null);
        setProfileImage(null);
        setSelectedFile(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (!name.trim()) throw new Error('Name is required');
            if (!email.trim()) throw new Error('Email is required');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) throw new Error('Please enter a valid email address');

            let profileImageUrl: string | null = profileImage;

            // Upload new image if selected
            if (selectedFile) {
                setIsUploading(true);
                const uploadResult = await uploadProfileImage(Number(userID), selectedFile);
                profileImageUrl = typeof uploadResult === 'string'
                    ? uploadResult
                    : (uploadResult as any).profile_image_url || null;
                setIsUploading(false);
            }

            const updatedUser = {
                name,
                email,
                bio,
                profile_image_url: profileImageUrl ?? undefined,
            };

            await updateUser(Number(userID), updatedUser);

            setSuccessMessage('Profile updated successfully!');
            setTimeout(() => {
                navigate(`/profile/${userID}`);
            }, 1500);
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Failed to update profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        return () => {
            if (previewImage?.startsWith('blob:')) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar - KFC Style */}
            <nav className="bg-black text-white shadow-lg sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:text-red-500 transition">
                                <span className="text-red-600 text-2xl">🍗</span>
                                <span>Frytopia</span>
                            </Link>
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
                            <a href="/frontend/favorites" className="px-3 py-2 rounded-md hover:bg-red-600 transition">Favorites</a>
                            <a href={`/frontend/profile/${userID}`} className="px-3 py-2 rounded-md bg-red-600 transition">Profile</a>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={toggleMobileMenu}
                                className="text-white focus:outline-none"
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-900">
                            <a href="/frontend/home" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition">Home</a>
                            <button
                                onClick={() => {
                                    footerRef.current?.scrollIntoView({ behavior: 'smooth' });
                                    setIsMobileMenuOpen(false);
                                }}
                                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition"
                            >
                                About
                            </button>
                            <a href="/frontend/favorites" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition">Favorites</a>
                            <a href={`/frontend/profile/${userID}`} className="block px-3 py-2 rounded-md text-base font-medium bg-red-600 transition">Profile</a>
                        </div>
                    </div>
                )}
            </nav>

            {/* Featured Banner - KFC Style */}
            <div className="bg-red-600 text-white py-3">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-center items-center gap-2">
                        <Star size={16} className="text-yellow-400" />
                        <p className="text-sm font-medium">Update your profile and stay legendary! 🍗</p>
                        <Star size={16} className="text-yellow-400" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Button */}
                <div className="mb-6">
                    <Link
                        to={`/frontend/profile/${userID}`}
                        className="inline-flex items-center gap-2 text-gray-700 hover:text-red-600 transition font-medium"
                    >
                        <ChevronLeft size={20} />
                        <span>Back to Profile</span>
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-red-700 to-red-500 h-24 relative">
                        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/30 to-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <h1 className="text-2xl font-bold text-white tracking-wide">Edit Your Profile</h1>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        {/* Notifications */}
                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg shadow-sm animate-fade-in">
                                <div className="flex items-start">
                                    <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                                    <p className="ml-3 text-sm">{error}</p>
                                </div>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg shadow-sm animate-fade-in">
                                <div className="flex items-start">
                                    <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
                                    <p className="ml-3 text-sm">{successMessage}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                                {/* Profile Image Upload Section */}
                                <div className="md:col-span-1">
                                    <div className="flex flex-col items-center">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Picture</h3>

                                        {/* Profile Image Container */}
                                        <div
                                            className={`w-40 h-40 rounded-full overflow-hidden border-4 ${isDragging ? 'border-red-400 bg-red-50' : 'border-red-100'} shadow-md mb-4 relative cursor-pointer transition-all duration-200`}
                                            onClick={triggerFileInput}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            {previewImage ? (
                                                <img
                                                    src={previewImage}
                                                    alt="Profile Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200 transition">
                                                    <UserIcon size={40} className="text-gray-400 mb-2" />
                                                    <p className="text-xs text-gray-500 text-center px-2">
                                                        Click or drop image here
                                                    </p>
                                                </div>
                                            )}

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-300">
                                                <div className="bg-white p-2 rounded-full shadow-lg">
                                                    <Camera size={24} className="text-red-600" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hidden File Input */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                        />

                                        {/* Image Actions */}
                                        <div className="flex flex-col gap-2 w-full">
                                            <button
                                                type="button"
                                                onClick={triggerFileInput}
                                                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2 shadow-sm"
                                                disabled={isUploading}
                                            >
                                                <Upload size={16} />
                                                <span>{isUploading ? 'Uploading...' : 'Choose Image'}</span>
                                            </button>

                                            {previewImage && (
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center justify-center gap-2"
                                                >
                                                    <Trash2 size={16} />
                                                    <span>Remove</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="mt-3 text-xs text-gray-500 text-center">
                                            <p>Recommended: Square image</p>
                                            <p>Maximum size: 5MB</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Personal Information</h3>

                                    <div className="space-y-6">
                                        {/* Name */}
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                                Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm transition-all"
                                                placeholder="Enter your name"
                                                required
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm transition-all"
                                                placeholder="Enter your email"
                                                required
                                            />
                                        </div>

                                        {/* Bio */}
                                        <div>
                                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                                                Bio
                                            </label>
                                            <textarea
                                                id="bio"
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                rows={5}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm transition-all resize-none"
                                                placeholder="Tell us about yourself and your favorite fried chicken recipes..."
                                            />
                                            <p className="mt-1 text-sm text-gray-500">
                                                {bio.length}/500 characters
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-end">
                                <Link
                                    to={`/profile/${userID}`}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition w-full sm:w-auto text-center flex items-center justify-center gap-2 font-medium shadow-sm"
                                >
                                    <X size={18} />
                                    <span>Cancel</span>
                                </Link>
                                            
                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className={`px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition w-full sm:w-auto flex items-center justify-center gap-2 font-medium shadow-md ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    <Save size={18} />
                                    <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer ref={footerRef} className="bg-black text-white pt-8 pb-6">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
                        <p>&copy; {new Date().getFullYear()} "Eat. Sleep. Fry. Repeat. 😎" — Frytopia.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}