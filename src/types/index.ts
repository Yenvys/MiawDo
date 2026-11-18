export type Priority = 'high' | 'medium' | 'low';

export type WorkflowStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export type TimeBadge = 'overdue' | 'today' | 'upcoming' | 'no_date';

export type DeadlineType = 'datetime' | 'date_only' | 'none';

export type RecurrenceFrequency =
  | 'daily'
  | 'weekly'
  | 'days_of_week'
  | 'monthly'
  | 'yearly'
  | 'custom_interval';

export type RecurrenceEndType = 'never' | 'on_date' | 'after_count';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  unit?: 'days' | 'weeks' | 'months';
  daysOfWeek?: number[]; // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  endType: RecurrenceEndType;
  endDate?: string | null; // YYYY-MM-DD
  endCount?: number | null;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
  sortOrder: number;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  priority: Priority;
  deadlineType: DeadlineType;
  deadlineDate: string | null; // YYYY-MM-DD (tanggal mulai jika recurring)
  deadlineTime: string | null; // HH:mm
  status: WorkflowStatus;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  reminderOffsetMinutes: number | null; // 0, 15, 60, 1440, atau null
  snoozedUntil: string | null; // ISO timestamp
  completedAt: string | null; // ISO timestamp
  createdAt: string;
  updatedAt: string;
  subtasks: Subtask[];
}

export interface TaskOccurrence {
  id: string;
  taskId: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string | null; // HH:mm
  status: WorkflowStatus;
  snoozedUntil: string | null;
  completedAt: string | null;
  subtaskStates: Record<string, boolean>; // subtaskId -> isCompleted
}

export interface ResolvedTaskItem {
  instanceKey: string;
  taskId: string;
  occurrenceId: string | null;
  title: string;
  description: string;
  categoryId: string;
  priority: Priority;
  deadlineType: DeadlineType;
  effectiveDate: string | null; // YYYY-MM-DD
  effectiveTime: string | null; // HH:mm
  status: WorkflowStatus;
  timeBadge: TimeBadge;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  reminderOffsetMinutes: number | null;
  snoozedUntil: string | null;
  completedAt: string | null;
  createdAt: string;
  subtasks: Subtask[];
}

export type ThemeModePreference = 'morning' | 'night' | 'auto_time';

export interface AppSettings {
  themeMode: ThemeModePreference;
  morningDigestEnabled: boolean;
  morningDigestTime: string; // HH:mm, default '07:00'
  userName: string;
}
