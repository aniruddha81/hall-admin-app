import { apiRequest } from '@/lib/api';
import { appendImageToFormData } from '@/lib/multipart';
import type {
  DueType,
  Expense,
  FinancePaymentMethod,
  Hall,
  MealPayment,
  Payment,
  StudentDue,
  StudentLedger,
} from '@/lib/types';

type RawStudentDue = {
  id: string;
  studentId: string;
  hall: StudentDue['hall'];
  type: StudentDue['dueType'];
  amount: number;
  status: StudentDue['dueStatus'];
  paidAt: string | null;
  createdAt: string;
  updatedAt?: string;
};

type RawPayment = {
  id: string;
  studentId?: string;
  hall: Payment['hall'];
  dueId: string | null;
  amount: number;
  method: Payment['method'];
  bankReceiptUrl?: string | null;
  receiptVerifiedAt?: string | null;
  receiptVerifiedBy?: string | null;
  createdAt: string;
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

function mapPayment(raw: RawPayment): Payment {
  return {
    id: raw.id,
    studentId: raw.studentId,
    hall: raw.hall,
    dueId: raw.dueId,
    amount: raw.amount,
    method: raw.method,
    bankReceiptUrl: raw.bankReceiptUrl,
    receiptVerifiedAt: raw.receiptVerifiedAt,
    receiptVerifiedBy: raw.receiptVerifiedBy,
    createdAt: raw.createdAt,
  };
}

export async function createDue(body: {
  studentId: string;
  hall: Hall;
  dueType: DueType;
  amount: number;
}) {
  const { data } = await apiRequest<RawStudentDue>('/finance/dues', {
    method: 'POST',
    body: {
      studentId: body.studentId,
      hall: body.hall,
      type: body.dueType,
      amount: body.amount,
    },
  });
  return { ...data, data: mapDue(data.data) };
}

export async function payDue(
  id: string,
  data: { method: FinancePaymentMethod; receiptImageUri?: string | null },
) {
  if (data.method === 'BANK') {
    if (!data.receiptImageUri) {
      throw new Error('Bank receipt image is required for BANK payments');
    }
    const formData = new FormData();
    formData.append('method', data.method);
    appendImageToFormData(formData, 'receiptImage', data.receiptImageUri);
    const { data: res } = await apiRequest<{ paymentId: string }>(`/finance/dues/pay/${id}`, {
      method: 'PATCH',
      formData,
    });
    return res;
  }

  const { data: res } = await apiRequest<{ paymentId: string }>(`/finance/dues/pay/${id}`, {
    method: 'PATCH',
    body: { method: data.method },
  });
  return res;
}

export async function createExpense(body: {
  hall: Hall;
  title: string;
  amount: number;
  category: string;
}) {
  const { data } = await apiRequest<Expense>('/finance/expense', { method: 'POST', body });
  return data;
}

export async function getExpenses(params?: { hall?: Hall; page?: number; limit?: number }) {
  const { data } = await apiRequest<{ expenses: Expense[] }>('/finance/expenses', { params });
  return data;
}

export async function getStudentLedger(studentId: string) {
  const { data } = await apiRequest<{
    student?: StudentLedger['student'];
    dues: RawStudentDue[];
    payments: RawPayment[];
    mealPayments: MealPayment[];
    summary?: StudentLedger['summary'];
  }>(`/finance/student/ledger/${studentId}`);

  const payload = data.data;
  return {
    ...data,
    data: {
      student: payload?.student,
      dues: (payload?.dues ?? []).map(mapDue),
      payments: (payload?.payments ?? []).map(mapPayment),
      mealPayments: payload?.mealPayments ?? [],
      summary: payload?.summary,
    } satisfies StudentLedger,
  };
}

export async function getMealPayments() {
  const { data } = await apiRequest<{ payments: MealPayment[] }>('/finance/meal-payments');
  return data;
}

export async function verifyPaymentReceipt(id: string) {
  const { data } = await apiRequest<{
    id: string;
    receiptVerifiedAt: string;
    receiptVerifiedBy: string;
  }>(`/finance/payments/${id}/verify-receipt`, { method: 'PATCH' });
  return data;
}

export async function verifyMealPaymentReceipt(id: string) {
  const { data } = await apiRequest<{
    id: string;
    receiptVerifiedAt: string;
    receiptVerifiedBy: string;
  }>(`/finance/meal-payment/${id}/verify-receipt`, { method: 'PATCH' });
  return data;
}
