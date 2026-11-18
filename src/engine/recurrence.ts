import {
  RecurrenceRule,
  ResolvedTaskItem,
  Subtask,
  Task,
  TaskOccurrence,
} from '../types';
import {
  addDays,
  addMonths,
  addYears,
  diffInDays,
  HARI_INDONESIA,
  HARI_SINGKAT,
  parseDateString,
  toDateString,
} from './dateUtils';
import { computeTimeBadge } from './status';

export function formatRecurrenceRule(rule: RecurrenceRule | null): string {
  if (!rule) return 'Tidak berulang';

  let base = '';
  switch (rule.frequency) {
    case 'daily':
      base = rule.interval > 1 ? `Setiap ${rule.interval} hari` : 'Setiap hari';
      break;
    case 'weekly':
      base = rule.interval > 1 ? `Setiap ${rule.interval} minggu` : 'Setiap minggu';
      break;
    case 'days_of_week': {
      const days = (rule.daysOfWeek || [])
        .slice()
        .sort((a, b) => a - b)
        .map((d) => HARI_SINGKAT[d] || HARI_INDONESIA[d])
        .join(', ');
      base = days ? `Setiap ${days}` : 'Hari tertentu';
      break;
    }
    case 'monthly':
      base = rule.interval > 1 ? `Setiap ${rule.interval} bulan` : 'Setiap bulan';
      break;
    case 'yearly':
      base = rule.interval > 1 ? `Setiap ${rule.interval} tahun` : 'Setiap tahun';
      break;
    case 'custom_interval': {
      const n = Math.max(1, rule.interval || 1);
      const unitLabel =
        rule.unit === 'weeks' ? 'minggu' : rule.unit === 'months' ? 'bulan' : 'hari';
      base = `Setiap ${n} ${unitLabel}`;
      break;
    }
    default:
      base = 'Berulang';
  }

  if (rule.endType === 'on_date' && rule.endDate) {
    return `${base} (s/d ${rule.endDate})`;
  }
  if (rule.endType === 'after_count' && rule.endCount) {
    return `${base} (${rule.endCount}x)`;
  }
  return base;
}

export function generateOccurrenceDates(
  startDateStr: string,
  rule: RecurrenceRule,
  windowStartStr: string,
  windowEndStr: string,
  maxSafetyLimit = 400
): string[] {
  const results: string[] = [];
  const interval = Math.max(1, rule.interval || 1);
  const maxCount =
    rule.endType === 'after_count' && rule.endCount && rule.endCount > 0
      ? Math.min(rule.endCount, maxSafetyLimit)
      : maxSafetyLimit;

  const hardEndStr =
    rule.endType === 'on_date' && rule.endDate && rule.endDate < windowEndStr
      ? rule.endDate
      : windowEndStr;

  if (hardEndStr < startDateStr) {
    return [];
  }

  if (rule.frequency === 'days_of_week') {
    const allowedDays =
      rule.daysOfWeek && rule.daysOfWeek.length > 0
        ? new Set(rule.daysOfWeek)
        : new Set([parseDateString(startDateStr).getDay()]);

    let cursor = startDateStr;
    let totalGenerated = 0;
    let safety = 0;

    while (cursor <= hardEndStr && totalGenerated < maxCount && safety < 1000) {
      safety++;
      const dayOfWeek = parseDateString(cursor).getDay();
      if (allowedDays.has(dayOfWeek)) {
        totalGenerated++;
        if (cursor >= windowStartStr && cursor <= hardEndStr) {
          results.push(cursor);
        }
      }
      cursor = addDays(cursor, 1);
    }
    return results;
  }

  let cursor = startDateStr;
  let stepIndex = 0;

  while (cursor <= hardEndStr && stepIndex < maxCount) {
    if (cursor >= windowStartStr && cursor <= hardEndStr) {
      results.push(cursor);
    }
    stepIndex++;

    if (rule.frequency === 'daily') {
      cursor = addDays(startDateStr, stepIndex * interval);
    } else if (rule.frequency === 'weekly') {
      cursor = addDays(startDateStr, stepIndex * 7 * interval);
    } else if (rule.frequency === 'monthly') {
      cursor = addMonths(startDateStr, stepIndex * interval);
    } else if (rule.frequency === 'yearly') {
      cursor = addYears(startDateStr, stepIndex * interval);
    } else if (rule.frequency === 'custom_interval') {
      const unit = rule.unit || 'days';
      if (unit === 'weeks') {
        cursor = addDays(startDateStr, stepIndex * 7 * interval);
      } else if (unit === 'months') {
        cursor = addMonths(startDateStr, stepIndex * interval);
      } else {
        cursor = addDays(startDateStr, stepIndex * interval);
      }
    } else {
      break;
    }
  }

  return results;
}

