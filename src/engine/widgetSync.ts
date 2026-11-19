import { NativeModules, Platform } from 'react-native';
import { ResolvedTaskItem, WorkflowStatus } from '../types';
import { toDateString } from './dateUtils';

const { MiawDoWidgetModule } = NativeModules;

export interface WidgetTaskItemPayload {
  taskId: string;
  instanceKey: string;
  title: string;
  status: WorkflowStatus;
  effectiveDate: string;
  effectiveTime: string;
  priority: string;
}

export interface WidgetPayload {
  isNight: boolean;
  dateLabel: string;
  completedCount: number;
  totalCount: number;
  tasksJson: string;
  catGreeting: string;
  catMascotFace: string;
  statusSub: string;
}

export interface PendingWidgetToggle {
  instanceKey: string;
  taskId: string;
  status: WorkflowStatus;
  timestamp: number;
}

export interface WidgetLaunchIntent {
  openAddTask: boolean;
  openTaskId: string | null;
  instanceKey: string | null;
}

const INDO_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const INDO_MONTHS = [
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

function formatWidgetDate(date: Date): string {
  const dayName = INDO_DAYS[date.getDay()];
  const dayNum = date.getDate();
  const monthName = INDO_MONTHS[date.getMonth()];
  return `${dayName}, ${dayNum} ${monthName}`;
}

/**
 * Sinkronkan data tugas hari ini dan tema aplikasi ke Native Home Screen Widget.
 * Berjalan instan dengan konsumsi memori minimal (< 2 KB) dan tanpa background battery drain.
 */
export async function syncWidgetWithAppData(
  resolvedItems: ResolvedTaskItem[],
  isNight: boolean
): Promise<boolean> {
  if (Platform.OS !== 'android' || !MiawDoWidgetModule) {
    return false;
  }

  try {
    const today = new Date();
    const todayStr = toDateString(today);
    const dateLabel = formatWidgetDate(today);

    // Ambil tugas yang aktif untuk hari ini (atau tanpa deadline dan belum beres)
    const todayItems = resolvedItems.filter((item) => {
      if (item.status === 'cancelled') return false;
      if (item.effectiveDate === todayStr) return true;
      if (!item.effectiveDate && item.status !== 'completed') return true;
      return false;
    });

    // Urutkan: tugas belum beres terlebih dahulu, lalu berdasarkan jam dan prioritas
    const priorityWeight: Record<string, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    todayItems.sort((a, b) => {
      // 1. Yang belum selesai di atas
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      if (a.status === 'completed' && b.status !== 'completed') return 1;

      // 2. Berdasarkan jam pengerjaan jika ada
      if (a.effectiveTime && b.effectiveTime) {
        if (a.effectiveTime !== b.effectiveTime) {
          return a.effectiveTime.localeCompare(b.effectiveTime);
        }
      } else if (a.effectiveTime && !b.effectiveTime) {
        return -1;
      } else if (!a.effectiveTime && b.effectiveTime) {
        return 1;
      }

      // 3. Prioritas tinggi di atas
      const weightA = priorityWeight[a.priority] || 2;
      const weightB = priorityWeight[b.priority] || 2;
      return weightB - weightA;
    });

    const completedCount = todayItems.filter(
      (i) => i.status === 'completed'
    ).length;
    const totalCount = todayItems.length;

    let catMascotFace = '/ᐠ - ˕ -マ ᶻ 𝗓 𐰁';
    let statusSub = 'Belum ada agenda hari ini';
    let catGreeting = '𑄝੭ Hari santai! Nikmati harimu dengan tenang.';

    if (totalCount > 0) {
      if (completedCount === totalCount) {
        catMascotFace = '/ᐠ - ˕ -マ ᶻ 𝗓 𐰁';
        statusSub = 'Semua tugas hari ini beres!';
        catGreeting = '𑄝੭ Hebat sekali, semua tugas hari ini selesai!';
      } else {
        const remaining = totalCount - completedCount;
        catMascotFace = '( ^ . ^ )';
        statusSub =
          remaining === 1 ? 'Sisa 1 tugas lagi!' : `Sisa ${remaining} tugas lagi!`;
        catGreeting =
          remaining === 1
            ? '𑄝੭ Tinggal 1 tugas lagi, kamu pasti bisa!'
            : `𑄝੭ ${remaining} tugas lagi hari ini. Semangat!`;
      }
    }

    const tasksPayload: WidgetTaskItemPayload[] = todayItems.map((item) => ({
      taskId: item.taskId,
      instanceKey: item.instanceKey,
      title: item.title,
      status: item.status,
      effectiveDate: item.effectiveDate || '',
      effectiveTime: item.effectiveTime || '',
      priority: item.priority || 'medium',
    }));

    const payload: WidgetPayload = {
      isNight,
      dateLabel,
      completedCount,
      totalCount,
      tasksJson: JSON.stringify(tasksPayload),
      catGreeting,
      catMascotFace,
      statusSub,
    };

    await MiawDoWidgetModule.updateWidgetData(JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('Gagal sinkronisasi widget MiawDo:', err);
    return false;
  }
}

/**
 * Membaca dan menerapkan aksi toggle checkbox yang dieksekusi dari widget di layar beranda.
 */
export async function syncPendingWidgetActions(
  setItemStatus: (instanceKey: string, status: WorkflowStatus) => void
): Promise<number> {
  if (Platform.OS !== 'android' || !MiawDoWidgetModule) {
    return 0;
  }

  try {
    const rawPending = await MiawDoWidgetModule.getPendingWidgetActions();
    if (!rawPending || rawPending === '[]') return 0;

    const pendingActions: PendingWidgetToggle[] = JSON.parse(rawPending);
    if (!Array.isArray(pendingActions) || pendingActions.length === 0) return 0;

    for (const action of pendingActions) {
      const key = action.instanceKey || action.taskId;
      if (key && action.status) {
        setItemStatus(key, action.status);
      }
    }

    await MiawDoWidgetModule.clearPendingWidgetActions();
    return pendingActions.length;
  } catch (err) {
    console.warn('Gagal memproses aksi pending widget:', err);
    return 0;
  }
}

/**
 * Cek apakah aplikasi dibuka karena pengguna mengetuk tombol Tambah (+) atau item tugas di widget.
 */
export async function checkWidgetLaunchIntent(): Promise<WidgetLaunchIntent | null> {
  if (Platform.OS !== 'android' || !MiawDoWidgetModule) {
    return null;
  }

  try {
    const launchData: WidgetLaunchIntent =
      await MiawDoWidgetModule.getInitialWidgetLaunch();
    if (launchData && (launchData.openAddTask || launchData.openTaskId)) {
      return launchData;
    }
    return null;
  } catch (err) {
    console.warn('Gagal memeriksa intent peluncuran widget:', err);
    return null;
  }
}
