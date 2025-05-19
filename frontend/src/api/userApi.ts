import type { LoginRequest, LoginResponse, User } from "../interfaces/IUsers";

export const API = import.meta.env.VITE_API_URL;

export const fetchUsers = async () => {
  const res = await fetch(`${API}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export const fetchUserById = async (userId: number) => {
  const res = await fetch(`${API}/users/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
};

export const createUser = async (user: any) => {
  const res = await fetch(`${API}/users/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
};

export const updateUser = async (userId: number, user: Partial<User>) => {
  const res = await fetch(`${API}/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.error || 'Failed to update user');
  }

  return res.json();
};


export const deleteUser = async (userId: number) => {
  const res = await fetch(`${API}/users/${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return res.json();
};

export const loginUser = async (loginData: LoginRequest): Promise<LoginResponse> => {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(loginData),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Login failed');
  }

  return res.json();
};

export const uploadProfileImage = async (userId: number, file: File): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append('profile_image', file);

  const res = await fetch(`${API}/users/${userId}/upload-profile-image`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to upload profile image');
  }

  return res.json();
};
