import { apiRequest, type ApiFetchOptions } from "@/lib/api";
import type {
  Pagination,
  SeatAllocation,
  SeatApplication,
  SeatApplicationStatus,
  StudentDue,
} from "@/lib/types";

type RawStudentDue = {
  id: string;
  studentId: string;
  hall: StudentDue["hall"];
  type: StudentDue["dueType"];
  amount: number;
  status: StudentDue["dueStatus"];
  paidAt: string | null;
  createdAt: string;
  updatedAt?: string;
};

type RawSeatApplication = Omit<SeatApplication, "seatCharge"> & {
  seatCharge?: RawStudentDue | null;
};

function mapDue(raw: RawStudentDue): StudentDue {
  return {
    id: raw.id,
    studentId: raw.studentId,
    dueType: raw.type,
    hall: raw.hall,
    amount: raw.amount,
    dueStatus: raw.status,
    paidAt: raw.paidAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapApplication(raw: RawSeatApplication): SeatApplication {
  return {
    ...raw,
    seatCharge: raw.seatCharge ? mapDue(raw.seatCharge) : null,
  };
}

export async function getApplications(
  params?: {
    status?: SeatApplicationStatus;
    hall?: string;
    page?: number;
    limit?: number;
  },
  fetchOptions?: ApiFetchOptions,
) {
  const { data } = await apiRequest<{
    applications: RawSeatApplication[];
    pagination: Pagination;
  }>("/admission/applications", { params, signal: fetchOptions?.signal });

  return {
    ...data,
    data: {
      applications: (data.data?.applications ?? []).map(mapApplication),
      pagination: data.data?.pagination,
    },
  };
}

export async function reviewApplication(
  id: string,
  body: { status: Extract<SeatApplicationStatus, "APPROVED" | "REJECTED"> },
) {
  const { data } = await apiRequest<{ application: SeatApplication }>(
    `/admission/review/${id}/`,
    { method: "PATCH", body },
  );
  return data;
}

export async function getAvailableRooms(
  params?: { hall?: string },
  fetchOptions?: ApiFetchOptions,
) {
  const { data } = await apiRequest<{
    halls: string[];
    rooms: Array<{
      id: string;
      roomNumber: number;
      hall: string;
      capacity: number;
      currentOccupancy: number;
      status: string;
    }>;
  }>("/admission/available-rooms", { params, signal: fetchOptions?.signal });
  return data;
}

export async function createSeatCharge(
  applicationId: string,
  body: { amount: number; hall: string },
) {
  const { data } = await apiRequest<StudentDue>(
    `/admission/applications/${applicationId}/seat-charge`,
    { method: "POST", body },
  );
  return data;
}

export async function allocateSeat(body: {
  applicationId: string;
  roomId: string;
}) {
  const { data } = await apiRequest<{ allocation: SeatAllocation }>(
    "/admission/allocate",
    {
      method: "POST",
      body,
    },
  );
  return data;
}
