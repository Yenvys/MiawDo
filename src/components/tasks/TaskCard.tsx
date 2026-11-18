import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Category, ResolvedTaskItem } from '../../types';
import { useAppTheme } from '../../theme/ThemeContext';
import { CategoryGlyph, PawCheckbox, PawPrintIcon } from '../cat/CatGraphics';
import { formatTanggalPendek, toTimeString } from '../../engine/dateUtils';
import {
  PRIORITY_LABELS,
  TIME_BADGE_LABELS,
  WORKFLOW_STATUS_LABELS,
} from '../../engine/status';
import { formatRecurrenceRule } from '../../engine/recurrence';

interface TaskCardProps {
  item: ResolvedTaskItem;
  category?: Category;
  onToggleComplete: () => void;
  onToggleSubtask: (subtaskId: string) => void;
  onPressCard: () => void;
  onOpenSnooze: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  item,
  category,
  onToggleComplete,
  onToggleSubtask,
  onPressCard,
  onOpenSnooze,
}) => {
  const { theme } = useAppTheme();
  const [subtasksExpanded, setSubtasksExpanded] = useState(true);

  const isDone = item.status === 'completed';
  const isCancelled = item.status === 'cancelled';
  const isOverdue = item.timeBadge === 'overdue' && !isDone && !isCancelled;

  const priorityColors = {
    high: { text: theme.priorityHigh, bg: theme.priorityHighBg },
    medium: { text: theme.priorityMedium, bg: theme.priorityMediumBg },
    low: { text: theme.priorityLow, bg: theme.priorityLowBg },
  }[item.priority];

  const totalSubtasks = item.subtasks.length;
  const completedSubtasks = item.subtasks.filter((s) => s.isCompleted).length;
  const subtaskProgress =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const activeSnoozeText = (() => {
    if (!item.snoozedUntil) return null;
    const dt = new Date(item.snoozedUntil);
    if (dt.getTime() <= Date.now()) return null;
    return `Ditunda s/d ${toTimeString(dt)}`;
  })();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: isOverdue ? theme.statusOverdue : theme.border,
          opacity: isCancelled ? 0.68 : 1,
        },
      ]}
    >
      <View style={styles.topRow}>
        <PawCheckbox
          checked={isDone}
          inProgress={item.status === 'in_progress'}
          accentColor={category?.color || theme.statusCompleted}
          onPress={onToggleComplete}
        />

        <Pressable style={styles.mainContent} onPress={onPressCard}>
          {/* Baris Tag Atas: Kategori + Prioritas + Badge Waktu */}
          <View style={styles.badgesWrap}>
            {category ? (
              <View
                style={[
                  styles.badgeChip,
                  {
                    backgroundColor: theme.surfaceMuted,
                    borderColor: theme.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <CategoryGlyph
                  icon={category.icon}
                  color={category.color}
                  size={12}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: theme.textPrimary, marginLeft: 4 },
                  ]}
                >
                  {category.name}
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.badgeChip,
                { backgroundColor: priorityColors.bg },
              ]}
            >
              <PawPrintIcon size={11} color={priorityColors.text} />
              <Text
                style={[
                  styles.badgeText,
                  { color: priorityColors.text, marginLeft: 4 },
                ]}
              >
                {PRIORITY_LABELS[item.priority]}
              </Text>
            </View>

            {isOverdue ? (
              <View
                style={[
                  styles.badgeChip,
                  { backgroundColor: theme.statusOverdueBg },
                ]}
              >
                <Text style={[styles.badgeText, { color: theme.statusOverdue }]}>
                  Overdue
                </Text>
              </View>
            ) : item.timeBadge !== 'no_date' && !isDone ? (
              <View
                style={[
                  styles.badgeChip,
                  { backgroundColor: theme.surfaceMuted },
                ]}
              >
                <Text
                  style={[styles.badgeText, { color: theme.textSecondary }]}
                >
                  {TIME_BADGE_LABELS[item.timeBadge]}
                </Text>
              </View>
            ) : null}

            {item.status !== 'todo' ? (
              <View
                style={[
                  styles.badgeChip,
                  {
                    backgroundColor:
                      item.status === 'completed'
                        ? theme.statusCompletedBg
                        : item.status === 'in_progress'
                        ? theme.statusInProgressBg
                        : theme.statusCancelledBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color:
                        item.status === 'completed'
                          ? theme.statusCompleted
                          : item.status === 'in_progress'
                          ? theme.statusInProgress
                          : theme.statusCancelled,
                    },
                  ]}
                >
                  {WORKFLOW_STATUS_LABELS[item.status]}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Judul Kegiatan */}
          <Text
            style={[
              styles.title,
              {
                color:
                  isDone || isCancelled ? theme.textMuted : theme.textPrimary,
                textDecorationLine:
                  isDone || isCancelled ? 'line-through' : 'none',
              },
            ]}
          >
            {item.title}
          </Text>

          {/* Deskripsi singkat bila ada */}
          {item.description ? (
            <Text
              numberOfLines={2}
              style={[styles.description, { color: theme.textSecondary }]}
            >
              {item.description}
            </Text>
          ) : null}

          {/* Baris Info Tanggal, Jam, Recurring & Snooze */}
          <View style={styles.metaRow}>
            {item.deadlineType !== 'none' && item.effectiveDate ? (
              <Text
                style={[
                  styles.metaText,
                  {
                    color: isOverdue
                      ? theme.statusOverdue
                      : theme.textSecondary,
                    fontWeight: isOverdue ? '700' : '500',
                  },
                ]}
              >
                {formatTanggalPendek(item.effectiveDate)}
                {item.effectiveTime ? ` · ${item.effectiveTime}` : ' · Seharian'}
              </Text>
            ) : (
              <Text style={[styles.metaText, { color: theme.textMuted }]}>
                Tanpa tenggat waktu
              </Text>
            )}

            {item.isRecurring && item.recurrenceRule ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="repeat" size={11} color={theme.accent} />
                <Text style={[styles.metaText, { color: theme.accent }]}>
                  {formatRecurrenceRule(item.recurrenceRule)}
                </Text>
              </View>
            ) : null}

            {activeSnoozeText ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="bell" size={11} color={theme.statusInProgress} />
                <Text
                  style={[styles.metaText, { color: theme.statusInProgress }]}
                >
                  {activeSnoozeText}
                </Text>
              </View>
            ) : null}
          </View>
        </Pressable>

        {/* Tombol Cepat Tunda / Snooze jika belum selesai */}
        {!isDone && !isCancelled ? (
          <Pressable
            onPress={onOpenSnooze}
            style={[
              styles.snoozeBtn,
              {
                backgroundColor: theme.surfaceMuted,
                borderColor: theme.border,
              },
            ]}
            accessibilityLabel="Tunda pengingat atau jadwalkan ulang"
          >
            <Text style={[styles.snoozeBtnText, { color: theme.textPrimary }]}>
              Tunda
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Daftar Subtask / Checklist */}
      {totalSubtasks > 0 ? (
        <View
          style={[
            styles.subtaskSection,
            { borderTopColor: theme.border },
          ]}
        >
          <Pressable
            onPress={() => setSubtasksExpanded((prev) => !prev)}
            style={styles.subtaskHeader}
          >
            <Text style={[styles.subtaskCount, { color: theme.textSecondary }]}>
              Subtask ({completedSubtasks}/{totalSubtasks} selesai ·{' '}
              {subtaskProgress}%)
            </Text>
            <Text style={[styles.subtaskToggle, { color: theme.accent }]}>
              {subtasksExpanded ? 'Sembunyikan' : 'Lihat checklist'}
            </Text>
          </Pressable>

          {/* Progress Bar Subtask */}
          <View
            style={[
              styles.subtaskBarTrack,
              { backgroundColor: theme.surfaceMuted },
            ]}
          >
            <View
              style={[
                styles.subtaskBarFill,
                {
                  width: `${subtaskProgress}%`,
                  backgroundColor:
                    subtaskProgress === 100
                      ? theme.statusCompleted
                      : theme.accent,
                },
              ]}
            />
          </View>

          {subtasksExpanded ? (
            <View style={styles.subtaskList}>
              {item.subtasks.map((st) => (
                <Pressable
                  key={st.id}
                  onPress={() => onToggleSubtask(st.id)}
                  style={styles.subtaskItem}
                >
                  <View
                    style={[
                      styles.subtaskCheck,
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
                      <Text style={styles.subtaskCheckMark}>✓</Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.subtaskTitle,
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
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 6,
  },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  snoozeBtn: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  snoozeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtaskSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  subtaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subtaskCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtaskToggle: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtaskBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  subtaskBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  subtaskList: {
    gap: 4,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  subtaskCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  subtaskCheckMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  subtaskTitle: {
    fontSize: 13.5,
    fontWeight: '500',
    flex: 1,
  },
});
