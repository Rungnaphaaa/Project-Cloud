import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';

interface EditProfileButtonProps {
  userID: string;
}

export default function EditProfileButton({ userID }: EditProfileButtonProps) {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/edit/profile/${userID}`);
  };

  return (
    <button
      onClick={handleEdit}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg hover:from-red-600 hover:to-red-800 transition duration-300 shadow-md font-medium"
    >
      <Pencil size={16} />
      <span>Edit Profile</span>
    </button>
  );
}
