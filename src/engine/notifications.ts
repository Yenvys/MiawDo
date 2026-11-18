import { Platform } from 'react-native';
import { ResolvedTaskItem } from '../types';
import { combineDateAndTime } from './dateUtils';

export const REMINDER_OFFSET_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Tanpa Pengingat', value: null },
  { label: 'Saat deadline', value: 0 },
  { label: '5 menit sebelum', value: 5 },
  { label: '10 menit sebelum', value: 10 },
  { label: '15 menit sebelum', value: 15 },
  { label: '30 menit sebelum', value: 30 },
  { label: '1 jam sebelum', value: 60 },
  { label: '1 hari sebelum', value: 1440 },
];

export const SNOOZE_PRESETS: { label: string; minutes: number }[] = [
  { label: 'Ingatkan lagi 5 menit', minutes: 5 },
  { label: 'Ingatkan lagi 10 menit', minutes: 10 },
  { label: 'Ingatkan lagi 15 menit', minutes: 15 },
  { label: 'Ingatkan lagi 30 menit', minutes: 30 },
  { label: 'Ingatkan lagi 1 jam', minutes: 60 },
];

let notificationsModule: any = null;

function getNotifications() {
  if (Platform.OS === 'web') return null;
  if (notificationsModule) return notificationsModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    notificationsModule = require('expo-notifications');
    return notificationsModule;
  } catch {
    return null;
  }
}

// Daftarkan handler di level modul agar siap seketika saat aplikasi boot
try {
  const initialNotifications = getNotifications();
  if (initialNotifications) {
    initialNotifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch {}

export async function ensureNotificationChannels() {
  const Notifications = getNotifications();
  if (!Notifications || Platform.OS !== 'android') return;

  try {
    // Saluran Notifikasi Utama: Pengingat Tugas & Deadline
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Pengingat Tugas',
      description: 'Notifikasi pengingat tenggat waktu dan jadwal tugas MiawDo',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D96B43',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });

    // Saluran Notifikasi Sekunder: Ringkasan Pagi (Daily Digest)
    await Notifications.setNotificationChannelAsync('daily-digest', {
      name: 'Ringkasan Pagi',
      description: 'Notifikasi motivasi dan ringkasan tugas harian setiap pagi',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 150, 150, 150],
      lightColor: '#D96B43',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  } catch (err) {
    console.warn('Gagal mendaftarkan notification channels:', err);
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Gagal meminta izin notifikasi:', err);
    return false;
  }
}

export async function initializeNotifications(
  onSnoozeFromNotification?: (instanceKey: string, minutes: number) => void,
  onRescheduleRequest?: (instanceKey: string) => void
) {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    // Handler Notifikasi ketika aplikasi sedang di foreground/background
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Pastikan channel Android dibuat sebelum request permission
    await ensureNotificationChannels();
    await requestNotificationPermissions();

    // Daftarkan tombol interaktif Snooze 5m, 15m, 1j, dan Jadwalkan Ulang
    await Notifications.setNotificationCategoryAsync('MIAWDO_TASK_REMINDER', [
      {
        identifier: 'SNOOZE_5M',
        buttonTitle: 'Tunda 5m',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'SNOOZE_15M',
        buttonTitle: 'Tunda 15m',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'SNOOZE_60M',
        buttonTitle: 'Tunda 1j',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'RESCHEDULE',
        buttonTitle: 'Jadwalkan Ulang',
        options: { opensAppToForeground: true },
      },
    ]);

    Notifications.addNotificationResponseReceivedListener((response: any) => {
      const actionId = response?.actionIdentifier;
      const data = response?.notification?.request?.content?.data || {};
      const instanceKey = data.instanceKey as string | undefined;
      if (!instanceKey) return;

      if (actionId === 'SNOOZE_5M') {
        onSnoozeFromNotification?.(instanceKey, 5);
      } else if (actionId === 'SNOOZE_15M') {
        onSnoozeFromNotification?.(instanceKey, 15);
      } else if (actionId === 'SNOOZE_60M') {
        onSnoozeFromNotification?.(instanceKey, 60);
      } else if (actionId === 'RESCHEDULE') {
        onRescheduleRequest?.(instanceKey);
      }
    });
  } catch (err) {
    console.warn('Inisialisasi notifikasi dilewati:', err);
  }
}

export async function cancelTaskReminderNotification(targetKey: string) {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      const data = notif.content?.data;
      if (
        data?.instanceKey === targetKey ||
        data?.taskId === targetKey ||
        notif.identifier === targetKey
      ) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (err) {
    console.warn('Gagal membatalkan notifikasi tugas:', err);
  }
}

export async function scheduleTaskReminderNotification(item: ResolvedTaskItem) {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    // Selalu batalkan jadwal lama untuk item ini sebelum menjadwalkan ulang
    await cancelTaskReminderNotification(item.instanceKey);

    if (item.status === 'completed' || item.status === 'cancelled') return;

    let triggerDate: Date | null = null;

    if (item.snoozedUntil) {
      const snoozeDt = new Date(item.snoozedUntil);
      if (snoozeDt.getTime() > Date.now()) {
        triggerDate = snoozeDt;
      }
    } else if (
      item.reminderOffsetMinutes !== null &&
      item.effectiveDate &&
      item.deadlineType !== 'none'
    ) {
      const baseTime = item.effectiveTime || '08:00';
      const deadlineDt = combineDateAndTime(item.effectiveDate, baseTime);
      const reminderMs =
        deadlineDt.getTime() - item.reminderOffsetMinutes * 60 * 1000;
      if (reminderMs > Date.now()) {
        triggerDate = new Date(reminderMs);
      }
    }

    if (!triggerDate) return;

    await ensureNotificationChannels();

    const timeStr = item.effectiveTime ? `Pukul ${item.effectiveTime}` : '';
    const bodyText = item.description
      ? timeStr
        ? `${item.description} · ${timeStr}`
        : item.description
      : timeStr || 'Waktunya menyelesaikan kegiatan!';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: item.title,
        body: bodyText,
        categoryIdentifier: 'MIAWDO_TASK_REMINDER',
        channelId: 'default',
        sound: 'default',
        color: '#D96B43',
        data: {
          instanceKey: item.instanceKey,
          taskId: item.taskId,
          type: 'TASK_REMINDER',
        },
      },
      trigger: {
        type: 'date',
        date: triggerDate,
        channelId: 'default',
      },
    });
  } catch (err) {
    console.warn('Gagal menjadwalkan notifikasi tugas:', err);
  }
}

