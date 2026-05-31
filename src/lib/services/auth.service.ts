import { apiRequest, persistSessionFromResponse } from '@/lib/api';
import { appendImageToFormData } from '@/lib/multipart';
import type {
  AcademicDepartment,
  AcademicSession,
  AdminData,
  AdminLoginResponse,
  AdminRegisterResponse,
  ApiResponse,
  Hall,
  StaffRole,
} from '@/lib/types';

export async function adminLogin(data: { email: string; password: string }) {
  const { data: res, sessionId } = await apiRequest<AdminLoginResponse>('/auth/admin/login', {
    method: 'POST',
    body: data,
    skipAuth: true,
  });
  await persistSessionFromResponse(sessionId);
  return res;
}

export async function adminRegister(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  academicDepartment?: AcademicDepartment;
  hall: Hall;
  designation: StaffRole;
  phone: string;
}) {
  const { data: res } = await apiRequest<AdminRegisterResponse>('/auth/admin/register', {
    method: 'POST',
    body: data,
    skipAuth: true,
  });
  return res;
}

export async function logout() {
  const { data } = await apiRequest<object>('/auth/logout', { method: 'POST' });
  return data;
}

export async function logoutAll() {
  const { data } = await apiRequest<null>('/auth/logout-all', { method: 'POST' });
  return data;
}

export async function getAdminApplications() {
  const { data } = await apiRequest<{ applications: AdminData[] }>('/auth/admin/approve');
  return data;
}

export async function approveAdmin(adminApplicationId: string, status: string) {
  const { data } = await apiRequest<{ adminApplicationId: string; status: string }>(
    '/auth/admin/approve',
    { method: 'PATCH', body: { adminApplicationId, status } },
  );
  return data;
}

export async function getManagedAcademicSessions() {
  const { data } = await apiRequest<{ sessions: AcademicSession[] }>('/auth/sessions/manage');
  return data;
}

export async function createAcademicSession(body: { label: string }) {
  const { data } = await apiRequest<AcademicSession>('/auth/sessions', {
    method: 'POST',
    body,
  });
  return data;
}

export async function updateAcademicSession(
  sessionId: string,
  body: { label?: string; isActive?: boolean },
) {
  const { data } = await apiRequest<AcademicSession>(`/auth/sessions/${sessionId}`, {
    method: 'PATCH',
    body,
  });
  return data;
}

export async function getMyProfile() {
  const { data } = await apiRequest<{ profile: AdminData }>('/profile/me');
  return data;
}

export async function updateProfile(body: { name?: string; phone?: string }) {
  const { data } = await apiRequest<Record<string, string>>('/profile/update', {
    method: 'PATCH',
    body,
  });
  return data;
}

export async function changePassword(body: {
  currentPassword: string;
  newPassword: string;
}) {
  const { data } = await apiRequest<null>('/profile/change-password', {
    method: 'PATCH',
    body,
  });
  return data;
}

export async function uploadAvatar(imageUri: string) {
  const formData = new FormData();
  appendImageToFormData(formData, 'avatar', imageUri);
  const { data } = await apiRequest<{ avatarUrl: string }>('/profile/upload-image', {
    method: 'POST',
    formData,
  });
  return data;
}
