import { Platform } from 'react-native';
import {
  AppSettings,
  Category,
  RecurrenceRule,
  Subtask,
  Task,
  TaskOccurrence,
} from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './seed';

const WEB_STORAGE_KEY = 'miawdo_offline_db_v1';

interface DatabaseSnapshot {
  categories: Category[];
  tasks: Task[];
  occurrences: TaskOccurrence[];
  settings: AppSettings;
}

// Lazy load expo-sqlite hanya pada platform Native (Android / iOS)
let sqliteDb: any = null;

function getNativeDb() {
  if (Platform.OS === 'web') return null;
  if (sqliteDb) return sqliteDb;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SQLite = require('expo-sqlite');
    sqliteDb = SQLite.openDatabaseSync('miawdo.db');
    initNativeSchema(sqliteDb);
    return sqliteDb;
  } catch (err) {
    console.warn('Fallback ke in-memory/web storage karena SQLite belum tersedia:', err);
    return null;
  }
}

function initNativeSchema(db: any) {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category_id TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      deadline_type TEXT NOT NULL DEFAULT 'datetime',
      deadline_date TEXT,
      deadline_time TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      is_recurring INTEGER NOT NULL DEFAULT 0,
      recurrence_rule TEXT,
      reminder_offset_minutes INTEGER,
      snoozed_until TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY NOT NULL,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_occurrences (
      id TEXT PRIMARY KEY NOT NULL,
      task_id TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      snoozed_until TEXT,
      completed_at TEXT,
      UNIQUE(task_id, scheduled_date),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subtask_states (
      occurrence_id TEXT NOT NULL,
      subtask_id TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (occurrence_id, subtask_id),
      FOREIGN KEY (occurrence_id) REFERENCES task_occurrences(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const countRow = db.getFirstSync('SELECT COUNT(*) as cnt FROM categories');
  if (!countRow || countRow.cnt === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      db.runSync(
        'INSERT INTO categories (id, name, color, icon, is_default, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [cat.id, cat.name, cat.color, cat.icon, cat.isDefault ? 1 : 0, cat.sortOrder]
      );
    }
  }
}

let memoryFallback: DatabaseSnapshot = {
  categories: [...DEFAULT_CATEGORIES],
  tasks: [],
  occurrences: [],
  settings: { ...DEFAULT_SETTINGS },
};

function readWebSnapshot(): DatabaseSnapshot {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(WEB_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          categories:
            parsed.categories && parsed.categories.length > 0
              ? parsed.categories
              : [...DEFAULT_CATEGORIES],
          tasks: parsed.tasks || [],
          occurrences: parsed.occurrences || [],
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        };
      }
    }
  } catch (e) {
    console.warn('Gagal membaca localStorage:', e);
  }
  return memoryFallback;
}

function writeWebSnapshot(snapshot: DatabaseSnapshot) {
  memoryFallback = snapshot;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(snapshot));
    }
  } catch (e) {
    console.warn('Gagal menyimpan ke localStorage:', e);
  }
}

export function loadDatabaseSnapshot(): DatabaseSnapshot {
  const db = getNativeDb();
  if (!db) {
    return readWebSnapshot();
  }

  const catRows = db.getAllSync('SELECT * FROM categories ORDER BY sort_order ASC');
  const categories: Category[] = catRows.map((r: any) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    icon: r.icon,
    isDefault: Boolean(r.is_default),
    sortOrder: r.sort_order,
  }));

  const subtaskRows = db.getAllSync('SELECT * FROM subtasks ORDER BY sort_order ASC');
  const subtasksByTask = new Map<string, Subtask[]>();
  for (const sr of subtaskRows) {
    const list = subtasksByTask.get(sr.task_id) || [];
    list.push({
      id: sr.id,
      taskId: sr.task_id,
      title: sr.title,
      isCompleted: Boolean(sr.is_completed),
      sortOrder: sr.sort_order,
    });
    subtasksByTask.set(sr.task_id, list);
  }

  const taskRows = db.getAllSync('SELECT * FROM tasks ORDER BY created_at DESC');
  const tasks: Task[] = taskRows.map((r: any) => {
    let parsedRule: RecurrenceRule | null = null;
    if (r.recurrence_rule) {
      try {
        parsedRule = JSON.parse(r.recurrence_rule);
      } catch {
        parsedRule = null;
      }
    }
    return {
      id: r.id,
      title: r.title,
      description: r.description || '',
      categoryId: r.category_id,
      priority: r.priority,
      deadlineType: r.deadline_type,
      deadlineDate: r.deadline_date || null,
      deadlineTime: r.deadline_time || null,
      status: r.status,
      isRecurring: Boolean(r.is_recurring),
      recurrenceRule: parsedRule,
      reminderOffsetMinutes:
        r.reminder_offset_minutes !== null && r.reminder_offset_minutes !== undefined
          ? Number(r.reminder_offset_minutes)
          : null,
      snoozedUntil: r.snoozed_until || null,
      completedAt: r.completed_at || null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      subtasks: subtasksByTask.get(r.id) || [],
    };
  });

  const occStateRows = db.getAllSync('SELECT * FROM subtask_states');
  const statesByOcc = new Map<string, Record<string, boolean>>();
  for (const st of occStateRows) {
    const map = statesByOcc.get(st.occurrence_id) || {};
    map[st.subtask_id] = Boolean(st.is_completed);
    statesByOcc.set(st.occurrence_id, map);
  }

  const occRows = db.getAllSync('SELECT * FROM task_occurrences');
  const occurrences: TaskOccurrence[] = occRows.map((r: any) => ({
    id: r.id,
    taskId: r.task_id,
    scheduledDate: r.scheduled_date,
    scheduledTime: r.scheduled_time || null,
    status: r.status,
    snoozedUntil: r.snoozed_until || null,
    completedAt: r.completed_at || null,
    subtaskStates: statesByOcc.get(r.id) || {},
  }));

  const settingRows = db.getAllSync('SELECT * FROM app_settings');
  const settings: AppSettings = { ...DEFAULT_SETTINGS };
  for (const row of settingRows) {
    if (row.key === 'themeMode') settings.themeMode = row.value as any;
    if (row.key === 'morningDigestEnabled')
      settings.morningDigestEnabled = row.value === 'true';
    if (row.key === 'morningDigestTime') settings.morningDigestTime = row.value;
    if (row.key === 'userName') settings.userName = row.value;
  }

  return { categories, tasks, occurrences, settings };
}

