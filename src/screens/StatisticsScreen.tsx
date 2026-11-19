import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppSettings, Category, ResolvedTaskItem } from '../types';
import { useAppTheme } from '../theme/ThemeContext';
import {
  addDays,
  formatTanggalPendek,
  getWeekDates,
  HARI_SINGKAT,
  parseDateString,
  toDateString,
} from '../engine/dateUtils';
import {
  CategoryGlyph,
  CatMascotBadge,
  PawPrintIcon,
} from '../components/cat/CatGraphics';

interface StatisticsScreenProps {
  items: ResolvedTaskItem[];
  categories: Category[];
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onSelectItem: (item: ResolvedTaskItem) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({
  items,
  categories,
  settings,
  onUpdateSettings,
  onSelectItem,
  onDeleteTask,
}) => {
  const { theme } = useAppTheme();
  const todayStr = toDateString(new Date());
  const weekDatesSet = useMemo(
    () => new Set(getWeekDates(todayStr)),
    [todayStr]
  );

  // Filter hanya tugas hingga hari ini (atau tanpa tanggal) agar persentase penyelesaian tidak terdistorsi jadwal bulan depan
  const relevantItems = useMemo(() => {
    return items.filter(
      (i) =>
        i.status !== 'cancelled' &&
        (!i.effectiveDate || i.effectiveDate <= todayStr || i.status === 'completed')
    );
  }, [items, todayStr]);

  const stats = useMemo(() => {
    const completedAll = relevantItems.filter((i) => i.status === 'completed');

    const completedToday = completedAll.filter((i) => {
      if (i.completedAt && i.completedAt.slice(0, 10) === todayStr) return true;
      return i.effectiveDate === todayStr;
    }).length;

    const completedThisWeek = completedAll.filter((i) => {
      if (i.completedAt && weekDatesSet.has(i.completedAt.slice(0, 10))) {
        return true;
      }
      return i.effectiveDate ? weekDatesSet.has(i.effectiveDate) : false;
    }).length;

    const overdueCount = relevantItems.filter(
      (i) => i.timeBadge === 'overdue' && i.status !== 'completed'
    ).length;

    const totalCount = relevantItems.length;
    const completionRate =
      totalCount > 0 ? Math.round((completedAll.length / totalCount) * 100) : 0;

    return {
      completedToday,
      completedThisWeek,
      completionRate,
      overdueCount,
      totalCompleted: completedAll.length,
      totalRelevant: totalCount,
    };
  }, [relevantItems, todayStr, weekDatesSet]);

  // Kategori kegiatan yang paling sering dikerjakan
  const categoryStats = useMemo(() => {
    const list = categories.map((cat) => {
      const catItems = relevantItems.filter((i) => i.categoryId === cat.id);
      const done = catItems.filter((i) => i.status === 'completed').length;
      const total = catItems.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        category: cat,
        done,
        total,
        pct,
      };
    });
    return list.sort((a, b) => b.done - a.done || b.total - a.total);
  }, [categories, relevantItems]);

  const topCategory = useMemo(() => {
    const withWork = categoryStats.filter((c) => c.done > 0 || c.total > 0);
    return withWork.length > 0 ? withWork[0] : null;
  }, [categoryStats]);

