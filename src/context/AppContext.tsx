import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AppSettings,
  Category,
  DeadlineType,
  Priority,
  RecurrenceRule,
  ResolvedTaskItem,
  Subtask,
  Task,
  TaskOccurrence,
  WorkflowStatus,
} from '../types';
import {
  loadDatabaseSnapshot,
  persistCategoryDelete,
  persistCategoryUpsert,
  persistOccurrenceUpsert,
  persistSettingsUpdate,
  persistTaskDelete,
  persistTaskUpsert,
} from '../db/storage';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../db/seed';
import { addDays, toDateString } from '../engine/dateUtils';
import {
  generateOccurrenceDates,
  resolveAllTaskItems,
  resolveRecurringOccurrenceItem,
  resolveSingleTaskItem,
} from '../engine/recurrence';
import { sortResolvedTasks } from '../engine/status';
import {
  cancelTaskReminderNotification,
  initializeNotifications,
  scheduleMorningDigestNotification,
  scheduleTaskReminderNotification,
  sendInstantTestNotification,
  syncAllTaskReminders,
} from '../engine/notifications';

export interface TaskFormPayload {
  id?: string;
  title: string;
  description: string;
  categoryId: string;
  priority: Priority;
  deadlineType: DeadlineType;
  deadlineDate: string | null;
  deadlineTime: string | null;
  status?: WorkflowStatus;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  reminderOffsetMinutes: number | null;
  subtaskTitles: { id?: string; title: string; isCompleted?: boolean }[];
}

interface AppContextValue {
  isReady: boolean;
  categories: Category[];
  tasks: Task[];
  occurrences: TaskOccurrence[];
  resolvedItems: ResolvedTaskItem[];
  settings: AppSettings;
  lastFeedbackMessage: string | null;
  clearFeedbackMessage: () => void;
  showFeedback: (msg: string) => void;
  saveTask: (payload: TaskFormPayload) => void;
  deleteTask: (taskId: string) => void;
  setItemStatus: (instanceKey: string, status: WorkflowStatus) => void;
  toggleItemCompleted: (instanceKey: string) => void;
  toggleSubtask: (instanceKey: string, subtaskId: string) => void;
  snoozeItem: (instanceKey: string, minutes: number) => void;
  rescheduleItem: (
    instanceKey: string,
    newDate: string,
    newTime: string | null
  ) => void;
  saveCategory: (payload: {
    id?: string;
    name: string;
    color: string;
    icon: string;
  }) => void;
  removeCategory: (categoryId: string) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  getItemsForDate: (dateStr: string) => ResolvedTaskItem[];
  loadSampleTasks: () => void;
  sendTestNotification: () => Promise<boolean>;
}