export async function scheduleMorningDigestNotification(
  enabled: boolean,
  timeStr: string,
  todayActiveCount: number
) {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    // Batalkan jadwal digest lama
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (
        notif.content?.data?.type === 'MORNING_DIGEST' ||
        notif.identifier === 'MIAWDO_MORNING_DIGEST'
      ) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    if (!enabled) return;

    await ensureNotificationChannels();

    const [hh, mm] = (timeStr || '07:00').split(':').map(Number);
    const validHour = Number.isFinite(hh) && hh >= 0 && hh <= 23 ? hh : 7;
    const validMinute = Number.isFinite(mm) && mm >= 0 && mm <= 59 ? mm : 0;

    await Notifications.scheduleNotificationAsync({
      identifier: 'MIAWDO_MORNING_DIGEST',
      content: {
        title: 'Selamat Pagi! Miaw~',
        body:
          todayActiveCount > 0
            ? `Hari ini ada ${todayActiveCount} kegiatan yang menunggumu. Yuk cek progresmu!`
            : 'Hari ini belum ada jadwal kegiatan. Ketuk + untuk merencanakan harimu!',
        channelId: 'daily-digest',
        sound: 'default',
        color: '#D96B43',
        data: { type: 'MORNING_DIGEST' },
      },
      trigger: {
        type: 'daily',
        hour: validHour,
        minute: validMinute,
        channelId: 'daily-digest',
      },
    });
  } catch (err) {
    console.warn('Gagal menjadwalkan morning digest:', err);
  }
}

export async function syncAllTaskReminders(items: ResolvedTaskItem[]) {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    await ensureNotificationChannels();

    // Jadwalkan semua tugas aktif yang memiliki pengingat ke depan
    const nowMs = Date.now();
    for (const item of items) {
      if (item.status === 'completed' || item.status === 'cancelled') {
        continue;
      }

      let shouldSchedule = false;
      if (item.snoozedUntil && new Date(item.snoozedUntil).getTime() > nowMs) {
        shouldSchedule = true;
      } else if (
        item.reminderOffsetMinutes !== null &&
        item.effectiveDate &&
        item.deadlineType !== 'none'
      ) {
        const baseTime = item.effectiveTime || '08:00';
        const deadlineDt = combineDateAndTime(item.effectiveDate, baseTime);
        const reminderMs =
          deadlineDt.getTime() - item.reminderOffsetMinutes * 60 * 1000;
        if (reminderMs > nowMs) {
          shouldSchedule = true;
        }
      }

      if (shouldSchedule) {
        await scheduleTaskReminderNotification(item);
      }
    }
  } catch (err) {
    console.warn('Gagal sinkronisasi notifikasi:', err);
  }
}

export async function sendInstantTestNotification(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  try {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      return false;
    }

    await ensureNotificationChannels();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'MiawDo! Pengingat Aktif',
        body: 'Notifikasi dan suara pengingat tugasmu berjalan dengan sempurna.',
        categoryIdentifier: 'MIAWDO_TASK_REMINDER',
        channelId: 'default',
        sound: 'default',
        color: '#D96B43',
        data: { type: 'TEST_NOTIFICATION' },
      },
      trigger: null, // Segera muncul
    });
    return true;
  } catch (err) {
    console.warn('Gagal mengirim notifikasi tes:', err);
    return false;
  }
}
