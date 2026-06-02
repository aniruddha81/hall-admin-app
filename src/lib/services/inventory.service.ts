import { apiRequest, type ApiFetchOptions } from '@/lib/api';
import type { DamageReport, DamageReportStatus, Hall, Room, RoomStatus } from '@/lib/types';

type RawRoom = {
  id: string;
  roomNumber: number;
  hall: Hall;
  capacity: number;
  currentOccupancy: number;
  status: RoomStatus;
  createdAt?: string;
  updatedAt?: string;
};

function mapRoom(raw: RawRoom): Room {
  return {
    id: raw.id,
    roomNumber: raw.roomNumber,
    hall: raw.hall,
    capacity: raw.capacity,
    currentOccupancy: raw.currentOccupancy,
    roomStatus: raw.status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export async function getRooms(
  params?: { hall?: Hall; status?: RoomStatus },
  fetchOptions?: ApiFetchOptions,
) {
  const { data } = await apiRequest<RawRoom[]>('/inventory/rooms', {
    params,
    signal: fetchOptions?.signal,
  });
  return {
    ...data,
    data: { rooms: (data.data ?? []).map(mapRoom) },
  };
}

export async function getDamageReports(
  params?: { status?: DamageReportStatus },
  fetchOptions?: ApiFetchOptions,
) {
  const { data } = await apiRequest<DamageReport[]>('/inventory/damage', {
    params,
    signal: fetchOptions?.signal,
  });
  return {
    ...data,
    data: { reports: data.data ?? [] },
  };
}

export async function verifyDamageReport(
  id: string,
  body: {
    isStudentResponsible: boolean;
    fineAmount?: number;
    damageCost?: number;
    managerNote?: string;
  },
) {
  const { data } = await apiRequest<{ report: DamageReport }>(`/inventory/damage/${id}/verify`, {
    method: 'PATCH',
    body,
  });
  return data;
}

export async function markDamageFixed(id: string) {
  const { data } = await apiRequest<{ report: DamageReport }>(`/inventory/damage/${id}/fix`, {
    method: 'PATCH',
  });
  return data;
}
