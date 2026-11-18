import React, { useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Category, ResolvedTaskItem, WorkflowStatus } from '../../types';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  addDays,
  formatTanggalIndo,
  toDateString,
  toTimeString,
} from '../../engine/dateUtils';
import {
  PRIORITY_LABELS,
  TIME_BADGE_LABELS,
  WORKFLOW_STATUS_LABELS,
} from '../../engine/status';
import { formatRecurrenceRule } from '../../engine/recurrence';
import { SNOOZE_PRESETS } from '../../engine/notifications';
import { Feather } from '@expo/vector-icons';
import { PawPrintIcon } from '../cat/CatGraphics';

interface SnoozeAndDetailModalProps {
  visible: boolean;
  item: ResolvedTaskItem | null;
  category?: Category;
  initialFocusSnooze?: boolean;
  onClose: () => void;
  onChangeStatus: (status: WorkflowStatus) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onSnooze: (minutes: number) => void;
  onReschedule: (newDate: string, newTime: string | null) => void;
  onEditTask: () => void;
  onDeleteTask: () => void;
}

export const SnoozeAndDetailModal: React.FC<SnoozeAndDetailModalProps> = ({
  visible,
  item,
  category,
  onClose,
  onChangeStatus,
  onToggleSubtask,
  onSnooze,
  onReschedule,
  onEditTask,
  onDeleteTask,
}) => {
  const { theme } = useAppTheme();
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);

  useEffect(() => {
    if (item) {
      const todayStr = toDateString(new Date());
      setCustomDate(item.effectiveDate || addDays(todayStr, 1));
      setCustomTime(item.effectiveTime || '09:00');
      setShowRescheduleForm(false);
    }
  }, [item]);

  if (!visible || !item) return null;

  const todayStr = toDateString(new Date());
  const tomorrowStr = addDays(todayStr, 1);
  const next3DaysStr = addDays(todayStr, 3);
  const nextWeekStr = addDays(todayStr, 7);

  const statuses: WorkflowStatus[] = [
    'todo',
    'in_progress',
    'completed',
    'cancelled',
  ];

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
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Header Sheet */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleRow}>
              <PawPrintIcon size={18} color={theme.accent} />
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                Detail & Pengingat Kegiatan
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: theme.surfaceMuted },
              ]}
            >
              <Text style={[styles.closeBtnText, { color: theme.textPrimary }]}>
                Tutup
              </Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Informasi Utama Tugas */}
            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.metaBadges}>
                {category ? (
                  <Text
                    style={[
                      styles.metaChip,
                      {
                        backgroundColor: theme.surfaceMuted,
                        color: category.color,
                      },
                    ]}
                  >
                    {category.name}
                  </Text>
                ) : null}
                <Text
                  style={[
                    styles.metaChip,
                    {
                      backgroundColor: theme.accentSoft,
                      color: theme.accent,
                    },
                  ]}
                >
                  Prioritas: {PRIORITY_LABELS[item.priority]}
                </Text>
                <Text
                  style={[
                    styles.metaChip,
                    {
                      backgroundColor:
                        item.timeBadge === 'overdue'
                          ? theme.statusOverdueBg
                          : theme.surfaceMuted,
                      color:
                        item.timeBadge === 'overdue'
                          ? theme.statusOverdue
                          : theme.textSecondary,
                    },
                  ]}
                >
                  {TIME_BADGE_LABELS[item.timeBadge]}
                </Text>
              </View>

              <Text style={[styles.taskTitle, { color: theme.textPrimary }]}>
                {item.title}
              </Text>

              {item.description ? (
                <Text
                  style={[styles.taskDesc, { color: theme.textSecondary }]}
                >
                  {item.description}
                </Text>
              ) : null}

              <View style={styles.scheduleMeta}>
                <Text
                  style={[styles.scheduleText, { color: theme.textSecondary }]}
                >
                  Jadwal: {formatTanggalIndo(item.effectiveDate)}
                  {item.effectiveTime ? ` pukul ${item.effectiveTime}` : ''}
                </Text>
                {item.isRecurring && item.recurrenceRule ? (
                  <Text style={[styles.scheduleText, { color: theme.accent }]}>
                    Perulangan: {formatRecurrenceRule(item.recurrenceRule)}
                  </Text>
                ) : null}
                {item.snoozedUntil &&
                new Date(item.snoozedUntil).getTime() > Date.now() ? (
                  <Text
                    style={[
                      styles.scheduleText,
                      { color: theme.statusInProgress },
                    ]}
                  >
                    Pengingat ditunda hingga:{' '}
                    {toTimeString(new Date(item.snoozedUntil))}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Ubah Status Kegiatan */}
            <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>
              Status Pengerjaan
            </Text>
            <View style={styles.statusRow}>
              {statuses.map((st) => {
                const active = item.status === st;
                return (
                  <Pressable
                    key={st}
                    onPress={() => onChangeStatus(st)}
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: active
                          ? theme.accent
                          : theme.surfaceMuted,
                        borderColor: active ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        {
                          color: active ? theme.onAccent : theme.textPrimary,
                        },
                      ]}
                    >
                      {WORKFLOW_STATUS_LABELS[st]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Subtask / Checklist */}
            {item.subtasks.length > 0 ? (
              <View style={styles.sectionBlock}>
                <Text
                  style={[styles.sectionLabel, { color: theme.textPrimary }]}
                >
                  Subtask / Checklist (
                  {item.subtasks.filter((s) => s.isCompleted).length}/
                  {item.subtasks.length})
                </Text>
                <View
                  style={[
                    styles.subtaskContainer,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {item.subtasks.map((st) => (
                    <Pressable
                      key={st.id}
                      onPress={() => onToggleSubtask(st.id)}
                      style={styles.subtaskRow}
                    >
                      <View
                        style={[
                          styles.subtaskBox,
                          {
                            borderColor: st.isCompleted
                              ? theme.statusCompleted
                              : theme.border,
                            backgroundColor: st.isCompleted
                              ? theme.statusCompleted
                              : 'transparent',
                          },
                        ]}
                      >
                        {st.isCompleted ? (
                          <Text style={styles.subtaskTick}>✓</Text>
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.subtaskLabel,
                          {
                            color: st.isCompleted
                              ? theme.textMuted
                              : theme.textPrimary,
                            textDecorationLine: st.isCompleted
                              ? 'line-through'
                              : 'none',
                          },
                        ]}
                      >
                        {st.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Fitur F: Snooze / Tunda Pengingat */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>
                Snooze / Tunda Pengingat
              </Text>
              <View style={styles.snoozeGrid}>
                {SNOOZE_PRESETS.map((preset) => (
                  <Pressable
                    key={preset.minutes}
                    onPress={() => {
                      onSnooze(preset.minutes);
                      onClose();
                    }}
                    style={[
                      styles.snoozeOptionBtn,
                      {
                        backgroundColor: theme.surfaceMuted,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Feather name="clock" size={13} color={theme.textSecondary} />
                      <Text
                        style={[
                          styles.snoozeOptionTitle,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}

                <Pressable
                  onPress={() => setShowRescheduleForm((p) => !p)}
                  style={[
                    styles.snoozeOptionBtn,
                    {
                      backgroundColor: theme.accentSoft,
                      borderColor: theme.accent,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="calendar" size={13} color={theme.accent} />
                    <Text
                      style={[styles.snoozeOptionTitle, { color: theme.accent }]}
                    >
                      Jadwalkan ulang (Reschedule)
                    </Text>
                  </View>
                </Pressable>
              </View>

              {showRescheduleForm ? (
                <View
                  style={[
                    styles.rescheduleBox,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.rescheduleTitle,
                      { color: theme.textPrimary },
                    ]}
                  >
                    Pilih Jadwal Baru Cepat:
                  </Text>
                  <View style={styles.quickDateRow}>
                    <Pressable
                      onPress={() => {
                        onReschedule(tomorrowStr, '09:00');
                        onClose();
                      }}
                      style={[
                        styles.quickDateBtn,
                        { backgroundColor: theme.surfaceMuted },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickDateText,
                          { color: theme.textPrimary },
                        ]}
                      >
                        Besok 09:00
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        onReschedule(next3DaysStr, item.effectiveTime || '09:00');
                        onClose();
                      }}
                      style={[
                        styles.quickDateBtn,
                        { backgroundColor: theme.surfaceMuted },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickDateText,
                          { color: theme.textPrimary },
                        ]}
                      >
                        +3 Hari
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        onReschedule(nextWeekStr, item.effectiveTime || '09:00');
                        onClose();
                      }}
                      style={[
                        styles.quickDateBtn,
                        { backgroundColor: theme.surfaceMuted },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickDateText,
                          { color: theme.textPrimary },
                        ]}
                      >
                        Minggu Depan
                      </Text>
                    </Pressable>
                  </View>

                  <Text
                    style={[
                      styles.rescheduleTitle,
                      { color: theme.textPrimary, marginTop: 10 },
                    ]}
                  >
                    Atau Masukkan Tanggal & Jam:
                  </Text>
                  <View style={styles.customInputRow}>
                    <TextInput
                      value={customDate}
                      onChangeText={setCustomDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.textMuted}
                      style={[
                        styles.rescheduleInput,
                        {
                          color: theme.textPrimary,
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                        },
                      ]}
                    />
                    <TextInput
                      value={customTime}
                      onChangeText={setCustomTime}
                      placeholder="HH:mm"
                      placeholderTextColor={theme.textMuted}
                      style={[
                        styles.rescheduleInput,
                        {
                          color: theme.textPrimary,
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                          flex: 0.6,
                        },
                      ]}
                    />
                    <Pressable
                      onPress={() => {
                        if (/^\d{4}-\d{2}-\d{2}$/.test(customDate.trim())) {
                          onReschedule(
                            customDate.trim(),
                            customTime.trim() || null
                          );
                          onClose();
                        }
                      }}
                      style={[
                        styles.applyRescheduleBtn,
                        { backgroundColor: theme.accent },
                      ]}
                    >
                      <Text
                        style={[
                          styles.applyRescheduleText,
                          { color: theme.onAccent },
                        ]}
                      >
                        Simpan
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Aksi Edit & Hapus */}
            <View style={styles.bottomActions}>
              <Pressable
                onPress={() => {
                  onClose();
                  onEditTask();
                }}
                style={[
                  styles.editBtn,
                  {
                    backgroundColor: theme.surfaceMuted,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.editBtnText, { color: theme.textPrimary }]}>
                  Edit Kegiatan
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  onDeleteTask();
                  onClose();
                }}
                style={[
                  styles.deleteBtn,
                  {
                    backgroundColor: theme.statusOverdueBg,
                    borderColor: theme.statusOverdue,
                  },
                ]}
              >
                <Text
                  style={[styles.deleteBtnText, { color: theme.statusOverdue }]}
                >
                  Hapus
                </Text>
              </Pressable>
            </View>
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
    maxHeight: '88%',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollBody: {
    paddingBottom: 16,
  },
  infoBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  metaBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metaChip: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  taskDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  scheduleMeta: {
    marginTop: 10,
    gap: 4,
  },
  scheduleText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  sectionBlock: {
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  subtaskContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    paddingVertical: 4,
  },
  subtaskBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  subtaskTick: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  subtaskLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  snoozeGrid: {
    gap: 8,
  },
  snoozeOptionBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  snoozeOptionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  rescheduleBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  rescheduleTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  quickDateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickDateBtn: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDateText: {
    fontSize: 12,
    fontWeight: '700',
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  rescheduleInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  applyRescheduleBtn: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyRescheduleText: {
    fontSize: 13,
    fontWeight: '800',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  editBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