export function persistTaskUpsert(task: Task, allCurrentSnapshot: DatabaseSnapshot) {
  const db = getNativeDb();
  if (!db) {
    writeWebSnapshot(allCurrentSnapshot);
    return;
  }

  db.runSync(
    `INSERT OR REPLACE INTO tasks (
      id, title, description, category_id, priority,
      deadline_type, deadline_date, deadline_time, status,
      is_recurring, recurrence_rule, reminder_offset_minutes,
      snoozed_until, completed_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.title,
      task.description,
      task.categoryId,
      task.priority,
      task.deadlineType,
      task.deadlineDate,
      task.deadlineTime,
      task.status,
      task.isRecurring ? 1 : 0,
      task.recurrenceRule ? JSON.stringify(task.recurrenceRule) : null,
      task.reminderOffsetMinutes,
      task.snoozedUntil,
      task.completedAt,
      task.createdAt,
      task.updatedAt,
    ]
  );

  db.runSync('DELETE FROM subtasks WHERE task_id = ?', [task.id]);
  for (const st of task.subtasks) {
    db.runSync(
      'INSERT INTO subtasks (id, task_id, title, is_completed, sort_order) VALUES (?, ?, ?, ?, ?)',
      [st.id, task.id, st.title, st.isCompleted ? 1 : 0, st.sortOrder]
    );
  }
}

export function persistTaskDelete(taskId: string, allCurrentSnapshot: DatabaseSnapshot) {
  const db = getNativeDb();
  if (!db) {
    writeWebSnapshot(allCurrentSnapshot);
    return;
  }
  db.runSync('DELETE FROM tasks WHERE id = ?', [taskId]);
}

export function persistOccurrenceUpsert(
  occ: TaskOccurrence,
  allCurrentSnapshot: DatabaseSnapshot
) {
  const db = getNativeDb();
  if (!db) {
    writeWebSnapshot(allCurrentSnapshot);
    return;
  }

  db.runSync(
    `INSERT OR REPLACE INTO task_occurrences (
      id, task_id, scheduled_date, scheduled_time, status, snoozed_until, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      occ.id,
      occ.taskId,
      occ.scheduledDate,
      occ.scheduledTime,
      occ.status,
      occ.snoozedUntil,
      occ.completedAt,
    ]
  );

  db.runSync('DELETE FROM subtask_states WHERE occurrence_id = ?', [occ.id]);
  for (const [subtaskId, done] of Object.entries(occ.subtaskStates)) {
    db.runSync(
      'INSERT INTO subtask_states (occurrence_id, subtask_id, is_completed) VALUES (?, ?, ?)',
      [occ.id, subtaskId, done ? 1 : 0]
    );
  }
}

export function persistCategoryUpsert(
  category: Category,
  allCurrentSnapshot: DatabaseSnapshot
) {
  const db = getNativeDb();
  if (!db) {
    writeWebSnapshot(allCurrentSnapshot);
    return;
  }
  db.runSync(
    'INSERT OR REPLACE INTO categories (id, name, color, icon, is_default, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    [
      category.id,
      category.name,
      category.color,
      category.icon,
      category.isDefault ? 1 : 0,
      category.sortOrder,
    ]
  );
}

export function persistCategoryDelete(
  categoryId: string,
  allCurrentSnapshot: DatabaseSnapshot
) {
  const db = getNativeDb();
  if (!db) {
    writeWebSnapshot(allCurrentSnapshot);
    return;
  }
  db.runSync('DELETE FROM categories WHERE id = ?', [categoryId]);
}

export function persistSettingsUpdate(
  settings: AppSettings,
  allCurrentSnapshot: DatabaseSnapshot
) {
  const db = getNativeDb();
  if (!db) {
    writeWebSnapshot(allCurrentSnapshot);
    return;
  }
  const entries: [string, string][] = [
    ['themeMode', settings.themeMode],
    ['morningDigestEnabled', String(settings.morningDigestEnabled)],
    ['morningDigestTime', settings.morningDigestTime],
    ['userName', settings.userName],
  ];
  for (const [k, v] of entries) {
    db.runSync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [k, v]);
  }
}
