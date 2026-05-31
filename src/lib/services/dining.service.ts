import { apiRequest } from '@/lib/api';
import type {
  ApiResponse,
  DailyReport,
  DiningDateRangeSalesReport,
  MealItem,
  MealMenu,
  MealPayment,
  MealToken,
  MealType,
  MonthlyReport,
} from '@/lib/types';

export async function createTomorrowMenu(data: {
  mealType: MealType;
  mealItemIds: string[];
  price: number;
  totalTokens: number;
}) {
  const { data: res } = await apiRequest<{ menu: MealMenu }>('/dining/menu/create', {
    method: 'POST',
    body: data,
  });
  return res;
}

export async function updateTomorrowMenu(
  menuId: string,
  data: { mealItemIds?: string[]; price?: number; totalTokens?: number },
) {
  const { data: res } = await apiRequest<{ menu: MealMenu }>(`/dining/menu/${menuId}/update`, {
    method: 'PATCH',
    body: data,
  });
  return res;
}

export async function deleteTomorrowMenu(menuId: string) {
  const { data } = await apiRequest<null>(`/dining/menu/${menuId}`, { method: 'DELETE' });
  return data;
}

async function normalizeMenusResponse(res: ApiResponse<Array<MealMenu & { menuId?: string }>>) {
  const rawMenus = Array.isArray(res.data)
    ? res.data
    : ((res.data as { menus?: Array<MealMenu & { menuId?: string }> } | undefined)?.menus ?? []);
  const menus = rawMenus.map((menu) => ({ ...menu, id: menu.id ?? menu.menuId! }));
  return { ...res, data: { menus } };
}

export async function getTomorrowMenusList() {
  const { data } = await apiRequest<Array<MealMenu & { menuId?: string }>>('/dining/menus/tomorrow');
  return normalizeMenusResponse(data);
}

export async function getTodayMenus() {
  const { data } = await apiRequest<Array<MealMenu & { menuId?: string }>>('/dining/menus/today');
  return normalizeMenusResponse(data);
}

export async function getMealItems() {
  const { data } = await apiRequest<{ items: MealItem[] }>('/dining/meal-items');
  return data;
}

export async function createMealItem(body: { name: string }) {
  const { data } = await apiRequest<{ id: string; name: string }>('/dining/meal-items', {
    method: 'POST',
    body,
  });
  return data;
}

export async function updateMealItem(
  itemId: string,
  body: { name?: string; isActive?: boolean },
) {
  const { data } = await apiRequest<{ id: string }>(`/dining/meal-items/${itemId}`, {
    method: 'PATCH',
    body,
  });
  return data;
}

export async function deleteMealItem(itemId: string) {
  const { data } = await apiRequest<{ id: string }>(`/dining/meal-items/${itemId}`, {
    method: 'DELETE',
  });
  return data;
}

export async function getAllBookingsForMenu(menuId: string) {
  const { data } = await apiRequest<{ bookings: MealToken[] }>(`/dining/bookings/menu/${menuId}`);
  return data;
}

export async function getTomorrowBookings() {
  const { data } = await apiRequest<{ bookings: MealToken[] }>('/dining/bookings/tomorrow');
  return data;
}

export async function markTokensAsConsumed(body: { tokenIds: string[] }) {
  const { data } = await apiRequest<{ updated: number }>('/dining/tokens/mark-consumed', {
    method: 'PATCH',
    body,
  });
  return data;
}

export async function getDailyReport(date: string) {
  const { data } = await apiRequest<DailyReport>('/dining/report/daily', { params: { date } });
  return data;
}

export async function getMonthlyReport(month: number, year: number) {
  const { data } = await apiRequest<MonthlyReport>('/dining/report/monthly', {
    params: { month, year },
  });
  return data;
}

export async function getDateRangeSalesReport(startDate: string, endDate: string) {
  const { data } = await apiRequest<DiningDateRangeSalesReport>('/dining/report/range', {
    params: { startDate, endDate },
  });
  return data;
}

export async function getPaymentDetails(paymentId: string) {
  const { data } = await apiRequest<{ payment: MealPayment }>(`/dining/payment/${paymentId}`);
  return data;
}

export async function processRefund(paymentId: string) {
  const { data } = await apiRequest<{ payment: MealPayment }>(
    `/dining/payment/${paymentId}/refund`,
    { method: 'POST' },
  );
  return data;
}
