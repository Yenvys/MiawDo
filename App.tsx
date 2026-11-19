import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppProvider, useAppStore } from './src/context/AppContext';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import { ResolvedTaskItem, Task } from './src/types';
import { BottomTabBar, MainTabId } from './src/components/nav/BottomTabBar';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { MyTasksScreen } from './src/screens/MyTasksScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { StatisticsScreen } from './src/screens/StatisticsScreen';
import { TaskFormModal } from './src/components/tasks/TaskFormModal';
import { SnoozeAndDetailModal } from './src/components/tasks/SnoozeAndDetailModal';
import { CategoryManagerModal } from './src/components/tasks/CategoryManagerModal';
import { PawPrintIcon } from './src/components/cat/CatGraphics';
import { AnimatedAppLoader } from './src/components/loading/AnimatedAppLoader';
import {
  syncWidgetWithAppData,
  syncPendingWidgetActions,
  checkWidgetLaunchIntent,
} from './src/engine/widgetSync';

const MainShell: React.FC = () => {
  const {
    isReady,
    categories,
    tasks,
    resolvedItems,
    settings,
    lastFeedbackMessage,
    clearFeedbackMessage,
    saveTask,
    deleteTask,
    setItemStatus,
    toggleItemCompleted,
    toggleSubtask,
    snoozeItem,
    rescheduleItem,
    saveCategory,
    removeCategory,
    updateSettings,
    getItemsForDate,
    loadSampleTasks,
    sendTestNotification,
  } = useAppStore();

  const { theme } = useAppTheme();

  const [activeTab, setActiveTab] = useState<MainTabId>('dashboard');
  const [formVisible, setFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formDefaultDate, setFormDefaultDate] = useState<string | null>(null);

  const [selectedInstanceKey, setSelectedInstanceKey] = useState<string | null>(
    null
  );
  const [detailFocusSnooze, setDetailFocusSnooze] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);

  // Auto-hide toast feedback setelah 3.2 detik
  useEffect(() => {
    if (!lastFeedbackMessage) return;
    const t = setTimeout(() => {
      clearFeedbackMessage();
    }, 3200);
    return () => clearTimeout(t);
  }, [lastFeedbackMessage, clearFeedbackMessage]);

  // Sinkronisasi data tugas dan tema aplikasi ke Native Widget
  useEffect(() => {
    if (!isReady) return;
    syncWidgetWithAppData(resolvedItems, theme.isNight);
  }, [isReady, resolvedItems, theme.isNight]);

  // Sinkronisasi aksi widget (centang tugas dari layar beranda / peluncuran dari widget)
  useEffect(() => {
    if (!isReady) return;

    const handleSyncAndLaunch = () => {
      syncPendingWidgetActions(setItemStatus);
      checkWidgetLaunchIntent().then((launch) => {
        if (!launch) return;
        if (launch.openAddTask) {
          handleOpenAddModal();
        } else if (launch.instanceKey) {
          setSelectedInstanceKey(launch.instanceKey);
        } else if (launch.openTaskId) {
          const match = resolvedItems.find((i) => i.taskId === launch.openTaskId);
          if (match) {
            setSelectedInstanceKey(match.instanceKey);
          }
        }
      });
    };

    handleSyncAndLaunch();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        handleSyncAndLaunch();
      }
    });

    return () => {
      sub.remove();
    };
  }, [isReady, setItemStatus, resolvedItems]);

  const selectedResolvedItem: ResolvedTaskItem | null = useMemo(() => {
    if (!selectedInstanceKey) return null;
    return (
      resolvedItems.find((i) => i.instanceKey === selectedInstanceKey) || null
    );
  }, [resolvedItems, selectedInstanceKey]);

  const overdueCount = useMemo(() => {
    return resolvedItems.filter(
      (i) =>
        i.timeBadge === 'overdue' &&
        i.status !== 'completed' &&
        i.status !== 'cancelled'
    ).length;
  }, [resolvedItems]);

  const handleOpenAddModal = (defaultDate?: string) => {
    setEditingTask(null);
    setFormDefaultDate(defaultDate || null);
    setFormVisible(true);
  };

  const handleSelectItem = (item: ResolvedTaskItem, focusSnooze = false) => {
    setSelectedInstanceKey(item.instanceKey);
    setDetailFocusSnooze(focusSnooze);
  };

  const handleEditFromDetail = () => {
    if (!selectedResolvedItem) return;
    const rawTask = tasks.find((t) => t.id === selectedResolvedItem.taskId);
    if (!rawTask) return;
    setEditingTask(rawTask);
    setFormDefaultDate(selectedResolvedItem.effectiveDate);
    setFormVisible(true);
  };

  if (!isReady || !splashFinished) {
    return (
      <AnimatedAppLoader
        minDuration={1800}
        onFinish={() => setSplashFinished(true)}
      />
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeRoot,
        {
          backgroundColor: theme.background,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
        },
      ]}
    >
      <StatusBar
        barStyle={theme.isNight ? 'light-content' : 'dark-content'}
      />

      {/* Toast Feedback Banner */}
      {lastFeedbackMessage ? (
        <Pressable
          onPress={clearFeedbackMessage}
          style={[
            styles.toastBanner,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.accent,
            },
          ]}
        >
          <PawPrintIcon size={15} color={theme.accent} />
          <Text style={[styles.toastText, { color: theme.textPrimary }]}>
            {lastFeedbackMessage}
          </Text>
        </Pressable>
      ) : null}

      {/* Konten Layar Utama */}
      <View style={styles.screenArea}>
        {activeTab === 'dashboard' ? (
          <DashboardScreen
            items={resolvedItems}
            categories={categories}
            onToggleComplete={toggleItemCompleted}
            onToggleSubtask={toggleSubtask}
            onSelectItem={handleSelectItem}
            onOpenAddModal={handleOpenAddModal}
            onNavigateTab={(t) => setActiveTab(t)}
            onLoadSampleTasks={loadSampleTasks}
            hasAnyTaskInDb={tasks.length > 0}
          />
        ) : null}

        {activeTab === 'tasks' ? (
          <MyTasksScreen
            items={resolvedItems}
            categories={categories}
            onToggleComplete={toggleItemCompleted}
            onToggleSubtask={toggleSubtask}
            onSelectItem={handleSelectItem}
            onOpenAddModal={() => handleOpenAddModal()}
            onOpenCategoryManager={() => setCategoryModalVisible(true)}
          />
        ) : null}

        {activeTab === 'calendar' ? (
          <CalendarScreen
            categories={categories}
            getItemsForDate={getItemsForDate}
            onToggleComplete={toggleItemCompleted}
            onToggleSubtask={toggleSubtask}
            onSelectItem={handleSelectItem}
            onOpenAddModal={(dt) => handleOpenAddModal(dt)}
          />
        ) : null}

        {activeTab === 'statistics' ? (
          <StatisticsScreen
            items={resolvedItems}
            categories={categories}
            settings={settings}
            onUpdateSettings={updateSettings}
            onSelectItem={(item) => handleSelectItem(item, false)}
            onDeleteTask={deleteTask}
          />
        ) : null}
      </View>

      {/* Navigasi Bawah (4 Tab + Tombol Tengah + Tugas) */}
      <BottomTabBar
        activeTab={activeTab}
        overdueCount={overdueCount}
        onSelectTab={setActiveTab}
        onPressQuickAdd={() => handleOpenAddModal()}
      />

      {/* Modal Tambah / Edit Kegiatan */}
      <TaskFormModal
        visible={formVisible}
        editingTask={editingTask}
        defaultDate={formDefaultDate}
        categories={categories}
        onClose={() => setFormVisible(false)}
        onSave={saveTask}
        onOpenCategoryManager={() => {
          setFormVisible(false);
          setTimeout(() => setCategoryModalVisible(true), 150);
        }}
      />

      {/* Modal Detail Tugas, Subtask & Snooze/Reschedule */}
      <SnoozeAndDetailModal
        visible={Boolean(selectedResolvedItem)}
        item={selectedResolvedItem}
        category={categories.find(
          (c) => c.id === selectedResolvedItem?.categoryId
        )}
        initialFocusSnooze={detailFocusSnooze}
        onClose={() => setSelectedInstanceKey(null)}
        onChangeStatus={(st) => {
          if (selectedResolvedItem) {
            setItemStatus(selectedResolvedItem.instanceKey, st);
          }
        }}
        onToggleSubtask={(subId) => {
          if (selectedResolvedItem) {
            toggleSubtask(selectedResolvedItem.instanceKey, subId);
          }
        }}
        onSnooze={(mins) => {
          if (selectedResolvedItem) {
            snoozeItem(selectedResolvedItem.instanceKey, mins);
          }
        }}
        onReschedule={(newDate, newTime) => {
          if (selectedResolvedItem) {
            rescheduleItem(selectedResolvedItem.instanceKey, newDate, newTime);
          }
        }}
        onEditTask={handleEditFromDetail}
        onDeleteTask={() => {
          if (selectedResolvedItem) {
            deleteTask(selectedResolvedItem.taskId);
          }
        }}
      />

      {/* Modal Kelola Kategori */}
      <CategoryManagerModal
        visible={categoryModalVisible}
        categories={categories}
        onClose={() => setCategoryModalVisible(false)}
        onSaveCategory={saveCategory}
        onDeleteCategory={removeCategory}
      />
    </SafeAreaView>
  );
};

const RootWithTheme: React.FC = () => {
  const { settings, updateSettings } = useAppStore();
  return (
    <ThemeProvider
      initialPreference={settings.themeMode}
      onPreferenceChange={(pref) => updateSettings({ themeMode: pref })}
    >
      <MainShell />
    </ThemeProvider>
  );
};

export default function App() {
  return (
    <AppProvider>
      <RootWithTheme />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
  },
  screenArea: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toastBanner: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 44 : 16,
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});
