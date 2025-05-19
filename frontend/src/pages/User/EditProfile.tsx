import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchUserById, updateUser, uploadProfileImage } from '../../api/userApi';
import type { User } from '../../interfaces/IUsers';
import { User as UserIcon, X, Menu, Star, Camera, Save, ChevronLeft } from 'lucide-react';

export default function EditProfile() {
    const { userID } = useParams();
    const navigate = useNavigate();
    const [, setUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [, setProfileImage] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const footerRef = useRef<HTMLDivElement>(null);
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
                setPreviewImage(data.profile_image_url || null);
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
            const previewUrl = URL.createObjectURL(file);
            setPreviewImage(previewUrl);
            setSelectedFile(file); // ยังไม่อัปโหลด แค่เก็บไว้ก่อน
        }
    };

    const removeImage = () => {
        const DEFAULT_IMAGE_URL = 'https://ih1.redbubble.net/image.5659062584.9025/st,small,507x507-pad,600x600,f8f8f8.jpg';
        setPreviewImage(DEFAULT_IMAGE_URL);
        setProfileImage(DEFAULT_IMAGE_URL);
        setUser(prev => prev ? { ...prev, profile_image_url: DEFAULT_IMAGE_URL } : prev);

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

            let profileImageUrl: string | null = previewImage;

            // ถ้ามีไฟล์ใหม่ ให้ upload ก่อน
            if (selectedFile) {
                setIsUploading(true);
                const uploadResult = await uploadProfileImage(Number(userID), selectedFile);
                profileImageUrl = typeof uploadResult === 'string'
                    ? uploadResult
                    : (uploadResult as any).profile_image_url || null;
            }

            const updatedUser = {
                name,
                email,
                bio,
                profile_image_url: profileImageUrl ?? undefined, // อัปเดตพร้อมรูป (ถ้ามี)
            };

            await updateUser(Number(userID), updatedUser);

            setSuccessMessage('Profile updated successfully!');
            setTimeout(() => {
                navigate(`/profile/${userID}`);
            }, 2000);
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Failed to update profile. Please try again.');
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
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
            {/* Navigation Bar */}
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

            {/* Hero Banner */}
            <div className="bg-black text-white py-4">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-center items-center gap-2">
                        <Star size={18} className="text-yellow-400" />
                        <p className="text-sm md:text-base font-medium">Update your Frytopia profile information</p>
                        <Star size={18} className="text-yellow-400" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
                    {/* Header */}
                    <div className="bg-red-600 py-4 px-6">
                        <div className="flex items-center">
                            <Link
                                to={`/profile/${userID}`}
                                className="flex items-center text-white hover:text-red-100 transition"
                            >
                                <ChevronLeft size={24} className="mr-1" />
                                <span className="font-medium">Back to Profile</span>
                            </Link>
                            <h1 className="text-xl font-bold text-white ml-6">Edit Profile</h1>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        {error && (
                            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <X size={20} className="mt-0.5" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-sm">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <Star size={20} className="mt-0.5" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm">{successMessage}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Profile Image Upload */}
                            <div className="mb-8 flex flex-col items-center">
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-red-100 shadow-md bg-gray-100 mb-4 relative group">
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Profile Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                            <UserIcon size={48} className="text-gray-400" />
                                        </div>
                                    )}

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                                        <label className="cursor-pointer p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition">
                                            <Camera size={24} />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                                disabled={isUploading}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">


                                    {previewImage && (
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition flex items-center gap-2 shadow-sm"
                                        >
                                            <X size={16} />
                                            <span>Remove Photo</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Form Fields */}
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 shadow-sm"
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 shadow-sm"
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
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 shadow-sm resize-none"
                                        placeholder="Tell us a bit about yourself and your favorite fried chicken..."
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="mt-8 flex flex-col sm:flex-row gap-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition w-full sm:w-auto flex items-center justify-center shadow-sm ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                                        }`}
                                >
                                    <Save size={18} className="mr-2" />
                                    {isSubmitting ? 'Updating...' : 'Save Changes'}
                                </button>

                                <Link
                                    to={`/profile/${userID}`}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition w-full sm:w-auto text-center shadow-sm"
                                >
                                    Cancel
                                </Link>
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