  // Data Grafik 7 Hari Terakhir
  const last7DaysChart = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, idx) =>
      addDays(todayStr, idx - 6)
    );
    const series = days.map((dStr) => {
      const dt = parseDateString(dStr);
      const dayItems = items.filter(
        (i) => i.effectiveDate === dStr && i.status !== 'cancelled'
      );
      const done = dayItems.filter((i) => i.status === 'completed').length;
      const total = dayItems.length;
      return {
        dateStr: dStr,
        dayLabel: HARI_SINGKAT[dt.getDay()],
        done,
        total,
      };
    });
    const maxVal = Math.max(1, ...series.map((s) => Math.max(s.done, s.total)));
    return { series, maxVal };
  }, [items, todayStr]);

  // Riwayat Tugas Selesai Lengkap & Kontrol Tampilan
  const [showAllHistory, setShowAllHistory] = useState(false);

  const allCompleted = useMemo(() => {
    return items
      .filter((i) => i.status === 'completed')
      .sort((a, b) =>
        (b.completedAt || b.effectiveDate || '').localeCompare(
          a.completedAt || a.effectiveDate || ''
        )
      );
  }, [items]);

  const displayedCompleted = useMemo(() => {
    return showAllHistory ? allCompleted : allCompleted.slice(0, 5);
  }, [allCompleted, showAllHistory]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
            Statistics & Riwayat
          </Text>
          <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
            Pantau capaian produktivitas dan kebiasaan kegiatanmu
          </Text>
        </View>
        <CatMascotBadge isNight={theme.isNight} size={48} />
      </View>

      {/* 4 Kartu Statistik Utama */}
      <View style={styles.statsGrid}>
        <View
          style={[
            styles.statBox,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.statNumber, { color: theme.statusCompleted }]}>
            {stats.completedToday}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Selesai Hari Ini
          </Text>
        </View>

        <View
          style={[
            styles.statBox,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.statNumber, { color: theme.accent }]}>
            {stats.completedThisWeek}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Selesai Minggu Ini
          </Text>
        </View>

        <View
          style={[
            styles.statBox,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
            {stats.completionRate}%
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Persentase Selesai
          </Text>
        </View>

        <View
          style={[
            styles.statBox,
            {
              backgroundColor:
                stats.overdueCount > 0 ? theme.statusOverdueBg : theme.surface,
              borderColor:
                stats.overdueCount > 0 ? theme.statusOverdue : theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.statNumber,
              {
                color:
                  stats.overdueCount > 0
                    ? theme.statusOverdue
                    : theme.textPrimary,
              },
            ]}
          >
            {stats.overdueCount}
          </Text>
          <Text
            style={[
              styles.statLabel,
              {
                color:
                  stats.overdueCount > 0
                    ? theme.statusOverdue
                    : theme.textSecondary,
              },
            ]}
          >
            Tugas Terlambat
          </Text>
        </View>
      </View>

      {/* Highlight Kategori Terpopuler */}
      <View
        style={[
          styles.highlightCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.highlightRow}>
          <PawPrintIcon size={18} color={theme.accent} />
          <Text style={[styles.highlightTitle, { color: theme.textPrimary }]}>
            Kategori Paling Sering Dikerjakan
          </Text>
        </View>

        {topCategory ? (
          <View style={styles.topCatRow}>
            <View
              style={[
                styles.topCatIcon,
                { backgroundColor: topCategory.category.color },
              ]}
            >
              <CategoryGlyph
                icon={topCategory.category.icon}
                color="#FFFFFF"
                size={16}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: theme.textPrimary,
                }}
              >
                {topCategory.category.name}
              </Text>
              <Text style={{ fontSize: 12.5, color: theme.textSecondary }}>
                {topCategory.done} selesai dari {topCategory.total} kegiatan (
                {topCategory.pct}%)
              </Text>
            </View>
          </View>
        ) : (
          <Text style={{ fontSize: 13, color: theme.textSecondary }}>
            Belum ada kegiatan yang tercatat.
          </Text>
        )}

        {/* Rincian Semua Kategori */}
        <View style={styles.catBreakdownList}>
          {categoryStats.map((cs) => (
            <View key={cs.category.id} style={styles.catBarItem}>
              <View style={styles.catBarLabelRow}>
                <View style={styles.catNameWrap}>
                  <CategoryGlyph
                    icon={cs.category.icon}
                    color={cs.category.color}
                    size={13}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: theme.textPrimary,
                      marginLeft: 6,
                    }}
                  >
                    {cs.category.name}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: theme.textSecondary,
                  }}
                >
                  {cs.done}/{cs.total} selesai ({cs.pct}%)
                </Text>
              </View>
              <View
                style={[
                  styles.catTrack,
                  { backgroundColor: theme.surfaceMuted },
                ]}
              >
                <View
                  style={[
                    styles.catFill,
                    {
                      width: `${cs.pct}%`,
                      backgroundColor: cs.category.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Grafik 7 Hari Terakhir */}
      <View
        style={[
          styles.chartCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.cardSectionTitle, { color: theme.textPrimary }]}>
          Berapa tugas yang diselesaikan dalam 7 hari terakhir?
        </Text>
        <Text style={[styles.cardSectionSub, { color: theme.textSecondary }]}>
          Perbandingan tugas selesai vs total terjadwal per hari
        </Text>

        <View style={styles.barsContainer}>
          {last7DaysChart.series.map((day) => {
            const totalHeightPct = Math.max(
              10,
              Math.round((day.total / last7DaysChart.maxVal) * 100)
            );
            const doneHeightPct =
              day.total > 0
                ? Math.round((day.done / last7DaysChart.maxVal) * 100)
                : 0;
            const isToday = day.dateStr === todayStr;

            return (
              <View key={day.dateStr} style={styles.barColumn}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: theme.textSecondary,
                    marginBottom: 4,
                  }}
                >
                  {day.done}/{day.total}
                </Text>
                <View
                  style={[
                    styles.barTrackVertical,
                    { backgroundColor: theme.surfaceMuted },
                  ]}
                >
                  {day.total > 0 ? (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${totalHeightPct}%`,
                        backgroundColor: theme.border,
                        borderRadius: 6,
                      }}
                    />
                  ) : null}
                  {day.done > 0 ? (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${doneHeightPct}%`,
                        backgroundColor: theme.statusCompleted,
                        borderRadius: 6,
                      }}
                    />
                  ) : null}
                </View>
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: isToday ? '800' : '600',
                    color: isToday ? theme.accent : theme.textSecondary,
                    marginTop: 6,
                  }}
                >
                  {day.dayLabel}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Pengaturan Pengingat Ringkasan Pagi */}
      <View
        style={[
          styles.digestCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.cardSectionTitle, { color: theme.textPrimary }]}>
            Notifikasi Ringkasan Pagi
          </Text>
          <Text style={{ fontSize: 12.5, color: theme.textSecondary, marginTop: 2 }}>
            Kirim pengingat daftar kegiatan hari ini setiap pukul{' '}
            {settings.morningDigestTime} pagi.
          </Text>
        </View>
        <Pressable
          onPress={() =>
            onUpdateSettings({
              morningDigestEnabled: !settings.morningDigestEnabled,
            })
          }
          style={[
            styles.digestToggle,
            {
              backgroundColor: settings.morningDigestEnabled
                ? theme.accent
                : theme.surfaceMuted,
            },
          ]}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '800',
              color: settings.morningDigestEnabled
                ? theme.onAccent
                : theme.textPrimary,
            }}
          >
            {settings.morningDigestEnabled ? 'Aktif' : 'Nonaktif'}
          </Text>
        </Pressable>
      </View>

      {/* Riwayat Tugas Selesai */}
      <View style={styles.historyHeadingRow}>
        <Text style={[styles.historyHeading, { color: theme.textPrimary }]}>
          Riwayat Tugas Selesai ({allCompleted.length})
        </Text>
        {allCompleted.length > 0 && onDeleteTask ? (
          <Pressable
            onPress={() => {
              Alert.alert(
                'Bersihkan Riwayat',
                'Hapus semua riwayat tugas yang sudah selesai? Data tugas selesai akan dihapus permanen.',
                [
                  { text: 'Batal', style: 'cancel' },
                  {
                    text: 'Bersihkan Semua',
                    style: 'destructive',
                    onPress: () => {
                      for (const item of allCompleted) {
                        onDeleteTask(item.taskId);
                      }
                    },
                  },
                ]
              );
            }}
            hitSlop={8}
            style={styles.clearHistoryBtn}
          >
            <Feather name="trash-2" size={13} color={theme.statusOverdue} />
            <Text style={[styles.clearHistoryText, { color: theme.statusOverdue }]}>
              Bersihkan
            </Text>
          </Pressable>
        ) : null}
      </View>

      {allCompleted.length === 0 ? (
        <View
          style={[
            styles.emptyHistory,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={{ color: theme.textSecondary, fontSize: 13.5 }}>
            Belum ada riwayat tugas yang diselesaikan. Centang tugas pertamamu!
          </Text>
        </View>
      ) : (
        <>
          {displayedCompleted.map((item) => (
            <Pressable
              key={item.instanceKey}
              onPress={() => onSelectItem(item)}
              style={[
                styles.historyRow,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.historyPaw,
                  { backgroundColor: theme.statusCompleted },
                ]}
              >
                <PawPrintIcon size={14} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: theme.textPrimary,
                  }}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                  Selesai · {formatTanggalPendek(item.effectiveDate)}
                </Text>
              </View>
              {onDeleteTask ? (
                <Pressable
                  hitSlop={10}
                  onPress={(e) => {
                    e.stopPropagation();
                    Alert.alert(
                      'Hapus Riwayat',
                      `Hapus kegiatan "${item.title}" dari riwayat?`,
                      [
                        { text: 'Batal', style: 'cancel' },
                        {
                          text: 'Hapus',
                          style: 'destructive',
                          onPress: () => onDeleteTask(item.taskId),
                        },
                      ]
                    );
                  }}
                  style={[
                    styles.historyDeleteBtn,
                    { backgroundColor: theme.surfaceMuted },
                  ]}
                >
                  <Feather name="trash-2" size={14} color={theme.textMuted} />
                </Pressable>
              ) : null}
            </Pressable>
          ))}

          {/* Tombol Lihat Semua / Tampilkan Lebih Sedikit jika riwayat > 5 */}
          {allCompleted.length > 5 ? (
            <Pressable
              onPress={() => setShowAllHistory((p) => !p)}
              style={[
                styles.seeAllBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.seeAllText, { color: theme.accent }]}>
                {showAllHistory
                  ? 'Tampilkan Lebih Sedikit'
                  : `Lihat Semua (${allCompleted.length} Kegiatan Selesai)`}
              </Text>
              <Feather
                name={showAllHistory ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.accent}
                style={{ marginLeft: 6 }}
              />
            </Pressable>
          ) : null}
        </>
      )}

      {/* Kartu Informasi Aplikasi & Hak Cipta */}
      <View
        style={[
          styles.aboutCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.aboutHeader}>
          <CatMascotBadge isNight={theme.isNight} size={46} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.aboutTitle, { color: theme.textPrimary }]}>
                Miaw
              </Text>
              <Text style={[styles.aboutTitleAccent, { color: theme.accent }]}>
                Do
              </Text>
            </View>
            <Text
              style={[styles.aboutSubtitle, { color: theme.textSecondary }]}
            >
              Versi 1.1.0
            </Text>
          </View>
        </View>

        <View
          style={[styles.aboutDivider, { backgroundColor: theme.border }]}
        />

        <View style={styles.copyrightRow}>
          <PawPrintIcon size={13} color={theme.accent} />
          <Text
            style={[styles.aboutCopyrightText, { color: theme.textMuted }]}
          >
            © 2026 Yenvys
          </Text>
        </View>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    width: '48.2%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 3,
  },
  highlightCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  highlightTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  topCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  topCatIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBreakdownList: {
    gap: 10,
  },
  catBarItem: {
    gap: 5,
  },
  catBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  catFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSectionSub: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    paddingTop: 12,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barTrackVertical: {
    width: 22,
    height: 82,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  digestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  digestToggle: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  clearHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearHistoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 14,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyHistory: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  historyPaw: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 20,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  aboutTitleAccent: {
    fontSize: 16,
    fontWeight: '800',
  },
  aboutSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  aboutDivider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.6,
  },
  copyrightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aboutCopyrightText: {
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
});
