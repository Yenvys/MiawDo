import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Category, Priority, ResolvedTaskItem } from '../types';
import { useAppTheme } from '../theme/ThemeContext';
import { addDays, toDateString } from '../engine/dateUtils';
import {
  CategoryGlyph,
  CatMascotBadge,
  PawPrintIcon,
} from '../components/cat/CatGraphics';
import { TaskCard } from '../components/tasks/TaskCard';

type TaskStatusFilter =
  | 'active'
  | 'in_progress'
  | 'overdue'
  | 'completed'
  | 'cancelled'
  | 'all';

interface MyTasksScreenProps {
  items: ResolvedTaskItem[];
  categories: Category[];
  onToggleComplete: (instanceKey: string) => void;
  onToggleSubtask: (instanceKey: string, subtaskId: string) => void;
  onSelectItem: (item: ResolvedTaskItem, focusSnooze?: boolean) => void;
  onOpenAddModal: () => void;
  onOpenCategoryManager: () => void;
}

export const MyTasksScreen: React.FC<MyTasksScreenProps> = ({
  items,
  categories,
  onToggleComplete,
  onToggleSubtask,
  onSelectItem,
  onOpenAddModal,
  onOpenCategoryManager,
}) => {
  const { theme } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('active');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  const todayStr = toDateString(new Date());
  const next14DaysStr = addDays(todayStr, 14);

  const catMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  // Untuk tugas recurring di daftar My Tasks, tampilkan kemunculan masa lalu/hari ini + hingga 14 hari ke depan agar daftar tidak penuh jadwal berbulan-bulan ke depan (jadwal jauh tetap bisa dilihat di Kalender)
  const baseWindowItems = useMemo(() => {
    return items.filter(
      (i) => !i.isRecurring || !i.effectiveDate || i.effectiveDate <= next14DaysStr
    );
  }, [items, next14DaysStr]);

  const counts = useMemo(() => {
    return {
      active: baseWindowItems.filter(
        (i) => i.status === 'todo' || i.status === 'in_progress'
      ).length,
      in_progress: baseWindowItems.filter((i) => i.status === 'in_progress')
        .length,
      overdue: baseWindowItems.filter(
        (i) =>
          i.timeBadge === 'overdue' &&
          i.status !== 'completed' &&
          i.status !== 'cancelled'
      ).length,
      completed: baseWindowItems.filter((i) => i.status === 'completed').length,
      cancelled: baseWindowItems.filter((i) => i.status === 'cancelled').length,
      all: baseWindowItems.length,
    };
  }, [baseWindowItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return baseWindowItems.filter((item) => {
      if (statusFilter === 'active') {
        if (item.status !== 'todo' && item.status !== 'in_progress') {
          return false;
        }
      } else if (statusFilter === 'in_progress') {
        if (item.status !== 'in_progress') return false;
      } else if (statusFilter === 'overdue') {
        if (
          item.timeBadge !== 'overdue' ||
          item.status === 'completed' ||
          item.status === 'cancelled'
        ) {
          return false;
        }
      } else if (statusFilter === 'completed') {
        if (item.status !== 'completed') return false;
      } else if (statusFilter === 'cancelled') {
        if (item.status !== 'cancelled') return false;
      }

      if (
        selectedCategoryId !== 'all' &&
        item.categoryId !== selectedCategoryId
      ) {
        return false;
      }

      if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
        return false;
      }

      if (q) {
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchSub = item.subtasks.some((s) =>
          s.title.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchDesc && !matchSub) return false;
      }

      return true;
    });
  }, [
    baseWindowItems,
    statusFilter,
    selectedCategoryId,
    priorityFilter,
    searchQuery,
  ]);

  const statusTabs: { id: TaskStatusFilter; label: string; count: number }[] = [
    { id: 'active', label: 'Aktif', count: counts.active },
    { id: 'in_progress', label: 'Proses', count: counts.in_progress },
    { id: 'overdue', label: 'Terlambat', count: counts.overdue },
    { id: 'completed', label: 'Selesai', count: counts.completed },
    { id: 'all', label: 'Semua', count: counts.all },
    { id: 'cancelled', label: 'Batal', count: counts.cancelled },
  ];

  const hasActiveFilters =
    selectedCategoryId !== 'all' ||
    priorityFilter !== 'all' ||
    searchQuery.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Layar */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
            My Tasks
          </Text>
          <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
            Kelola kegiatan, kategori & prioritas
          </Text>
        </View>
        <Pressable
          onPress={onOpenCategoryManager}
          accessibilityRole="button"
          accessibilityLabel="Kelola Kategori"
          style={[
            styles.manageCatBtn,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Feather name="folder-plus" size={13} color={theme.accent} />
          <Text style={[styles.manageCatText, { color: theme.accent, marginLeft: 5 }]}>
            Kategori
          </Text>
        </Pressable>
      </View>

      {/* Kolom Pencarian */}
      <View style={styles.searchWrap}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Feather name="search" size={15} color={theme.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari kegiatan atau subtask..."
            placeholderTextColor={theme.textMuted}
            style={[
              styles.searchInput,
              { color: theme.textPrimary },
            ]}
          />
          {searchQuery ? (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              style={styles.clearSearchBtn}
            >
              <Feather name="x" size={14} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Tab Status */}
      <View style={styles.filterStripWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.id;
            const isOverdueTab = tab.id === 'overdue' && tab.count > 0;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setStatusFilter(tab.id)}
                style={[
                  styles.statusTabChip,
                  {
                    backgroundColor: active
                      ? theme.accent
                      : isOverdueTab
                      ? theme.statusOverdueBg
                      : theme.surface,
                    borderColor: active
                      ? theme.accent
                      : isOverdueTab
                      ? theme.statusOverdue
                      : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusTabLabel,
                    {
                      color: active
                        ? theme.onAccent
                        : isOverdueTab
                        ? theme.statusOverdue
                        : theme.textPrimary,
                      fontWeight: active ? '800' : '600',
                    },
                  ]}
                >
                  {tab.label} ({tab.count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Filter Kategori */}
      <View style={styles.filterStripWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          <Pressable
            onPress={() => setSelectedCategoryId('all')}
            style={[
              styles.catChip,
              {
                backgroundColor:
                  selectedCategoryId === 'all'
                    ? theme.accent
                    : theme.surface,
                borderColor:
                  selectedCategoryId === 'all'
                    ? theme.accent
                    : theme.border,
              },
            ]}
          >
            <PawPrintIcon
              size={13}
              color={selectedCategoryId === 'all' ? theme.onAccent : theme.accent}
            />
            <Text
              style={[
                styles.catChipText,
                {
                  color:
                    selectedCategoryId === 'all'
                      ? theme.onAccent
                      : theme.textPrimary,
                  marginLeft: 5,
                },
              ]}
            >
              Semua
            </Text>
          </Pressable>

          {categories.map((cat) => {
            const active = selectedCategoryId === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategoryId(cat.id)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: active ? cat.color : theme.surface,
                    borderColor: active ? cat.color : theme.border,
                  },
                ]}
              >
                <CategoryGlyph
                  icon={cat.icon}
                  color={active ? '#FFFFFF' : cat.color}
                  size={13}
                />
                <Text
                  style={[
                    styles.catChipText,
                    {
                      color: active ? '#FFFFFF' : theme.textPrimary,
                      marginLeft: 5,
                    },
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={onOpenCategoryManager}
            style={[
              styles.addCatChip,
              {
                backgroundColor: theme.surfaceMuted,
                borderColor: theme.border,
              },
            ]}
          >
            <Feather name="plus" size={12} color={theme.accent} />
            <Text style={[styles.addCatChipText, { color: theme.accent, marginLeft: 4 }]}>
              Kategori
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Filter Cepat Prioritas */}
      <View style={styles.priorityBar}>
        <Text style={[styles.priorityPrefixLabel, { color: theme.textMuted }]}>
          Prioritas:
        </Text>
        {(
          [
            { id: 'all', label: 'Semua', dotColor: undefined },
            { id: 'high', label: 'High', dotColor: theme.priorityHigh },
            { id: 'medium', label: 'Medium', dotColor: theme.priorityMedium },
            { id: 'low', label: 'Low', dotColor: theme.priorityLow },
          ] as const
        ).map((pf) => {
          const active = priorityFilter === pf.id;
          return (
            <Pressable
              key={pf.id}
              onPress={() => setPriorityFilter(pf.id)}
              style={[
                styles.prioBtn,
                {
                  backgroundColor: active
                    ? theme.accentSoft
                    : theme.surface,
                  borderColor: active ? theme.accent : theme.border,
                },
              ]}
            >
              {pf.dotColor ? (
                <View
                  style={[styles.prioDot, { backgroundColor: pf.dotColor }]}
                />
              ) : null}
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: active ? '800' : '600',
                  color: active ? theme.accent : theme.textSecondary,
                }}
              >
                {pf.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Daftar Tugas */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <CatMascotBadge isNight={theme.isNight} size={60} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {statusFilter === 'completed'
                ? 'Belum ada tugas yang selesai dicentang'
                : statusFilter === 'overdue'
                ? 'Miaw! Tidak ada tugas yang terlambat'
                : 'Tidak ada kegiatan yang cocok'}
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              {hasActiveFilters
                ? 'Coba ubah kata kunci pencarian atau reset filter kategori/prioritas.'
                : 'Tambahkan kegiatan baru untuk mulai mengatur daftar tugasmu.'}
            </Text>

            {hasActiveFilters ? (
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategoryId('all');
                  setPriorityFilter('all');
                }}
                style={[
                  styles.emptyActionBtn,
                  { backgroundColor: theme.surfaceMuted },
                ]}
              >
                <Text
                  style={{
                    color: theme.textPrimary,
                    fontWeight: '700',
                    fontSize: 13.5,
                  }}
                >
                  Reset Filter Pencarian
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={onOpenAddModal}
                style={[
                  styles.emptyActionBtn,
                  { backgroundColor: theme.accent },
                ]}
              >
                <PawPrintIcon size={15} color={theme.onAccent} />
                <Text
                  style={{
                    color: theme.onAccent,
                    fontWeight: '800',
                    fontSize: 13.5,
                  }}
                >
                  Tambah Kegiatan Baru
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          filteredItems.map((item) => (
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
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
  manageCatBtn: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageCatText: {
    fontSize: 12,
    fontWeight: '800',
  },
  searchWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBox: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterStripWrap: {
    marginBottom: 7,
  },
  horizontalScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  statusTabChip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTabLabel: {
    fontSize: 12,
  },
  catChip: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addCatChip: {
    minHeight: 32,
    flexDirection: 'row',
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCatChipText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  priorityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
  },
  priorityPrefixLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginRight: 2,
  },
  prioBtn: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  prioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  emptyActionBtn: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