const AppContext = createContext<AppContextValue | null>(null);

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [occurrences, setOccurrences] = useState<TaskOccurrence[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [nowTick, setNowTick] = useState<Date>(() => new Date());
  const [lastFeedbackMessage, setLastFeedbackMessage] = useState<string | null>(
    null
  );

  const showFeedback = useCallback((msg: string) => {
    setLastFeedbackMessage(msg);
  }, []);

  const clearFeedbackMessage = useCallback(() => {
    setLastFeedbackMessage(null);
  }, []);

  useEffect(() => {
    const snap = loadDatabaseSnapshot();
    setCategories(snap.categories);
    setTasks(snap.tasks);
    setOccurrences(snap.occurrences);
    setSettings(snap.settings);
    setIsReady(true);
  }, []);

  // Evaluasi ulang status waktu (Overdue / Today) setiap 30 detik secara otomatis
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(new Date());
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  const resolvedItems = useMemo(() => {
    const todayStr = toDateString(nowTick);
    const windowStart = addDays(todayStr, -45);
    const windowEnd = addDays(todayStr, 90);
    const items = resolveAllTaskItems(
      tasks,
      occurrences,
      windowStart,
      windowEnd,
      nowTick
    );
    return sortResolvedTasks(items);
  }, [tasks, occurrences, nowTick]);

  // Materialize otomatis untuk jadwal recurring yang sudah lewat agar tercatat permanen di tabel occurrences
  useEffect(() => {
    if (!isReady) return;
    const todayStr = toDateString(nowTick);
    const lookbackStart = addDays(todayStr, -14);
    const existingKeys = new Set(
      occurrences.map((o) => `${o.taskId}__${o.scheduledDate}`)
    );

    const newOccurrences: TaskOccurrence[] = [];
    for (const task of tasks) {
      if (!task.isRecurring || !task.recurrenceRule) continue;
      const anchor = task.deadlineDate || toDateString(new Date(task.createdAt));
      if (anchor >= todayStr) continue;
      const start = anchor > lookbackStart ? anchor : lookbackStart;
      const dates = generateOccurrenceDates(
        anchor,
        task.recurrenceRule,
        start,
        todayStr
      );
      for (const dt of dates) {
        if (dt < todayStr && !existingKeys.has(`${task.id}__${dt}`)) {
          newOccurrences.push({
            id: makeId('occ'),
            taskId: task.id,
            scheduledDate: dt,
            scheduledTime: task.deadlineTime,
            status: 'todo',
            snoozedUntil: null,
            completedAt: null,
            subtaskStates: {},
          });
        }
      }
    }

    if (newOccurrences.length > 0) {
      const updatedOccs = [...occurrences, ...newOccurrences];
      setOccurrences(updatedOccs);
      const snap = { categories, tasks, occurrences: updatedOccs, settings };
      for (const occ of newOccurrences) {
        persistOccurrenceUpsert(occ, snap);
      }
    }
  }, [isReady, tasks, occurrences, categories, settings, nowTick]);

  const snoozeItem = useCallback(
    (instanceKey: string, minutes: number) => {
      const snoozeIso = new Date(Date.now() + minutes * 60_000).toISOString();
      if (instanceKey.includes('__')) {
        const [taskId, scheduledDate] = instanceKey.split('__');
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;
        const existing = occurrences.find(
          (o) => o.taskId === taskId && o.scheduledDate === scheduledDate
        );
        const updatedOcc: TaskOccurrence = existing
          ? { ...existing, snoozedUntil: snoozeIso }
          : {
              id: makeId('occ'),
              taskId,
              scheduledDate,
              scheduledTime: task.deadlineTime,
              status: 'todo',
              snoozedUntil: snoozeIso,
              completedAt: null,
              subtaskStates: {},
            };
        const nextOccs = existing
          ? occurrences.map((o) => (o.id === existing.id ? updatedOcc : o))
          : [...occurrences, updatedOcc];
        setOccurrences(nextOccs);
        persistOccurrenceUpsert(updatedOcc, {
          categories,
          tasks,
          occurrences: nextOccs,
          settings,
        });
        const resolved = resolveRecurringOccurrenceItem(
          task,
          scheduledDate,
          updatedOcc
        );
        scheduleTaskReminderNotification(resolved);
      } else {
        const target = tasks.find((t) => t.id === instanceKey);
        if (!target) return;
        const updatedTask: Task = {
          ...target,
          snoozedUntil: snoozeIso,
          updatedAt: new Date().toISOString(),
        };
        const nextTasks = tasks.map((t) =>
          t.id === target.id ? updatedTask : t
        );
        setTasks(nextTasks);
        persistTaskUpsert(updatedTask, {
          categories,
          tasks: nextTasks,
          occurrences,
          settings,
        });
        scheduleTaskReminderNotification(resolveSingleTaskItem(updatedTask));
      }
      showFeedback(`Miaw! Pengingat ditunda ${minutes} menit.`);
    },
    [tasks, occurrences, categories, settings, showFeedback]
  );

  useEffect(() => {
    initializeNotifications((instanceKey, mins) => {
      snoozeItem(instanceKey, mins);
    });
  }, [snoozeItem]);

  useEffect(() => {
    if (!isReady) return;
    syncAllTaskReminders(resolvedItems);
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;
    const todayStr = toDateString(new Date());
    const todayActive = resolvedItems.filter(
      (i) =>
        i.effectiveDate === todayStr &&
        i.status !== 'completed' &&
        i.status !== 'cancelled'
    ).length;
    scheduleMorningDigestNotification(
      settings.morningDigestEnabled,
      settings.morningDigestTime,
      todayActive
    );
  }, [
    isReady,
    settings.morningDigestEnabled,
    settings.morningDigestTime,
    resolvedItems,
  ]);

  const saveTask = useCallback(
    (payload: TaskFormPayload) => {
      const nowIso = new Date().toISOString();
      const existing = payload.id
        ? tasks.find((t) => t.id === payload.id)
        : undefined;
      const taskId = existing ? existing.id : makeId('task');

      const subtasks: Subtask[] = payload.subtaskTitles
        .map((st, idx) => ({
          id: st.id || makeId('sub'),
          taskId,
          title: st.title.trim(),
          isCompleted: Boolean(st.isCompleted),
          sortOrder: idx + 1,
        }))
        .filter((st) => st.title.length > 0);

      let initialStatus: WorkflowStatus =
        payload.status || existing?.status || 'todo';

      if (!payload.isRecurring && subtasks.length > 0) {
        const doneCount = subtasks.filter((s) => s.isCompleted).length;
        if (doneCount === subtasks.length) {
          initialStatus = 'completed';
        } else if (doneCount > 0 && initialStatus === 'todo') {
          initialStatus = 'in_progress';
        }
      }

      const taskObj: Task = {
        id: taskId,
        title: payload.title.trim(),
        description: payload.description.trim(),
        categoryId: payload.categoryId || categories[0]?.id || 'cat-pribadi',
        priority: payload.priority,
        deadlineType: payload.deadlineType,
        deadlineDate:
          payload.deadlineType === 'none' ? null : payload.deadlineDate,
        deadlineTime:
          payload.deadlineType === 'datetime' ? payload.deadlineTime : null,
        status: initialStatus,
        isRecurring: payload.isRecurring,
        recurrenceRule: payload.isRecurring ? payload.recurrenceRule : null,
        reminderOffsetMinutes: payload.reminderOffsetMinutes,
        snoozedUntil: existing?.snoozedUntil ?? null,
        completedAt:
          initialStatus === 'completed'
            ? existing?.completedAt || nowIso
            : null,
        createdAt: existing?.createdAt || nowIso,
        updatedAt: nowIso,
        subtasks,
      };

      const nextTasks = existing
        ? tasks.map((t) => (t.id === taskId ? taskObj : t))
        : [taskObj, ...tasks];

      setTasks(nextTasks);
      persistTaskUpsert(taskObj, {
        categories,
        tasks: nextTasks,
        occurrences,
        settings,
      });

      if (!taskObj.isRecurring) {
        scheduleTaskReminderNotification(resolveSingleTaskItem(taskObj));
      } else {
        const upcomingItems = resolveAllTaskItems(
          [taskObj],
          occurrences,
          toDateString(new Date()),
          addDays(toDateString(new Date()), 30)
        );
        const nextUpcoming = upcomingItems.find(
          (i) => i.status !== 'completed' && i.status !== 'cancelled'
        );
        if (nextUpcoming) {
          scheduleTaskReminderNotification(nextUpcoming);
        }
      }
      showFeedback(
        existing ? 'Kegiatan berhasil diperbarui!' : 'Miaw! Kegiatan baru ditambahkan.'
      );
    },
    [tasks, categories, occurrences, settings, showFeedback]
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      cancelTaskReminderNotification(taskId);
      const nextTasks = tasks.filter((t) => t.id !== taskId);
      const nextOccs = occurrences.filter((o) => o.taskId !== taskId);
      setTasks(nextTasks);
      setOccurrences(nextOccs);
      persistTaskDelete(taskId, {
        categories,
        tasks: nextTasks,
        occurrences: nextOccs,
        settings,
      });
      showFeedback('Kegiatan dihapus.');
    },
    [tasks, occurrences, categories, settings, showFeedback]
  );

  const setItemStatus = useCallback(
    (instanceKey: string, nextStatus: WorkflowStatus) => {
      const nowIso = new Date().toISOString();

      if (instanceKey.includes('__')) {
        const [taskId, scheduledDate] = instanceKey.split('__');
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const existing = occurrences.find(
          (o) => o.taskId === taskId && o.scheduledDate === scheduledDate
        );

        const nextSubtaskStates: Record<string, boolean> = {
          ...(existing?.subtaskStates || {}),
        };
        if (nextStatus === 'completed') {
          for (const st of task.subtasks) {
            nextSubtaskStates[st.id] = true;
          }
        }

        const updatedOcc: TaskOccurrence = {
          id: existing?.id || makeId('occ'),
          taskId,
          scheduledDate,
          scheduledTime: existing?.scheduledTime ?? task.deadlineTime,
          status: nextStatus,
          snoozedUntil:
            nextStatus === 'completed' ? null : existing?.snoozedUntil ?? null,
          completedAt: nextStatus === 'completed' ? nowIso : null,
          subtaskStates: nextSubtaskStates,
        };

        const nextOccs = existing
          ? occurrences.map((o) => (o.id === existing.id ? updatedOcc : o))
          : [...occurrences, updatedOcc];

        setOccurrences(nextOccs);
        persistOccurrenceUpsert(updatedOcc, {
          categories,
          tasks,
          occurrences: nextOccs,
          settings,
        });
      } else {
        const target = tasks.find((t) => t.id === instanceKey);
        if (!target) return;

        const updatedSubtasks =
          nextStatus === 'completed'
            ? target.subtasks.map((st) => ({ ...st, isCompleted: true }))
            : target.subtasks;

        const updatedTask: Task = {
          ...target,
          status: nextStatus,
          subtasks: updatedSubtasks,
          snoozedUntil: nextStatus === 'completed' ? null : target.snoozedUntil,
          completedAt: nextStatus === 'completed' ? nowIso : null,
          updatedAt: nowIso,
        };

        const nextTasks = tasks.map((t) =>
          t.id === target.id ? updatedTask : t
        );
        setTasks(nextTasks);
        persistTaskUpsert(updatedTask, {
          categories,
          tasks: nextTasks,
          occurrences,
          settings,
        });
      }

      if (nextStatus === 'completed' || nextStatus === 'cancelled') {
        cancelTaskReminderNotification(instanceKey);
        showFeedback('Miaw! Tugas selesai dikerjakan.');
      } else {
        const item = resolvedItems.find((i) => i.instanceKey === instanceKey);
        if (item) {
          scheduleTaskReminderNotification({ ...item, status: nextStatus });
        }
      }
    },
    [tasks, occurrences, categories, settings, resolvedItems, showFeedback]
  );

  const toggleItemCompleted = useCallback(
    (instanceKey: string) => {
      const item = resolvedItems.find((i) => i.instanceKey === instanceKey);
      if (!item) return;
      const nextStatus: WorkflowStatus =
        item.status === 'completed' ? 'todo' : 'completed';
      setItemStatus(instanceKey, nextStatus);
    },
    [resolvedItems, setItemStatus]
  );

  const toggleSubtask = useCallback(
    (instanceKey: string, subtaskId: string) => {
      const nowIso = new Date().toISOString();

      if (instanceKey.includes('__')) {
        const [taskId, scheduledDate] = instanceKey.split('__');
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const existing = occurrences.find(
          (o) => o.taskId === taskId && o.scheduledDate === scheduledDate
        );
        const currentStates = { ...(existing?.subtaskStates || {}) };
        currentStates[subtaskId] = !currentStates[subtaskId];

        const total = task.subtasks.length;
        const doneCount = task.subtasks.filter(
          (st) => currentStates[st.id]
        ).length;

        let nextStatus: WorkflowStatus = existing?.status || 'todo';
        if (total > 0 && doneCount === total) {
          nextStatus = 'completed';
          showFeedback('Miaw! Semua subtask beres, tugas ditandai Completed!');
        } else if (doneCount > 0) {
          nextStatus = 'in_progress';
        } else if (nextStatus === 'completed') {
          nextStatus = 'todo';
        }

        const updatedOcc: TaskOccurrence = {
          id: existing?.id || makeId('occ'),
          taskId,
          scheduledDate,
          scheduledTime: existing?.scheduledTime ?? task.deadlineTime,
          status: nextStatus,
          snoozedUntil: existing?.snoozedUntil ?? null,
          completedAt: nextStatus === 'completed' ? nowIso : null,
          subtaskStates: currentStates,
        };

        const nextOccs = existing
          ? occurrences.map((o) => (o.id === existing.id ? updatedOcc : o))
          : [...occurrences, updatedOcc];

        setOccurrences(nextOccs);
        persistOccurrenceUpsert(updatedOcc, {
          categories,
          tasks,
          occurrences: nextOccs,
          settings,
        });
      } else {
        const target = tasks.find((t) => t.id === instanceKey);
        if (!target) return;

        const nextSubtasks = target.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
        );

        const total = nextSubtasks.length;
        const doneCount = nextSubtasks.filter((s) => s.isCompleted).length;

        let nextStatus: WorkflowStatus = target.status;
        if (total > 0 && doneCount === total) {
          nextStatus = 'completed';
          showFeedback('Miaw! Semua subtask beres, tugas ditandai Completed!');
        } else if (doneCount > 0) {
          nextStatus = 'in_progress';
        } else if (nextStatus === 'completed') {
          nextStatus = 'todo';
        }

        const updatedTask: Task = {
          ...target,
          status: nextStatus,
          subtasks: nextSubtasks,
          completedAt: nextStatus === 'completed' ? nowIso : null,
          updatedAt: nowIso,
        };

        const nextTasks = tasks.map((t) =>
          t.id === target.id ? updatedTask : t
        );
        setTasks(nextTasks);
        persistTaskUpsert(updatedTask, {
          categories,
          tasks: nextTasks,
          occurrences,
          settings,
        });
      }
    },
    [tasks, occurrences, categories, settings, showFeedback]
  );

  const rescheduleItem = useCallback(
    (instanceKey: string, newDate: string, newTime: string | null) => {
      const nowIso = new Date().toISOString();
      if (instanceKey.includes('__')) {
        const [taskId, scheduledDate] = instanceKey.split('__');
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;
        const existing = occurrences.find(
          (o) => o.taskId === taskId && o.scheduledDate === scheduledDate
        );
        const updatedOcc: TaskOccurrence = {
          id: existing?.id || makeId('occ'),
          taskId,
          scheduledDate: newDate,
          scheduledTime: newTime,
          status: existing?.status === 'cancelled' ? 'todo' : existing?.status || 'todo',
          snoozedUntil: null,
          completedAt: existing?.completedAt ?? null,
          subtaskStates: existing?.subtaskStates || {},
        };
        const nextOccs = existing
          ? occurrences.map((o) => (o.id === existing.id ? updatedOcc : o))
          : [...occurrences, updatedOcc];
        setOccurrences(nextOccs);
        persistOccurrenceUpsert(updatedOcc, {
          categories,
          tasks,
          occurrences: nextOccs,
          settings,
        });
      } else {
        const target = tasks.find((t) => t.id === instanceKey);
        if (!target) return;
        const updatedTask: Task = {
          ...target,
          deadlineType: newTime ? 'datetime' : 'date_only',
          deadlineDate: newDate,
          deadlineTime: newTime,
          snoozedUntil: null,
          updatedAt: nowIso,
        };
        const nextTasks = tasks.map((t) =>
          t.id === target.id ? updatedTask : t
        );
        setTasks(nextTasks);
        persistTaskUpsert(updatedTask, {
          categories,
          tasks: nextTasks,
          occurrences,
          settings,
        });
      }
      showFeedback(`Jadwal dipindahkan ke ${newDate}${newTime ? ` ${newTime}` : ''}.`);
    },
    [tasks, occurrences, categories, settings, showFeedback]
  );

  const saveCategory = useCallback(
    (payload: { id?: string; name: string; color: string; icon: string }) => {
      const existing = payload.id
        ? categories.find((c) => c.id === payload.id)
        : undefined;
      const cat: Category = {
        id: existing?.id || makeId('cat'),
        name: payload.name.trim(),
        color: payload.color,
        icon: payload.icon,
        isDefault: existing?.isDefault ?? false,
        sortOrder: existing?.sortOrder ?? categories.length + 1,
      };
      const nextCats = existing
        ? categories.map((c) => (c.id === cat.id ? cat : c))
        : [...categories, cat];
      setCategories(nextCats);
      persistCategoryUpsert(cat, {
        categories: nextCats,
        tasks,
        occurrences,
        settings,
      });
      showFeedback('Kategori disimpan!');
    },
    [categories, tasks, occurrences, settings, showFeedback]
  );

  const removeCategory = useCallback(
    (categoryId: string) => {
      const target = categories.find((c) => c.id === categoryId);
      if (!target || target.isDefault) return;
      const nextCats = categories.filter((c) => c.id !== categoryId);
      setCategories(nextCats);
      persistCategoryDelete(categoryId, {
        categories: nextCats,
        tasks,
        occurrences,
        settings,
      });
      showFeedback('Kategori dihapus.');
    },
    [categories, tasks, occurrences, settings, showFeedback]
  );

  const updateSettings = useCallback(
    (partial: Partial<AppSettings>) => {
      const next: AppSettings = { ...settings, ...partial };
      setSettings(next);
      persistSettingsUpdate(next, {
        categories,
        tasks,
        occurrences,
        settings: next,
      });
    },
    [settings, categories, tasks, occurrences]
  );

  const getItemsForDate = useCallback(
    (dateStr: string): ResolvedTaskItem[] => {
      const items = resolveAllTaskItems(
        tasks,
        occurrences,
        dateStr,
        dateStr,
        nowTick
      ).filter((i) => i.effectiveDate === dateStr);
      return sortResolvedTasks(items);
    },
    [tasks, occurrences, nowTick]
  );

  const loadSampleTasks = useCallback(() => {
    const todayStr = toDateString(new Date());
    const tomorrowStr = addDays(todayStr, 1);
    const yesterdayStr = addDays(todayStr, -1);
    const nowIso = new Date().toISOString();

    const sampleTasks: Task[] = [
      {
        id: makeId('task'),
        title: 'Mengerjakan tugas penelitian',
        description: 'Menyusun bab metodologi dan mengumpulkan minimal 5 jurnal terbaru.',
        categoryId: 'cat-kuliah',
        priority: 'high',
        deadlineType: 'datetime',
        deadlineDate: todayStr,
        deadlineTime: '21:00',
        status: 'in_progress',
        isRecurring: false,
        recurrenceRule: null,
        reminderOffsetMinutes: 60,
        snoozedUntil: null,
        completedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        subtasks: [
          {
            id: makeId('sub'),
            taskId: 't1',
            title: 'Mencari jurnal referensi',
            isCompleted: true,
            sortOrder: 1,
          },
          {
            id: makeId('sub'),
            taskId: 't1',
            title: 'Membuat landasan teori',
            isCompleted: true,
            sortOrder: 2,
          },
          {
            id: makeId('sub'),
            taskId: 't1',
            title: 'Menyusun metodologi',
            isCompleted: false,
            sortOrder: 3,
          },
          {
            id: makeId('sub'),
            taskId: 't1',
            title: 'Membuat kesimpulan',
            isCompleted: false,
            sortOrder: 4,
          },
        ],
      },
      {
        id: makeId('task'),
        title: 'Minum vitamin & beri makan kucing',
        description: 'Rutinitas pagi setiap hari sebelum mulai beraktivitas.',
        categoryId: 'cat-pribadi',
        priority: 'medium',
        deadlineType: 'datetime',
        deadlineDate: todayStr,
        deadlineTime: '08:00',
        status: 'todo',
        isRecurring: true,
        recurrenceRule: {
          frequency: 'daily',
          interval: 1,
          endType: 'never',
        },
        reminderOffsetMinutes: 0,
        snoozedUntil: null,
        completedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        subtasks: [
          {
            id: makeId('sub'),
            taskId: 't2',
            title: 'Siapkan wet food & air bersih',
            isCompleted: false,
            sortOrder: 1,
          },
          {
            id: makeId('sub'),
            taskId: 't2',
            title: 'Minum vitamin C',
            isCompleted: false,
            sortOrder: 2,
          },
        ],
      },
      {
        id: makeId('task'),
        title: 'Review sprint & kirim laporan mingguan',
        description: 'Rekap progres tim dan kendala teknis minggu ini.',
        categoryId: 'cat-kerja',
        priority: 'high',
        deadlineType: 'datetime',
        deadlineDate: yesterdayStr,
        deadlineTime: '17:00',
        status: 'todo',
        isRecurring: false,
        recurrenceRule: null,
        reminderOffsetMinutes: 15,
        snoozedUntil: null,
        completedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        subtasks: [],
      },
      {
        id: makeId('task'),
        title: 'Belanja kebutuhan mingguan & pasir kucing',
        description: 'Jadwal rutin tiap Senin dan Kamis.',
        categoryId: 'cat-belanja',
        priority: 'medium',
        deadlineType: 'date_only',
        deadlineDate: tomorrowStr,
        deadlineTime: null,
        status: 'todo',
        isRecurring: true,
        recurrenceRule: {
          frequency: 'days_of_week',
          interval: 1,
          daysOfWeek: [1, 4], // Senin & Kamis
          endType: 'never',
        },
        reminderOffsetMinutes: 60,
        snoozedUntil: null,
        completedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        subtasks: [
          {
            id: makeId('sub'),
            taskId: 't4',
            title: 'Pasir kucing wangi kopi 10L',
            isCompleted: false,
            sortOrder: 1,
          },
          {
            id: makeId('sub'),
            taskId: 't4',
            title: 'Telur, susu, dan buah',
            isCompleted: false,
            sortOrder: 2,
          },
        ],
      },
      {
        id: makeId('task'),
        title: 'Riset mechanical keyboard wireless baru',
        description: 'Cari switch tactile yang silent buat ngetik malam.',
        categoryId: 'cat-keinginan',
        priority: 'low',
        deadlineType: 'none',
        deadlineDate: null,
        deadlineTime: null,
        status: 'todo',
        isRecurring: false,
        recurrenceRule: null,
        reminderOffsetMinutes: null,
        snoozedUntil: null,
        completedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        subtasks: [],
      },
      {
        id: makeId('task'),
        title: 'Rapikan catatan kuliah algoritma',
        description: 'Ringkasan materi graf dan dynamic programming.',
        categoryId: 'cat-kuliah',
        priority: 'medium',
        deadlineType: 'datetime',
        deadlineDate: todayStr,
        deadlineTime: '13:00',
        status: 'completed',
        isRecurring: false,
        recurrenceRule: null,
        reminderOffsetMinutes: null,
        snoozedUntil: null,
        completedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
        subtasks: [],
      },
    ];

    const fixedSamples = sampleTasks.map((t) => ({
      ...t,
      subtasks: t.subtasks.map((s) => ({ ...s, taskId: t.id })),
    }));

    const nextTasks = [...fixedSamples, ...tasks];
    setTasks(nextTasks);
    const snap = { categories, tasks: nextTasks, occurrences, settings };
    for (const st of fixedSamples) {
      persistTaskUpsert(st, snap);
    }
    showFeedback('Miaw! 6 contoh kegiatan berhasil dimuat.');
  }, [tasks, categories, occurrences, settings, showFeedback]);

  const sendTestNotification = useCallback(async () => {
    const success = await sendInstantTestNotification();
    if (success) {
      showFeedback('Miaw! Notifikasi tes terkirim. Cek bilah status HP.');
    } else {
      showFeedback('Izin notifikasi belum diaktifkan di HP.');
    }
    return success;
  }, [showFeedback]);

  const value = useMemo(
    () => ({
      isReady,
      categories,
      tasks,
      occurrences,
      resolvedItems,
      settings,
      lastFeedbackMessage,
      clearFeedbackMessage,
      showFeedback,
      saveTask,
      deleteTask,
      setItemStatus,
      toggleItemCompleted,
      toggleSubtask,
      snoozeItem,
      rescheduleItem,
      saveCategory,
      removeCategory,
      updateSettings,
      getItemsForDate,
      loadSampleTasks,
      sendTestNotification,
    }),
    [
      isReady,
      categories,
      tasks,
      occurrences,
      resolvedItems,
      settings,
      lastFeedbackMessage,
      clearFeedbackMessage,
      showFeedback,
      saveTask,
      deleteTask,
      setItemStatus,
      toggleItemCompleted,
      toggleSubtask,
      snoozeItem,
      rescheduleItem,
      saveCategory,
      removeCategory,
      updateSettings,
      getItemsForDate,
      loadSampleTasks,
      sendTestNotification,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppStore = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore harus di dalam AppProvider');
  return ctx;
};
