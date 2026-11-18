export const HARI_INDONESIA = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export const HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const BULAN_SINGKAT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toTimeString(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

export function combineDateAndTime(dateStr: string, timeStr?: string | null): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (timeStr && /^\d{2}:\d{2}$/.test(timeStr)) {
    const [hh, mm] = timeStr.split(':').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  }
  return new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999);
}

export function addDays(dateStr: string, days: number): string {
  const dt = parseDateString(dateStr);
  dt.setDate(dt.getDate() + days);
  return toDateString(dt);
}

export function addMonths(dateStr: string, months: number): string {
  const dt = parseDateString(dateStr);
  const originalDay = dt.getDate();
  dt.setMonth(dt.getMonth() + months);
  if (dt.getDate() !== originalDay) {
    dt.setDate(0);
  }
  return toDateString(dt);
}

export function addYears(dateStr: string, years: number): string {
  const dt = parseDateString(dateStr);
  dt.setFullYear(dt.getFullYear() + years);
  return toDateString(dt);
}

export function diffInDays(startDateStr: string, endDateStr: string): number {
  const s = parseDateString(startDateStr);
  const e = parseDateString(endDateStr);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((e.getTime() - s.getTime()) / msPerDay);
}

export function formatTanggalIndo(dateStr: string | null, singkat = false): string {
  if (!dateStr) return 'Tanpa tanggal';
  const dt = parseDateString(dateStr);
  const todayStr = toDateString(new Date());
  const tomorrowStr = addDays(todayStr, 1);
  const yesterdayStr = addDays(todayStr, -1);

  if (dateStr === todayStr) return 'Hari ini';
  if (dateStr === tomorrowStr) return 'Besok';
  if (dateStr === yesterdayStr) return 'Kemarin';

  const hari = singkat ? HARI_SINGKAT[dt.getDay()] : HARI_INDONESIA[dt.getDay()];
  const bulan = singkat ? BULAN_SINGKAT[dt.getMonth()] : BULAN_INDONESIA[dt.getMonth()];
  return `${hari}, ${dt.getDate()} ${bulan} ${dt.getFullYear()}`;
}

export function formatTanggalPendek(dateStr: string | null): string {
  if (!dateStr) return 'Someday';
  const todayStr = toDateString(new Date());
  const tomorrowStr = addDays(todayStr, 1);
  const yesterdayStr = addDays(todayStr, -1);

  if (dateStr === todayStr) return 'Hari ini';
  if (dateStr === tomorrowStr) return 'Besok';
  if (dateStr === yesterdayStr) return 'Kemarin';

  const dt = parseDateString(dateStr);
  return `${dt.getDate()} ${BULAN_SINGKAT[dt.getMonth()]}`;
}

export function getStartOfWeek(dateStr: string): string {
  const dt = parseDateString(dateStr);
  const day = dt.getDay(); // 0 Minggu .. 6 Sabtu
  // Mulai Senin
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return toDateString(dt);
}

export function getWeekDates(referenceDateStr: string): string[] {
  const monday = getStartOfWeek(referenceDateStr);
  return Array.from({ length: 7 }, (_, idx) => addDays(monday, idx));
}

export function getMonthCalendarGrid(year: number, monthZeroIndexed: number): {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
}[] {
  const firstDay = new Date(year, monthZeroIndexed, 1);
  const startDayOfWeek = firstDay.getDay(); // 0 = Sun
  const mondayOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const startGridDate = new Date(year, monthZeroIndexed, 1 - mondayOffset);
  const cells: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(
      startGridDate.getFullYear(),
      startGridDate.getMonth(),
      startGridDate.getDate() + i
    );
    cells.push({
      dateStr: toDateString(cellDate),
      dayNumber: cellDate.getDate(),
      isCurrentMonth: cellDate.getMonth() === monthZeroIndexed,
    });
  }
  return cells;
}

export function getGreetingByHour(date: Date = new Date()): {
  title: string;
  subtitle: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  catMood: string;
} {
  const h = date.getHours();
  if (h >= 5 && h < 11) {
    return {
      title: 'Selamat pagi! Miaw~',
      subtitle: 'Waktunya peregangan & mulai aktivitas hari ini.',
      period: 'morning',
      catMood: 'Stretching Cat',
    };
  }
  if (h >= 11 && h < 15) {
    return {
      title: 'Selamat siang! Miaw~',
      subtitle: 'Tetap fokus, satu per satu tugas pasti beres.',
      period: 'afternoon',
      catMood: 'Focused Cat',
    };
  }
  if (h >= 15 && h < 18) {
    return {
      title: 'Selamat sore! Miaw~',
      subtitle: 'Berikut ringkasan produktivitasmu hari ini.',
      period: 'evening',
      catMood: 'Cozy Cat',
    };
  }
  return {
    title: 'Selamat malam! Purr~',
    subtitle: 'Selesaikan sisa jadwal sebelum waktunya istirahat.',
    period: 'night',
    catMood: 'Sleepy Cat',
  };
}
