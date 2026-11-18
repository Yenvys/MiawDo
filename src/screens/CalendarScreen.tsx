import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Category, ResolvedTaskItem } from '../types';
import { useAppTheme } from '../theme/ThemeContext';
import {
  addDays,
  BULAN_INDONESIA,
  formatTanggalIndo,
  getMonthCalendarGrid,
  getWeekDates,
  HARI_SINGKAT,
  parseDateString,
  toDateString,
} from '../engine/dateUtils';
import { CatMascotBadge, PawPrintIcon } from '../components/cat/CatGraphics';
import { TaskCard } from '../components/tasks/TaskCard';

type CalendarMode = 'daily' | 'weekly' | 'monthly';

interface CalendarScreenProps {
  categories: Category[];
  getItemsForDate: (dateStr: string) => ResolvedTaskItem[];
  onToggleComplete: (instanceKey: string) => void;
  onToggleSubtask: (instanceKey: string, subtaskId: string) => void;
  onSelectItem: (item: ResolvedTaskItem, focusSnooze?: boolean) => void;
  onOpenAddModal: (defaultDate: string) => void;
}

const WEEK_HEADERS_MON_FIRST = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  categories,
  getItemsForDate,
  onToggleComplete,
  onToggleSubtask,
  onSelectItem,
  onOpenAddModal,
}) => {
  const { theme } = useAppTheme();
  const todayStr = toDateString(new Date());

  const [mode, setMode] = useState<CalendarMode>('monthly');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const selectedDt = useMemo(
    () => parseDateString(selectedDate),
    [selectedDate]
  );
  const viewYear = selectedDt.getFullYear();
  const viewMonth = selectedDt.getMonth();

  const catMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  // Grid bulanan (42 sel)
  const monthCells = useMemo(
    () => getMonthCalendarGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  // Strip mingguan (7 hari)
  const weekDates = useMemo(
    () => getWeekDates(selectedDate),
    [selectedDate]
  );

  // Peta tugas untuk setiap tanggal yang tampil di layar
  const dateItemsMap = useMemo(() => {
    const map = new Map<string, ResolvedTaskItem[]>();
    const datesToLoad =
      mode === 'monthly'
        ? monthCells.map((c) => c.dateStr)
        : mode === 'weekly'
        ? weekDates
        : [selectedDate];

    // Tambahkan juga 7 hari ke depan dari hari ini untuk deteksi "Deadline Berdekatan"
    const upcoming7 = Array.from({ length: 7 }, (_, i) => addDays(todayStr, i));
    const uniqueDates = new Set([...datesToLoad, ...upcoming7, selectedDate]);

    for (const dStr of uniqueDates) {
      map.set(
        dStr,
        getItemsForDate(dStr).filter((i) => i.status !== 'cancelled')
      );
    }
    return map;
  }, [mode, monthCells, weekDates, selectedDate, todayStr, getItemsForDate]);

  const selectedDateTasks = useMemo(
    () => dateItemsMap.get(selectedDate) || [],
    [dateItemsMap, selectedDate]
  );

  // Pengelompokan waktu untuk tampilan Harian (Daily View)
  const dailyTimelineGroups = useMemo(() => {
    const allDay: ResolvedTaskItem[] = [];
    const morning: ResolvedTaskItem[] = [];
    const afternoon: ResolvedTaskItem[] = [];
    const night: ResolvedTaskItem[] = [];

    for (const item of selectedDateTasks) {
      if (!item.effectiveTime) {
        allDay.push(item);
        continue;
      }
      const hour = parseInt(item.effectiveTime.split(':')[0], 10) || 0;
      if (hour < 12) morning.push(item);
      else if (hour < 18) afternoon.push(item);
      else night.push(item);
    }
    return [
      { label: 'Seharian (All-Day)', items: allDay },
      { label: 'Pagi (00:00 - 11:59)', items: morning },
      { label: 'Siang & Sore (12:00 - 17:59)', items: afternoon },
      { label: 'Malam (18:00 - 23:59)', items: night },
    ].filter((g) => g.items.length > 0);
  }, [selectedDateTasks]);

  // Deteksi Deadline yang Berdekatan (7 hari ke depan yang memiliki jadwal aktif)
  const nearbyDeadlineDays = useMemo(() => {
    const results: { dateStr: string; count: number; highCount: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const dStr = addDays(todayStr, i);
      const list = (dateItemsMap.get(dStr) || []).filter(
        (t) => t.status !== 'completed' && t.status !== 'cancelled'
      );
      if (list.length > 0) {
        results.push({
          dateStr: dStr,
          count: list.length,
          highCount: list.filter((t) => t.priority === 'high').length,
        });
      }
    }
    return results;
  }, [dateItemsMap, todayStr]);

  const navigatePeriod = (direction: -1 | 1) => {
    if (mode === 'daily') {
      setSelectedDate(addDays(selectedDate, direction));
    } else if (mode === 'weekly') {
      setSelectedDate(addDays(selectedDate, direction * 7));
    } else {
      const nextMonthDate = new Date(
        viewYear,
        viewMonth + direction,
        1
      );
      setSelectedDate(toDateString(nextMonthDate));
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Kalender */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
            Calendar
          </Text>
          <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
            Jadwal kegiatan harian, mingguan, dan bulanan
          </Text>
        </View>

        <Pressable
          onPress={() => setSelectedDate(todayStr)}
          style={[
            styles.todayJumpBtn,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.todayJumpText, { color: theme.accent }]}>
            Hari Ini
          </Text>
        </Pressable>
      </View>

      {/* Switcher Mode Tampilan: Harian | Mingguan | Bulanan */}
      <View
        style={[
          styles.modeSwitchBar,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {(
          [
            { id: 'daily', label: 'Harian' },
            { id: 'weekly', label: 'Mingguan' },
            { id: 'monthly', label: 'Bulanan' },
          ] as const
        ).map((m) => {
          const active = mode === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => setMode(m.id)}
              style={[
                styles.modeBtn,
                {
                  backgroundColor: active ? theme.accent : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  { color: active ? theme.onAccent : theme.textSecondary },
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Navigasi Periode Waktu (< Bulan/Minggu/Hari >) */}
      <View
        style={[
          styles.periodNavCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Pressable
          onPress={() => navigatePeriod(-1)}
          accessibilityRole="button"
          accessibilityLabel="Periode sebelumnya"
          style={[styles.navArrowBtn, { backgroundColor: theme.surfaceMuted }]}
        >
          <Feather name="chevron-left" size={18} color={theme.textPrimary} />
        </Pressable>

        <Text style={[styles.periodLabel, { color: theme.textPrimary }]}>
          {mode === 'monthly'
            ? `${BULAN_INDONESIA[viewMonth]} ${viewYear}`
            : mode === 'weekly'
            ? `Minggu ${BULAN_INDONESIA[viewMonth]} ${viewYear}`
            : formatTanggalIndo(selectedDate, true)}
        </Text>

        <Pressable
          onPress={() => navigatePeriod(1)}
          accessibilityRole="button"
          accessibilityLabel="Periode berikutnya"
          style={[styles.navArrowBtn, { backgroundColor: theme.surfaceMuted }]}
        >
          <Feather name="chevron-right" size={18} color={theme.textPrimary} />
        </Pressable>
      </View>

      {/* TAMPILAN BULANAN (MONTHLY GRID) */}
      {mode === 'monthly' ? (
        <View
          style={[
            styles.calendarCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.weekHeaderRow}>
            {WEEK_HEADERS_MON_FIRST.map((dayName) => (
              <Text
                key={dayName}
                style={[styles.weekHeaderLabel, { color: theme.textSecondary }]}
              >
                {dayName}
              </Text>
            ))}
          </View>

          <View style={styles.monthGrid}>
            {monthCells.map((cell) => {
              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === todayStr;
              const cellTasks = dateItemsMap.get(cell.dateStr) || [];
              const activeCellTasks = cellTasks.filter(
                (t) => t.status !== 'completed'
              );
              const isDense = activeCellTasks.length >= 2;

              return (
                <Pressable
                  key={cell.dateStr}
                  onPress={() => setSelectedDate(cell.dateStr)}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: isSelected
                        ? theme.accent
                        : isDense
                        ? theme.accentSoft
                        : 'transparent',
                      borderColor: isToday ? theme.accent : 'transparent',
                      borderWidth: isToday && !isSelected ? 1.5 : 0,
                      opacity: cell.isCurrentMonth ? 1 : 0.38,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayCellNumber,
                      {
                        color: isSelected
                          ? theme.onAccent
                          : theme.textPrimary,
                      },
                    ]}
                  >
                    {cell.dayNumber}
                  </Text>

                  {/* Titik Indikator Kegiatan pada Tanggal */}
                  {cellTasks.length > 0 ? (
                    <View style={styles.dotsRow}>
                      {cellTasks.slice(0, 3).map((t) => {
                        const dotColor = isSelected
                          ? theme.onAccent
                          : t.priority === 'high'
                          ? theme.priorityHigh
                          : t.priority === 'medium'
                          ? theme.priorityMedium
                          : theme.priorityLow;
                        return (
                          <View
                            key={t.instanceKey}
                            style={[
                              styles.taskDot,
                              { backgroundColor: dotColor },
                            ]}
                          />
                        );
                      })}
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* TAMPILAN MINGGUAN (WEEKLY STRIP) */}
      {mode === 'weekly' ? (
        <View
          style={[
            styles.weekStripCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {weekDates.map((dStr) => {
            const dt = parseDateString(dStr);
            const isSelected = dStr === selectedDate;
            const isToday = dStr === todayStr;
            const dayTasks = dateItemsMap.get(dStr) || [];
            return (
              <Pressable
                key={dStr}
                onPress={() => setSelectedDate(dStr)}
                style={[
                  styles.weekDayBox,
                  {
                    backgroundColor: isSelected
                      ? theme.accent
                      : theme.background,
                    borderColor: isToday ? theme.accent : theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: isSelected ? theme.onAccent : theme.textSecondary,
                  }}
                >
                  {HARI_SINGKAT[dt.getDay()]}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '800',
                    marginVertical: 4,
                    color: isSelected ? theme.onAccent : theme.textPrimary,
                  }}
                >
                  {dt.getDate()}
                </Text>
                <View
                  style={[
                    styles.weekCountPill,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(255,255,255,0.22)'
                        : theme.surfaceMuted,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 10.5,
                      fontWeight: '800',
                      color: isSelected
                        ? theme.onAccent
                        : dayTasks.length > 0
                        ? theme.accent
                        : theme.textMuted,
                    }}
                  >
                    {dayTasks.length}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* Radar Deadline Berdekatan (7 Hari ke Depan) */}
      {nearbyDeadlineDays.length > 0 ? (
        <View
          style={[
            styles.nearbyCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.nearbyHeader}>
            <PawPrintIcon size={15} color={theme.accent} />
            <Text style={[styles.nearbyTitle, { color: theme.textPrimary }]}>
              Deadline Berdekatan (7 Hari ke Depan)
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.nearbyScroll}
          >
            {nearbyDeadlineDays.map((nd) => {
              const active = nd.dateStr === selectedDate;
              return (
                <Pressable
                  key={nd.dateStr}
                  onPress={() => setSelectedDate(nd.dateStr)}
                  style={[
                    styles.nearbyChip,
                    {
                      backgroundColor: active
                        ? theme.accentSoft
                        : theme.background,
                      borderColor: active ? theme.accent : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: theme.textPrimary,
                    }}
                  >
                    {formatTanggalIndo(nd.dateStr, true)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontWeight: '600',
                      color:
                        nd.highCount > 0
                          ? theme.priorityHigh
                          : theme.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    {nd.count} kegiatan aktif
                    {nd.highCount > 0 ? ` (${nd.highCount} High)` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Daftar Kegiatan pada Tanggal yang Diklik */}
      <View style={styles.selectedDateHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.selectedDateTitle, { color: theme.textPrimary }]}>
            {formatTanggalIndo(selectedDate)}
          </Text>
          <Text
            style={[styles.selectedDateSub, { color: theme.textSecondary }]}
          >
            {selectedDateTasks.length} kegiatan terjadwal
          </Text>
        </View>

        <Pressable
          onPress={() => onOpenAddModal(selectedDate)}
          accessibilityRole="button"
          accessibilityLabel="Tambah kegiatan di tanggal ini"
          style={[
            styles.addOnDateBtn,
            { backgroundColor: theme.accent },
          ]}
        >
          <Feather name="plus" size={14} color={theme.onAccent} />
          <Text style={[styles.addOnDateText, { color: theme.onAccent }]}>
            Kegiatan
          </Text>
        </Pressable>
      </View>

      {selectedDateTasks.length === 0 ? (
        <View
          style={[
            styles.emptyDateBox,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <CatMascotBadge isNight={theme.isNight} size={54} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            Miaw! Tanggal ini masih kosong
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Ketuk tombol "+ Tambah di Tanggal Ini" untuk membuat jadwal kegiatan
            pada {formatTanggalIndo(selectedDate)}.
          </Text>
        </View>
      ) : mode === 'daily' ? (
        dailyTimelineGroups.map((group) => (
          <View key={group.label} style={styles.timelineGroup}>
            <Text
              style={[styles.timelineGroupLabel, { color: theme.accent }]}
            >
              {group.label}
            </Text>
            {group.items.map((item) => (
              <TaskCard
                key={item.instanceKey}
                item={item}
                category={catMap.get(item.categoryId)}
                onToggleComplete={() => onToggleComplete(item.instanceKey)}
                onToggleSubtask={(subId) =>
                  onToggleSubtask(item.instanceKey, subId)
                }
                onPressCard={() => onSelectItem(item, false)}
                onOpenSnooze={() => onSelectItem(item, true)}
              />
            ))}
          </View>
        ))
      ) : (
        selectedDateTasks.map((item) => (
          <TaskCard
            key={item.instanceKey}
            item={item}
            category={catMap.get(item.categoryId)}
            onToggleComplete={() => onToggleComplete(item.instanceKey)}
            onToggleSubtask={(subId) =>
              onToggleSubtask(item.instanceKey, subId)
            }
            onPressCard={() => onSelectItem(item, false)}
            onOpenSnooze={() => onSelectItem(item, true)}
          />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  todayJumpBtn: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayJumpText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  modeSwitchBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  periodNavCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  calendarCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekHeaderLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayCellNumber: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 3,
  },
  taskDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  weekStripCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    gap: 6,
  },
  weekDayBox: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  weekCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nearbyCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  nearbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  nearbyTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  nearbyScroll: {
    gap: 8,
  },
  nearbyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  selectedDateSub: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  addOnDateBtn: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addOnDateText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyDateBox: {
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
  timelineGroup: {
    marginBottom: 10,
  },
  timelineGroupLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
});
