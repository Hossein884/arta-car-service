// تمام ارتباط با سرور (بک‌اند) از همین فایل انجام می‌شود

export const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

// اسم فارسی فیلدها برای نمایش پیام خطای قابل‌فهم
const FIELD_NAMES = {
  full_name: 'نام و نام خانوادگی',
  phone: 'شماره موبایل',
  national_code: 'کد ملی',
  plate_number: 'شماره پلاک',
  mileage: 'کیلومتر کارکرد',
  year: 'سال ساخت',
};

// تبدیل پاسخ خطای سرور به یک جمله‌ی فارسی
export function errorMessage(data, fallback = 'خطایی رخ داد. دوباره تلاش کنید.') {
  if (!data || !data.detail) return fallback;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {                       // خطای اعتبارسنجی (۴۲۲)
    const names = data.detail.map((d) => FIELD_NAMES[d.loc[d.loc.length - 1]] || 'ورودی');
    return `مقدار واردشده برای «${[...new Set(names)].join('، ')}» معتبر نیست.`;
  }
  return fallback;
}

// ارسال درخواست به سرور؛ در صورت خطا یک Error با پیام فارسی می‌اندازد
export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('ارتباط با سرور برقرار نشد. مطمئن شوید بک‌اند روشن است.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) throw new Error(errorMessage(data));
  return data;
}

export const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) });

// نمایش عدد با رقم فارسی و جداکننده‌ی هزارگان
export const formatNumber = (n) => Number(n).toLocaleString('fa-IR');
