import {
  DeadlineType,
  Priority,
  ResolvedTaskItem,
  TimeBadge,
  WorkflowStatus,
} from '../types';
import { combineDateAndTime, toDateString } from './dateUtils';

export function computeTimeBadge(
  deadlineType: DeadlineType,
  effectiveDate: string | null,
  effectiveTime: string | null,
  status: WorkflowStatus,
  now: Date = new Date()
): TimeBadge {
  if (deadlineType === 'none' || !effectiveDate) {
    return 'no_date';
  }

  const todayStr = toDateString(now);

  // Jika sudah Completed atau Cancelled, jangan tandai Overdue
  if (status === 'completed' || status === 'cancelled') {
    if (effectiveDate === todayStr) return 'today';
    if (effectiveDate > todayStr) return 'upcoming';
    return 'no_date';
  }

  if (deadlineType === 'datetime' && effectiveTime) {
    const deadlineDt = combineDateAndTime(effectiveDate, effectiveTime);
    if (now.getTime() > deadlineDt.getTime()) {
      return 'overdue';
    }
    if (effectiveDate === todayStr) {
      return 'today';
    }
    return 'upcoming';
  }

  // date_only (Seharian): overdue jika tanggal efektif < hari ini
  if (effectiveDate < todayStr) {
    return 'overdue';
  }
  if (effectiveDate === todayStr) {
    return 'today';
  }
  return 'upcoming';
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  todo: 'Belum Mulai',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const TIME_BADGE_LABELS: Record<TimeBadge, string> = {
  overdue: 'Overdue',
  today: 'Today',
  upcoming: 'Upcoming',
  no_date: 'Tanpa Tanggal',
};

export function sortResolvedTasks(items: ResolvedTaskItem[]): ResolvedTaskItem[] {
  return [...items].sort((a, b) => {
    // 1. Aktif lebih dulu daripada selesai/batal
    const aDone = a.status === 'completed' || a.status === 'cancelled' ? 1 : 0;
    const bDone = b.status === 'completed' || b.status === 'cancelled' ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;

    // 2. Overdue paling atas untuk tugas aktif
    if (!aDone && !bDone) {
      const aOverdue = a.timeBadge === 'overdue' ? 0 : 1;
      const bOverdue = b.timeBadge === 'overdue' ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
    }

    // 3. Prioritas (High -> Medium -> Low)
    const pDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (pDiff !== 0) return pDiff;

    // 4. Tanggal & jam terdekat
    if (a.effectiveDate && b.effectiveDate) {
      if (a.effectiveDate !== b.effectiveDate) {
        return a.effectiveDate.localeCompare(b.effectiveDate);
      }
      const aTime = a.effectiveTime || '23:59';
      const bTime = b.effectiveTime || '23:59';
      return aTime.localeCompare(bTime);
    }
    if (a.effectiveDate && !b.effectiveDate) return -1;
    if (!a.effectiveDate && b.effectiveDate) return 1;

    return b.createdAt.localeCompare(a.createdAt);
  });
}
