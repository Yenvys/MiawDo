import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Category,
  DeadlineType,
  Priority,
  RecurrenceEndType,
  RecurrenceFrequency,
  Task,
} from '../../types';
import { TaskFormPayload } from '../../context/AppContext';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  addDays,
  formatTanggalIndo,
  HARI_SINGKAT,
  toDateString,
} from '../../engine/dateUtils';
import { REMINDER_OFFSET_OPTIONS } from '../../engine/notifications';
import { CategoryGlyph, PawPrintIcon } from '../cat/CatGraphics';
import { Feather } from '@expo/vector-icons';
import { MarqueeText } from '../common/MarqueeText';

interface TaskFormModalProps {
  visible: boolean;
  editingTask: Task | null;
  defaultDate?: string | null;
  categories: Category[];
  onClose: () => void;
  onSave: (payload: TaskFormPayload) => void;
  onOpenCategoryManager: () => void;
}

const FREQUENCY_OPTIONS: { id: RecurrenceFrequency; label: string; example: string }[] = [
  { id: 'daily', label: 'Setiap hari', example: 'Minum vitamin' },
  { id: 'weekly', label: 'Setiap minggu', example: 'Belanja mingguan' },
  { id: 'days_of_week', label: 'Beberapa kali seminggu', example: 'Senin & Kamis' },
  { id: 'monthly', label: 'Setiap bulan', example: 'Bayar tagihan' },
  { id: 'yearly', label: 'Setiap tahun', example: 'Perpanjang dokumen' },
  { id: 'custom_interval', label: 'Custom interval', example: 'Setiap 3 hari' },
];

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  visible,
  editingTask,
  defaultDate,
  categories,
  onClose,
  onSave,
  onOpenCategoryManager,
}) => {
  const { theme } = useAppTheme();
  const todayStr = toDateString(new Date());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('cat-kerja');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadlineType, setDeadlineType] = useState<DeadlineType>('datetime');
  const [deadlineDate, setDeadlineDate] = useState(todayStr);
  const [deadlineTime, setDeadlineTime] = useState('17:00');

  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('daily');
  const [intervalNum, setIntervalNum] = useState('3');
  const [intervalUnit, setIntervalUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 4]); // Senin & Kamis
  const [endType, setEndType] = useState<RecurrenceEndType>('never');
  const [endDate, setEndDate] = useState(addDays(todayStr, 30));
  const [endCount, setEndCount] = useState('10');

  const [reminderOffset, setReminderOffset] = useState<number | null>(15);
  const [isCustomReminder, setIsCustomReminder] = useState(false);
  const [customReminderVal, setCustomReminderVal] = useState('2');
  const [customReminderUnit, setCustomReminderUnit] = useState<'minutes' | 'hours' | 'days'>('hours');

  const [subtaskDrafts, setSubtaskDrafts] = useState<
    { id?: string; title: string; isCompleted?: boolean }[]
  >([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setErrorMsg(null);
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setCategoryId(editingTask.categoryId);
      setPriority(editingTask.priority);
      setDeadlineType(editingTask.deadlineType);
      setDeadlineDate(editingTask.deadlineDate || todayStr);
      setDeadlineTime(editingTask.deadlineTime || '17:00');
      setIsRecurring(editingTask.isRecurring);
      if (editingTask.recurrenceRule) {
        setFrequency(editingTask.recurrenceRule.frequency);
        setIntervalNum(String(editingTask.recurrenceRule.interval || 1));
        setIntervalUnit(editingTask.recurrenceRule.unit || 'days');
        setDaysOfWeek(editingTask.recurrenceRule.daysOfWeek || [1, 4]);
        setEndType(editingTask.recurrenceRule.endType || 'never');
        setEndDate(editingTask.recurrenceRule.endDate || addDays(todayStr, 30));
        setEndCount(String(editingTask.recurrenceRule.endCount || 10));
      }
      const off = editingTask.reminderOffsetMinutes;
      setReminderOffset(off);
      if (off !== null && !REMINDER_OFFSET_OPTIONS.some((r) => r.value === off)) {
        setIsCustomReminder(true);
        if (off % 1440 === 0) {
          setCustomReminderVal(String(off / 1440));
          setCustomReminderUnit('days');
        } else if (off % 60 === 0) {
          setCustomReminderVal(String(off / 60));
          setCustomReminderUnit('hours');
        } else {
          setCustomReminderVal(String(off));
          setCustomReminderUnit('minutes');
        }
      } else {
        setIsCustomReminder(false);
        setCustomReminderVal('2');
        setCustomReminderUnit('hours');
      }
      setSubtaskDrafts(
        editingTask.subtasks.map((s) => ({
          id: s.id,
          title: s.title,
          isCompleted: s.isCompleted,
        }))
      );
      setNewSubtaskText('');
    } else {
      setTitle('');
      setDescription('');
      setCategoryId(categories[0]?.id || 'cat-kerja');
      setPriority('medium');
      setDeadlineType('datetime');
      setDeadlineDate(defaultDate || todayStr);
      setDeadlineTime('17:00');
      setIsRecurring(false);
      setFrequency('daily');
      setIntervalNum('3');
      setIntervalUnit('days');
      setDaysOfWeek([1, 4]);
      setEndType('never');
      setEndDate(addDays(todayStr, 30));
      setEndCount('10');
      setReminderOffset(15);
      setIsCustomReminder(false);
      setCustomReminderVal('2');
      setCustomReminderUnit('hours');
      setSubtaskDrafts([]);
      setNewSubtaskText('');
    }
  }, [visible, editingTask, defaultDate, categories, todayStr]);

  if (!visible) return null;

  // Helper fungsi untuk Atur Jam Bebas
  const timeParts = (deadlineTime || '17:00').split(':');
  const currentHourStr = timeParts[0] || '17';
  const currentMinuteStr = timeParts[1] || '00';

  const handleUpdateHour = (newHour: string) => {
    const clean = newHour.replace(/\D/g, '').slice(0, 2);
    if (!clean) {
      setDeadlineTime(`00:${currentMinuteStr}`);
      return;
    }
    let hNum = parseInt(clean, 10);
    if (isNaN(hNum)) hNum = 0;
    if (hNum > 23) hNum = 23;
    const formatted = String(hNum).padStart(2, '0');
    setDeadlineTime(`${formatted}:${currentMinuteStr}`);
  };

  const handleUpdateMinute = (newMinute: string) => {
    const clean = newMinute.replace(/\D/g, '').slice(0, 2);
    if (!clean) {
      setDeadlineTime(`${currentHourStr}:00`);
      return;
    }
    let mNum = parseInt(clean, 10);
    if (isNaN(mNum)) mNum = 0;
    if (mNum > 59) mNum = 59;
    const formatted = String(mNum).padStart(2, '0');
    setDeadlineTime(`${currentHourStr}:${formatted}`);
  };

  const adjustHour = (delta: number) => {
    let h = parseInt(currentHourStr, 10);
    if (isNaN(h)) h = 12;
    h = (h + delta + 24) % 24;
    setDeadlineTime(`${String(h).padStart(2, '0')}:${currentMinuteStr}`);
  };

  const adjustMinute = (delta: number) => {
    let m = parseInt(currentMinuteStr, 10);
    if (isNaN(m)) m = 0;
    m = (m + delta + 60) % 60;
    setDeadlineTime(`${currentHourStr}:${String(m).padStart(2, '0')}`);
  };

  const setTimeToCurrent = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setDeadlineTime(`${hh}:${mm}`);
  };

  // Helper fungsi untuk Custom Notifikasi Pengingat
  const applyCustomReminder = (
    valStr: string,
    unit: 'minutes' | 'hours' | 'days'
  ) => {
    const clean = valStr.replace(/\D/g, '');
    const num = clean ? Math.max(1, parseInt(clean, 10)) : 1;
    setCustomReminderVal(String(num));
    setCustomReminderUnit(unit);
    setIsCustomReminder(true);
    let mult = 1;
    if (unit === 'hours') mult = 60;
    if (unit === 'days') mult = 1440;
    setReminderOffset(num * mult);
  };

  const adjustCustomReminderNum = (delta: number) => {
    const current = parseInt(customReminderVal.replace(/\D/g, ''), 10) || 1;
    const nextVal = Math.max(1, current + delta);
    applyCustomReminder(String(nextVal), customReminderUnit);
  };

  const toggleDayOfWeek = (dayIndex: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(dayIndex)
        ? prev.length > 1
          ? prev.filter((d) => d !== dayIndex)
          : prev
        : [...prev, dayIndex].sort((a, b) => a - b)
    );
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskText.trim();
    if (!trimmed) return;
    setSubtaskDrafts((prev) => [...prev, { title: trimmed, isCompleted: false }]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtaskDrafts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setErrorMsg('Nama kegiatan wajib diisi terlebih dahulu.');
      return;
    }

    const finalSubtasks = [...subtaskDrafts];
    if (newSubtaskText.trim()) {
      finalSubtasks.push({
        title: newSubtaskText.trim(),
        isCompleted: false,
      });
    }

    const parsedInterval = Math.max(1, parseInt(intervalNum, 10) || 1);
    const parsedEndCount = Math.max(1, parseInt(endCount, 10) || 10);

    onSave({
      id: editingTask?.id,
      title: title.trim(),
      description: description.trim(),
      categoryId,
      priority,
      deadlineType: isRecurring && deadlineType === 'none' ? 'date_only' : deadlineType,
      deadlineDate:
        deadlineType === 'none' && !isRecurring ? null : deadlineDate.trim() || todayStr,
      deadlineTime: deadlineType === 'datetime' ? deadlineTime.trim() || '17:00' : null,
      isRecurring,
      recurrenceRule: isRecurring
        ? {
            frequency,
            interval: frequency === 'custom_interval' ? parsedInterval : 1,
            unit: frequency === 'custom_interval' ? intervalUnit : undefined,
            daysOfWeek: frequency === 'days_of_week' ? daysOfWeek : undefined,
            endType,
            endDate: endType === 'on_date' ? endDate : null,
            endCount: endType === 'after_count' ? parsedEndCount : null,
          }
        : null,
      reminderOffsetMinutes: reminderOffset,
      subtaskTitles: finalSubtasks,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {/* Header Form */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <PawPrintIcon size={18} color={theme.accent} />
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                {editingTask ? 'Edit Kegiatan' : 'Tambah Kegiatan Baru'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.cancelBtn, { backgroundColor: theme.surfaceMuted }]}
            >
              <Text style={[styles.cancelBtnText, { color: theme.textPrimary }]}>
                Batal
              </Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {errorMsg ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: theme.statusOverdueBg,
                    borderColor: theme.statusOverdue,
                  },
                ]}
              >
                <Text style={{ color: theme.statusOverdue, fontWeight: '700', fontSize: 13 }}>
                  {errorMsg}
                </Text>
              </View>
            ) : null}

            {/* 1. Nama & Deskripsi Tugas */}
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Nama Kegiatan *
            </Text>
            <TextInput
              value={title}
              onChangeText={(v) => {
                setTitle(v);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Contoh: Mengerjakan tugas penelitian"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
            />

            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Deskripsi Tugas (Opsional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Catatan tambahan, link, atau rincian..."
              placeholderTextColor={theme.textMuted}
              multiline
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
            />

            {/* 2. Kategori Kegiatan */}
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.textPrimary, marginTop: 0 }]}>
                Kategori Kegiatan
              </Text>
              <Pressable onPress={onOpenCategoryManager}>
                <Text style={{ color: theme.accent, fontSize: 12.5, fontWeight: '700' }}>
                  + Kelola Kategori
                </Text>
              </Pressable>
            </View>
            <View style={styles.grid4Wrap}>
              {categories.map((cat) => {
                const selected = cat.id === categoryId;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    style={[
                      styles.grid4Item,
                      {
                        backgroundColor: selected ? cat.color : theme.surfaceMuted,
                        borderColor: selected ? cat.color : theme.border,
                      },
                    ]}
                  >
                    <CategoryGlyph
                      icon={cat.icon}
                      color={selected ? '#FFFFFF' : cat.color}
                      size={13}
                    />
                    <View style={styles.gridItemTextWrap}>
                      <MarqueeText
                        text={cat.name}
                        style={[
                          styles.gridItemText,
                          {
                            color: selected ? '#FFFFFF' : theme.textPrimary,
                          },
                        ]}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* 3. Prioritas Kegiatan */}
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Prioritas Kegiatan
            </Text>
            <View style={styles.priorityRow}>
              {(
                [
                  {
                    id: 'high',
                    title: 'High',
                    sub: 'Segera dikerjakan',
                    color: theme.priorityHigh,
                    bg: theme.priorityHighBg,
                  },
                  {
                    id: 'medium',
                    title: 'Medium',
                    sub: 'Penting, tak mendesak',
                    color: theme.priorityMedium,
                    bg: theme.priorityMediumBg,
                  },
                  {
                    id: 'low',
                    title: 'Low',
                    sub: 'Bisa nanti',
                    color: theme.priorityLow,
                    bg: theme.priorityLowBg,
                  },
                ] as const
              ).map((p) => {
                const active = priority === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setPriority(p.id)}
                    style={[
                      styles.priorityCard,
                      {
                        backgroundColor: active ? p.bg : theme.background,
                        borderColor: active ? p.color : theme.border,
                      },
                    ]}
                  >
                    <View style={styles.priorityHeader}>
                      <PawPrintIcon size={13} color={p.color} />
                      <Text
                        style={[
                          styles.priorityTitle,
                          { color: active ? p.color : theme.textPrimary },
                        ]}
                      >
                        {p.title}
                      </Text>
                    </View>
                    <View style={{ height: 16, width: '100%' }}>
                      <MarqueeText
                        text={p.sub}
                        style={[styles.prioritySub, { color: theme.textSecondary }]}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* 4. Tenggat Waktu (Deadline) (3 Kolom Seragam & Marquee) */}
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Tenggat Waktu (Deadline)
            </Text>
            <View style={styles.deadlineTypeRow}>
              {(
                [
                  { id: 'datetime', label: 'Tanggal & Jam' },
                  { id: 'date_only', label: 'Seharian (Tanggal)' },
                  { id: 'none', label: 'Tanpa Deadline' },
                ] as const
              ).map((dt) => {
                const active = deadlineType === dt.id;
                return (
                  <Pressable
                    key={dt.id}
                    onPress={() => setDeadlineType(dt.id)}
                    style={[
                      styles.deadlineTypeBtn,
                      {
                        backgroundColor: active ? theme.accent : theme.surfaceMuted,
                        borderColor: active ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <MarqueeText
                      text={dt.label}
                      style={[
                        styles.choiceChipText,
                        { color: active ? theme.onAccent : theme.textPrimary },
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>

            {deadlineType !== 'none' || isRecurring ? (
              <View
                style={[
                  styles.subPanel,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                {/* Baris Cepat Tanggal: Mentok 4 Kotak Seragam */}
                <View style={styles.grid4Wrap}>
                  {[
                    { label: 'Hari ini', val: todayStr },
                    { label: 'Besok', val: addDays(todayStr, 1) },
                    { label: 'Lusa', val: addDays(todayStr, 2) },
                    { label: '+7 Hari', val: addDays(todayStr, 7) },
                  ].map((q) => {
                    const selected = deadlineDate === q.val;
                    return (
                      <Pressable
                        key={q.label}
                        onPress={() => setDeadlineDate(q.val)}
                        style={[
                          styles.grid4Item,
                          {
                            backgroundColor: selected ? theme.accent : theme.surfaceMuted,
                            borderColor: selected ? theme.accent : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: selected ? theme.onAccent : theme.textPrimary,
                          }}
                        >
                          {q.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Bar Tanggal Sederhana & Bersih (Dengan Stepper ‹ ›) */}
                <View
                  style={[
                    styles.simpleDateBar,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => setDeadlineDate(addDays(deadlineDate, -1))}
                    hitSlop={8}
                    style={styles.dateStepArrow}
                  >
                    <Feather name="chevron-left" size={20} color={theme.textPrimary} />
                  </Pressable>

                  <View style={styles.dateDisplayCenter}>
                    <TextInput
                      value={deadlineDate}
                      onChangeText={setDeadlineDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.textMuted}
                      style={[styles.dateInputClean, { color: theme.textPrimary }]}
                    />
                    <Text style={[styles.dateReadableSub, { color: theme.textSecondary }]}>
                      {formatTanggalIndo(deadlineDate, true)}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setDeadlineDate(addDays(deadlineDate, 1))}
                    hitSlop={8}
                    style={styles.dateStepArrow}
                  >
                    <Feather name="chevron-right" size={20} color={theme.textPrimary} />
                  </Pressable>
                </View>

                {/* Jam Pengerjaan (Hanya jika Tanggal & Jam) */}
                {deadlineType === 'datetime' ? (
                  <View style={{ marginTop: 12 }}>
                    {/* Card Jam Pengerjaan yang Rapi dan Jelas */}
                    <View
                      style={[
                        styles.customTimeCard,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <View style={styles.customTimeHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Feather name="clock" size={15} color={theme.accent} />
                          <Text style={[styles.customTimeTitle, { color: theme.textPrimary }]}>
                            Jam Pengerjaan
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.timeBadgePill,
                            { backgroundColor: theme.accentSoft },
                          ]}
                        >
                          <Text
                            style={[
                              styles.timeBadgeText,
                              { color: theme.accent },
                            ]}
                          >
                            {deadlineTime ? `Pukul ${deadlineTime}` : '17:00'}
                          </Text>
                        </View>
                      </View>

                      {/* Box Input Jam & Menit */}
                      <View style={styles.timeBoxesRow}>
                        {/* Kolom Jam */}
                        <View style={styles.timeUnitCol}>
                          <View style={styles.stepperWrap}>
                            <Pressable
                              onPress={() => adjustHour(1)}
                              style={[
                                styles.timeStepBtn,
                                { backgroundColor: theme.surfaceMuted },
                              ]}
                            >
                              <Feather name="chevron-up" size={16} color={theme.textPrimary} />
                            </Pressable>
                            <TextInput
                              value={currentHourStr}
                              onChangeText={handleUpdateHour}
                              keyboardType="number-pad"
                              maxLength={2}
                              selectTextOnFocus
                              style={[
                                styles.timeDigitBox,
                                {
                                  backgroundColor: theme.surfaceMuted,
                                  borderColor: theme.border,
                                  color: theme.textPrimary,
                                },
                              ]}
                            />
                            <Pressable
                              onPress={() => adjustHour(-1)}
                              style={[
                                styles.timeStepBtn,
                                { backgroundColor: theme.surfaceMuted },
                              ]}
                            >
                              <Feather name="chevron-down" size={16} color={theme.textPrimary} />
                            </Pressable>
                          </View>
                          <Text
                            style={[
                              styles.timeUnitLabel,
                              { color: theme.textSecondary },
                            ]}
                          >
                            Jam (00–23)
                          </Text>
                        </View>

                        <Text style={[styles.timeColon, { color: theme.textPrimary }]}>:</Text>

                        {/* Kolom Menit */}
                        <View style={styles.timeUnitCol}>
                          <View style={styles.stepperWrap}>
                            <Pressable
                              onPress={() => adjustMinute(5)}
                              style={[
                                styles.timeStepBtn,
                                { backgroundColor: theme.surfaceMuted },
                              ]}
                            >
                              <Feather name="chevron-up" size={16} color={theme.textPrimary} />
                            </Pressable>
                            <TextInput
                              value={currentMinuteStr}
                              onChangeText={handleUpdateMinute}
                              keyboardType="number-pad"
                              maxLength={2}
                              selectTextOnFocus
                              style={[
                                styles.timeDigitBox,
                                {
                                  backgroundColor: theme.surfaceMuted,
                                  borderColor: theme.border,
                                  color: theme.textPrimary,
                                },
                              ]}
                            />
                            <Pressable
                              onPress={() => adjustMinute(-5)}
                              style={[
                                styles.timeStepBtn,
                                { backgroundColor: theme.surfaceMuted },
                              ]}
                            >
                              <Feather name="chevron-down" size={16} color={theme.textPrimary} />
                            </Pressable>
                          </View>
                          <Text
                            style={[
                              styles.timeUnitLabel,
                              { color: theme.textSecondary },
                            ]}
                          >
                            Menit (00–59)
                          </Text>
                        </View>
                      </View>

                      {/* Tombol Cepat Penyesuaian Jam */}
                      <View style={styles.quickTimeChipsRow}>
                        <Pressable
                          onPress={setTimeToCurrent}
                          style={[
                            styles.quickTimeChip,
                            {
                              backgroundColor: theme.surfaceMuted,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.quickTimeChipText,
                              { color: theme.textPrimary },
                            ]}
                          >
                            Jam Sekarang
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => adjustMinute(15)}
                          style={[
                            styles.quickTimeChip,
                            {
                              backgroundColor: theme.surfaceMuted,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.quickTimeChipText,
                              { color: theme.textPrimary },
                            ]}
                          >
                            +15m
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => adjustMinute(30)}
                          style={[
                            styles.quickTimeChip,
                            {
                              backgroundColor: theme.surfaceMuted,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.quickTimeChipText,
                              { color: theme.textPrimary },
                            ]}
                          >
                            +30m
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => adjustHour(1)}
                          style={[
                            styles.quickTimeChip,
                            {
                              backgroundColor: theme.surfaceMuted,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.quickTimeChipText,
                              { color: theme.textPrimary },
                            ]}
                          >
                            +1 Jam
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* 5. Sistem Custom Recurring Task */}
            <View style={styles.recurringHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.label,
                    { color: theme.textPrimary, marginTop: 0, marginBottom: 2 },
                  ]}
                >
                  Kegiatan Berulang (Recurring Task)
                </Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                  Setiap jadwal kemunculan punya status selesai mandiri.
                </Text>
              </View>
              <Pressable
                onPress={() => setIsRecurring((p) => !p)}
                style={[
                  styles.togglePill,
                  {
                    backgroundColor: isRecurring
                      ? theme.accent
                      : theme.surfaceMuted,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: isRecurring ? theme.onAccent : theme.textPrimary,
                  }}
                >
                  {isRecurring ? 'Aktif' : 'Nonaktif'}
                </Text>
              </Pressable>
            </View>

            {isRecurring ? (
              <View
                style={[
                  styles.subPanel,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.subPanelTitle, { color: theme.textPrimary }]}>
                  Pola Perulangan:
                </Text>
                <View style={styles.freqGrid}>
                  {FREQUENCY_OPTIONS.map((opt) => {
                    const active = frequency === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => setFrequency(opt.id)}
                        style={[
                          styles.freqCard,
                          {
                            backgroundColor: active
                              ? theme.accentSoft
                              : theme.surface,
                            borderColor: active ? theme.accent : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: active ? theme.accent : theme.textPrimary,
                          }}
                        >
                          {opt.label}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.textSecondary,
                            marginTop: 2,
                          }}
                        >
                          Contoh: {opt.example}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {frequency === 'days_of_week' ? (
                  <View style={{ marginTop: 12 }}>
                    <Text
                      style={[styles.subPanelTitle, { color: theme.textPrimary }]}
                    >
                      Pilih Hari dalam Seminggu:
                    </Text>
                    <View style={styles.quickBtnRow}>
                      {HARI_SINGKAT.map((h, idx) => {
                        const chosen = daysOfWeek.includes(idx);
                        return (
                          <Pressable
                            key={h}
                            onPress={() => toggleDayOfWeek(idx)}
                            style={[
                              styles.dayCircle,
                              {
                                backgroundColor: chosen
                                  ? theme.accent
                                  : theme.surfaceMuted,
                              },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '700',
                                color: chosen
                                  ? theme.onAccent
                                  : theme.textPrimary,
                              }}
                            >
                              {h}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                {frequency === 'custom_interval' ? (
                  <View style={{ marginTop: 12 }}>
                    <Text
                      style={[styles.subPanelTitle, { color: theme.textPrimary }]}
                    >
                      Atur Interval Custom (Setiap X hari/minggu/bulan):
                    </Text>
                    <View style={styles.quickBtnRow}>
                      <TextInput
                        value={intervalNum}
                        onChangeText={setIntervalNum}
                        keyboardType="numeric"
                        style={[
                          styles.timeInput,
                          {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            color: theme.textPrimary,
                          },
                        ]}
                      />
                      {(
                        [
                          { id: 'days', label: 'Hari' },
                          { id: 'weeks', label: 'Minggu' },
                          { id: 'months', label: 'Bulan' },
                        ] as const
                      ).map((u) => (
                        <Pressable
                          key={u.id}
                          onPress={() => setIntervalUnit(u.id)}
                          style={[
                            styles.miniBtn,
                            {
                              backgroundColor:
                                intervalUnit === u.id
                                  ? theme.accent
                                  : theme.surfaceMuted,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color:
                                intervalUnit === u.id
                                  ? theme.onAccent
                                  : theme.textPrimary,
                            }}
                          >
                            {u.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Opsi Batas Akhir Pengulangan */}
                <Text
                  style={[
                    styles.subPanelTitle,
                    { color: theme.textPrimary, marginTop: 14 },
                  ]}
                >
                  Batas Akhir Pengulangan:
                </Text>
                <View style={styles.quickBtnRow}>
                  {(
                    [
                      { id: 'never', label: 'Tanpa Batas' },
                      { id: 'on_date', label: 'Sampai Tanggal' },
                      { id: 'after_count', label: 'Jumlah Kali' },
                    ] as const
                  ).map((et) => (
                    <Pressable
                      key={et.id}
                      onPress={() => setEndType(et.id)}
                      style={[
                        styles.miniBtn,
                        {
                          backgroundColor:
                            endType === et.id
                              ? theme.accent
                              : theme.surfaceMuted,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color:
                            endType === et.id
                              ? theme.onAccent
                              : theme.textPrimary,
                        }}
                      >
                        {et.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {endType === 'on_date' ? (
                  <TextInput
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.input,
                      {
                        marginTop: 8,
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                ) : null}

                {endType === 'after_count' ? (
                  <View style={[styles.quickBtnRow, { marginTop: 8 }]}>
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                      Berakhir setelah:
                    </Text>
                    <TextInput
                      value={endCount}
                      onChangeText={setEndCount}
                      keyboardType="numeric"
                      style={[
                        styles.timeInput,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                          color: theme.textPrimary,
                        },
                      ]}
                    />
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                      kali pengulangan
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* 6. Subtask / Checklist */}
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Subtask / Checklist (Pecah Jadi Langkah Kecil)
            </Text>
            <View
              style={[
                styles.subPanel,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              {subtaskDrafts.map((st, idx) => (
                <View
                  key={`${st.id || idx}`}
                  style={[
                    styles.subtaskDraftRow,
                    { borderBottomColor: theme.border },
                  ]}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13.5,
                      color: theme.textPrimary,
                      fontWeight: '500',
                    }}
                  >
                    {idx + 1}. {st.title}
                  </Text>
                  <Pressable
                    onPress={() => handleRemoveSubtask(idx)}
                    style={styles.removeSubBtn}
                  >
                    <Text
                      style={{
                        color: theme.statusOverdue,
                        fontSize: 12,
                        fontWeight: '700',
                      }}
                    >
                      Hapus
                    </Text>
                  </Pressable>
                </View>
              ))}

              <View style={styles.addSubtaskRow}>
                <TextInput
                  value={newSubtaskText}
                  onChangeText={setNewSubtaskText}
                  onSubmitEditing={handleAddSubtask}
                  placeholder="Tambah langkah (misal: Mencari jurnal referensi)"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.subtaskInput,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                />
                <Pressable
                  onPress={handleAddSubtask}
                  style={[
                    styles.addSubBtn,
                    { backgroundColor: theme.accent },
                  ]}
                >
                  <Text
                    style={{
                      color: theme.onAccent,
                      fontWeight: '800',
                      fontSize: 13,
                    }}
                  >
                    + Tambah
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 7. Notifikasi Pengingat (Grid 4 Kolom Serentak & Marquee) */}
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Notifikasi Pengingat
            </Text>
            <View style={styles.grid4Wrap}>
              {REMINDER_OFFSET_OPTIONS.map((rem) => {
                const active = !isCustomReminder && reminderOffset === rem.value;
                return (
                  <Pressable
                    key={rem.label}
                    onPress={() => {
                      setIsCustomReminder(false);
                      setReminderOffset(rem.value);
                    }}
                    style={[
                      styles.grid4Item,
                      {
                        backgroundColor: active
                          ? theme.accent
                          : theme.surfaceMuted,
                        borderColor: active ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <View style={styles.gridItemTextWrap}>
                      <MarqueeText
                        text={rem.label}
                        style={[
                          styles.gridItemText,
                          {
                            color: active ? theme.onAccent : theme.textPrimary,
                          },
                        ]}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Slot Kotak Full: Custom Notifikasi Pengingat (Hari / Jam / Menit Sebelum) */}
            <View
              style={[
                styles.customReminderBox,
                {
                  backgroundColor: isCustomReminder
                    ? theme.accentSoft
                    : theme.surfaceMuted,
                  borderColor: isCustomReminder ? theme.accent : theme.border,
                },
              ]}
            >
              <Pressable
                onPress={() =>
                  applyCustomReminder(customReminderVal || '2', customReminderUnit)
                }
                style={styles.customReminderHeader}
              >
                <View style={styles.customReminderTitleRow}>
                  <Feather
                    name="bell"
                    size={16}
                    color={isCustomReminder ? theme.accent : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.customReminderTitle,
                      {
                        color: isCustomReminder
                          ? theme.accent
                          : theme.textPrimary,
                      },
                    ]}
                  >
                    Kustom Notifikasi Pengingat
                  </Text>
                </View>
                <View
                  style={[
                    styles.customReminderActiveBadge,
                    {
                      backgroundColor: isCustomReminder
                        ? theme.accent
                        : theme.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.customReminderActiveText,
                      {
                        color: isCustomReminder
                          ? theme.onAccent
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    {isCustomReminder ? '✓ Dipakai' : 'Pilih Kustom'}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.customReminderBody}>
                {/* Stepper Jumlah Waktu */}
                <View style={styles.customReminderStepperRow}>
                  <Text
                    style={[
                      styles.customReminderStepperLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Ingatkan sebelum:
                  </Text>
                  <View style={styles.stepperControl}>
                    <Pressable
                      onPress={() => adjustCustomReminderNum(-1)}
                      style={[
                        styles.stepperNumBtn,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Feather
                        name="minus"
                        size={16}
                        color={theme.textPrimary}
                      />
                    </Pressable>
                    <TextInput
                      value={customReminderVal}
                      onChangeText={(txt) =>
                        applyCustomReminder(txt, customReminderUnit)
                      }
                      keyboardType="number-pad"
                      maxLength={3}
                      selectTextOnFocus
                      style={[
                        styles.stepperNumInput,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                          color: theme.textPrimary,
                        },
                      ]}
                    />
                    <Pressable
                      onPress={() => adjustCustomReminderNum(1)}
                      style={[
                        styles.stepperNumBtn,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Feather
                        name="plus"
                        size={16}
                        color={theme.textPrimary}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* 3 Opsi Unit: Menit Sebelum / Jam Sebelum / Hari Sebelum */}
                <View style={styles.unitSegmentRow}>
                  {[
                    { id: 'minutes' as const, label: 'Menit Sebelum' },
                    { id: 'hours' as const, label: 'Jam Sebelum' },
                    { id: 'days' as const, label: 'Hari Sebelum' },
                  ].map((u) => {
                    const selected =
                      isCustomReminder && customReminderUnit === u.id;
                    return (
                      <Pressable
                        key={u.id}
                        onPress={() =>
                          applyCustomReminder(customReminderVal || '2', u.id)
                        }
                        style={[
                          styles.unitSegmentBtn,
                          {
                            backgroundColor: selected
                              ? theme.accent
                              : theme.surface,
                            borderColor: selected
                              ? theme.accent
                              : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.unitSegmentText,
                            {
                              color: selected
                                ? theme.onAccent
                                : theme.textPrimary,
                            },
                          ]}
                        >
                          {u.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Preview Keterangan Pengingat */}
                <View
                  style={[
                    styles.customReminderPreview,
                    { backgroundColor: theme.surface },
                  ]}
                >
                  <PawPrintIcon size={12} color={theme.accent} />
                  <Text
                    style={[
                      styles.customReminderPreviewText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {isCustomReminder
                      ? `Notifikasi akan berbunyi ${customReminderVal || 1} ${
                          customReminderUnit === 'days'
                            ? 'hari'
                            : customReminderUnit === 'hours'
                            ? 'jam'
                            : 'menit'
                        } sebelum tenggat waktu.`
                      : 'Ketuk slot ini untuk mengatur durasi pengingat bebas (hari/jam/menit sebelum).'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tombol Simpan Utama */}
            <Pressable
              onPress={handleSubmit}
              style={[
                styles.submitBtn,
                { backgroundColor: theme.accent },
              ]}
            >
              <PawPrintIcon size={18} color={theme.onAccent} />
              <Text style={[styles.submitBtnText, { color: theme.onAccent }]}>
                {editingTask ? 'Simpan Perubahan' : 'Simpan Kegiatan'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '92%',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  cancelBtn: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 28,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14.5,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 74,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  grid4Wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  grid4Item: {
    width: '23.4%',
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  gridItemTextWrap: {
    flex: 1,
    marginLeft: 4,
    height: 20,
    justifyContent: 'center',
  },
  gridItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deadlineTypeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  deadlineTypeBtn: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  simpleDateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  dateStepArrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dateDisplayCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInputClean: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    padding: 0,
    minWidth: 110,
  },
  dateReadableSub: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  subLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  customTimeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
  },
  customTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  customTimeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  timeBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeBoxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 4,
  },
  timeUnitCol: {
    alignItems: 'center',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeStepBtn: {
    width: 32,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDigitBox: {
    width: 50,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    padding: 0,
  },
  timeUnitLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 3,
  },
  timeColon: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: -14,
  },
  quickTimeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    justifyContent: 'center',
  },
  quickTimeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickTimeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  customReminderBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginTop: 10,
  },
  customReminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  customReminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customReminderTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  customReminderActiveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  customReminderActiveText: {
    fontSize: 11,
    fontWeight: '800',
  },
  customReminderBody: {
    gap: 10,
  },
  customReminderStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customReminderStepperLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  stepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperNumBtn: {
    width: 32,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperNumInput: {
    width: 52,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    padding: 0,
  },
  unitSegmentRow: {
    flexDirection: 'row',
    gap: 6,
  },
  unitSegmentBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unitSegmentText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  customReminderPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  customReminderPreviewText: {
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  choiceChipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  priorityTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  prioritySub: {
    fontSize: 11,
    lineHeight: 14,
  },
  subPanel: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  subPanelTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  quickBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  miniBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  stepBtn: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 13.5,
    fontWeight: '700',
  },
  timeInput: {
    width: 78,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  recurringHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  togglePill: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  freqCard: {
    width: '48%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  dayCircle: {
    minWidth: 42,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  subtaskDraftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  removeSubBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  subtaskInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13.5,
  },
  addSubBtn: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    marginTop: 22,
    minHeight: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
  },
});