export function resolveSingleTaskItem(task: Task, now: Date = new Date()): ResolvedTaskItem {
  const timeBadge = computeTimeBadge(
    task.deadlineType,
    task.deadlineDate,
    task.deadlineTime,
    task.status,
    now
  );

  return {
    instanceKey: task.id,
    taskId: task.id,
    occurrenceId: null,
    title: task.title,
    description: task.description,
    categoryId: task.categoryId,
    priority: task.priority,
    deadlineType: task.deadlineType,
    effectiveDate: task.deadlineDate,
    effectiveTime: task.deadlineTime,
    status: task.status,
    timeBadge,
    isRecurring: false,
    recurrenceRule: null,
    reminderOffsetMinutes: task.reminderOffsetMinutes,
    snoozedUntil: task.snoozedUntil,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    subtasks: task.subtasks.map((st) => ({ ...st })),
  };
}

export function resolveRecurringOccurrenceItem(
  task: Task,
  scheduledDate: string,
  occurrence: TaskOccurrence | undefined,
  now: Date = new Date()
): ResolvedTaskItem {
  const status = occurrence ? occurrence.status : 'todo';
  const effectiveTime = occurrence?.scheduledTime ?? task.deadlineTime;
  const effectiveDeadlineType =
    task.deadlineType === 'none' ? 'date_only' : task.deadlineType;

  const resolvedSubtasks: Subtask[] = task.subtasks.map((st) => ({
    ...st,
    // Setiap kemunculan memiliki status subtask mandiri; default false (reset)
    isCompleted: occurrence?.subtaskStates?.[st.id] ?? false,
  }));

  const timeBadge = computeTimeBadge(
    effectiveDeadlineType,
    scheduledDate,
    effectiveTime,
    status,
    now
  );

  return {
    instanceKey: `${task.id}__${scheduledDate}`,
    taskId: task.id,
    occurrenceId: occurrence?.id ?? null,
    title: task.title,
    description: task.description,
    categoryId: task.categoryId,
    priority: task.priority,
    deadlineType: effectiveDeadlineType,
    effectiveDate: scheduledDate,
    effectiveTime,
    status,
    timeBadge,
    isRecurring: true,
    recurrenceRule: task.recurrenceRule,
    reminderOffsetMinutes: task.reminderOffsetMinutes,
    snoozedUntil: occurrence?.snoozedUntil ?? null,
    completedAt: occurrence?.completedAt ?? null,
    createdAt: task.createdAt,
    subtasks: resolvedSubtasks,
  };
}

export function resolveAllTaskItems(
  tasks: Task[],
  occurrences: TaskOccurrence[],
  windowStartStr: string,
  windowEndStr: string,
  now: Date = new Date()
): ResolvedTaskItem[] {
  const occByTaskAndDate = new Map<string, TaskOccurrence>();
  const occsByTask = new Map<string, TaskOccurrence[]>();

  for (const occ of occurrences) {
    occByTaskAndDate.set(`${occ.taskId}__${occ.scheduledDate}`, occ);
    const list = occsByTask.get(occ.taskId) || [];
    list.push(occ);
    occsByTask.set(occ.taskId, list);
  }

  const resolved: ResolvedTaskItem[] = [];
  const todayStr = toDateString(now);

  for (const task of tasks) {
    if (!task.isRecurring || !task.recurrenceRule) {
      resolved.push(resolveSingleTaskItem(task, now));
      continue;
    }

    const anchorDate = task.deadlineDate || toDateString(new Date(task.createdAt));
    // Mulai minimal 14 hari ke belakang dari hari ini agar jadwal baru-baru ini yang terlewat tetap muncul sebagai Overdue
    const lookbackStart = addDays(todayStr, -14);
    const effectiveStart =
      anchorDate > lookbackStart
        ? anchorDate
        : windowStartStr < lookbackStart
        ? windowStartStr
        : lookbackStart;

    const generatedDates = new Set(
      generateOccurrenceDates(
        anchorDate,
        task.recurrenceRule,
        effectiveStart,
        windowEndStr
      )
    );

    // Pastikan semua occurrence yang sudah tercatat di DB (misal selesai di masa lalu atau masih overdue) ikut ter-resolve
    const savedOccs = occsByTask.get(task.id) || [];
    for (const saved of savedOccs) {
      if (saved.scheduledDate <= windowEndStr) {
        generatedDates.add(saved.scheduledDate);
      }
    }

    const sortedDates = Array.from(generatedDates).sort();
    for (const dtStr of sortedDates) {
      const occ = occByTaskAndDate.get(`${task.id}__${dtStr}`);
      resolved.push(resolveRecurringOccurrenceItem(task, dtStr, occ, now));
    }
  }

  return resolved;
}
