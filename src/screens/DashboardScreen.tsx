import React, { useMemo } from 'react';
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
  formatTanggalIndo,
  getGreetingByHour,
  toDateString,
} from '../engine/dateUtils';
import { CatMascotBadge, PawPrintIcon } from '../components/cat/CatGraphics';
import { TaskCard } from '../components/tasks/TaskCard';

interface DashboardScreenProps {
  items: ResolvedTaskItem[];
  categories: Category[];
  onToggleComplete: (instanceKey: string) => void;
  onToggleSubtask: (instanceKey: string, subtaskId: string) => void;
  onSelectItem: (item: ResolvedTaskItem, focusSnooze?: boolean) => void;
  onOpenAddModal: (defaultDate?: string) => void;
  onNavigateTab: (tab: 'tasks' | 'calendar' | 'statistics') => void;
  onLoadSampleTasks?: () => void;
  hasAnyTaskInDb?: boolean;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  items,
  categories,
  onToggleComplete,
  onToggleSubtask,
  onSelectItem,
  onOpenAddModal,
  onNavigateTab,
}) => {
  const { theme, themePreference, setThemePreference } = useAppTheme();

  const todayStr = toDateString(new Date());
  const greeting = useMemo(() => getGreetingByHour(new Date()), []);

  const catMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  // Progress Khusus Hari Ini
  const todayProgress = useMemo(() => {
    const todayValid = items.filter(
      (i) =>
        (i.effectiveDate === todayStr ||
          (i.timeBadge === 'overdue' && i.status !== 'completed')) &&
        i.status !== 'cancelled'
    );
    const total = todayValid.length;
    const done = todayValid.filter((i) => i.status === 'completed').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [items, todayStr]);

  // Daftar Tugas Hari Ini (+ Overdue aktif)
  const todayTasks = useMemo(() => {
    return items.filter(
      (i) =>
        (i.effectiveDate === todayStr ||
          (i.timeBadge === 'overdue' &&
            i.status !== 'completed' &&
            i.status !== 'cancelled')) &&
        i.status !== 'cancelled'
    );
  }, [items, todayStr]);

  const cycleThemeMode = () => {
    if (themePreference === 'auto_time') setThemePreference('morning');
    else if (themePreference === 'morning') setThemePreference('night');
    else setThemePreference('auto_time');
  };

  const themeBadgeLabel =
    themePreference === 'auto_time'
      ? `Otomatis (${theme.isNight ? 'Malam' : 'Pagi'})`
      : themePreference === 'morning'
      ? 'Tema Pagi'
      : 'Tema Malam';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Baris Atas: Tanggal & Tombol Tema Pagi/Malam */}
      <View style={styles.topUtilityRow}>
        <View style={styles.brandRow}>
          <PawPrintIcon size={20} color={theme.accent} />
          <Text style={[styles.brandName, { color: theme.textPrimary }]}>
            MiawDo
          </Text>
          <Text style={[styles.dateTopText, { color: theme.textSecondary }]}>
            · {formatTanggalIndo(todayStr, true)}
          </Text>
        </View>

        <Pressable
          onPress={cycleThemeMode}
          accessibilityRole="button"
          accessibilityLabel={`Ganti tema. Mode: ${themeBadgeLabel}`}
          style={[
            styles.themeIconBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Feather
            name={theme.isNight ? 'moon' : 'sun'}
            size={18}
            color={theme.accent}
          />
        </Pressable>
      </View>

      {/* Hero Sapaan Kucing */}
      <View
        style={[
          styles.greetingCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.greetingTextCol}>
          <Text style={[styles.greetingTitle, { color: theme.textPrimary }]}>
            {greeting.title}
          </Text>
          <Text
            style={[styles.greetingSubtitle, { color: theme.textSecondary }]}
          >
            {greeting.subtitle}
          </Text>
        </View>
        <CatMascotBadge isNight={theme.isNight} size={64} />
      </View>

      {/* Kartu Progress Hari Ini (Langsung, Bersih, Tanpa 4 Angka Dobel) */}
      <View
        style={[
          styles.progressCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.progressHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.progressTitle, { color: theme.textPrimary }]}>
              Progress Hari Ini
            </Text>
            <Text
              style={[styles.progressSubtitle, { color: theme.textSecondary }]}
            >
              {todayProgress.total === 0
                ? 'Belum ada kegiatan yang dijadwalkan hari ini.'
                : todayProgress.pct === 100
                ? 'Miaw! Semua kegiatan hari ini sudah selesai.'
                : `${todayProgress.done} dari ${todayProgress.total} tugas selesai`}
            </Text>
          </View>
          <View
            style={[
              styles.pctBadge,
              {
                backgroundColor:
                  todayProgress.pct === 100
                    ? theme.statusCompletedBg
                    : theme.accentSoft,
              },
            ]}
          >
            <PawPrintIcon
              size={14}
              color={
                todayProgress.pct === 100
                  ? theme.statusCompleted
                  : theme.accent
              }
            />
            <Text
              style={[
                styles.pctText,
                {
                  color:
                    todayProgress.pct === 100
                      ? theme.statusCompleted
                      : theme.accent,
                },
              ]}
            >
              {todayProgress.pct}%
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.surfaceMuted },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${todayProgress.pct}%`,
                backgroundColor:
                  todayProgress.pct === 100
                    ? theme.statusCompleted
                    : theme.accent,
              },
            ]}
          />
        </View>
      </View>

      {/* Daftar Kegiatan Hari Ini */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Kegiatan Hari Ini ({todayTasks.length})
        </Text>
        <Pressable onPress={() => onNavigateTab('tasks')}>
          <Text style={[styles.seeAllText, { color: theme.accent }]}>
            Lihat Semua
          </Text>
        </Pressable>
      </View>

      {todayTasks.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <CatMascotBadge isNight={theme.isNight} size={64} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            Miaw! Tidak ada kegiatan hari ini
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
            Semua kegiatan hari ini sudah selesai atau belum ada jadwal. Tambahkan kegiatan baru atau santai sejenak!
          </Text>

          <View style={styles.emptyActions}>
            <Pressable
              onPress={() => onOpenAddModal(todayStr)}
              style={[
                styles.primaryEmptyBtn,
                { backgroundColor: theme.accent },
              ]}
            >
              <PawPrintIcon size={15} color={theme.onAccent} />
              <Text
                style={[styles.primaryEmptyBtnText, { color: theme.onAccent }]}
              >
                Tambah Kegiatan Hari Ini
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        todayTasks.map((item) => (
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
  topUtilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  dateTopText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  themeIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  greetingTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 4,
  },
  progressCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  pctBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pctText: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  emptyActions: {
    width: '100%',
    gap: 10,
  },
  primaryEmptyBtn: {
    minHeight: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryEmptyBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryEmptyBtn: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryEmptyBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
