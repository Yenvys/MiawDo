import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { PawPrintIcon } from '../cat/CatGraphics';

export type MainTabId = 'dashboard' | 'tasks' | 'calendar' | 'statistics';

interface BottomTabBarProps {
  activeTab: MainTabId;
  overdueCount: number;
  onSelectTab: (tab: MainTabId) => void;
  onPressQuickAdd: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  overdueCount,
  onSelectTab,
  onPressQuickAdd,
}) => {
  const { theme } = useAppTheme();

  const renderTabItem = (
    id: MainTabId,
    label: string,
    iconName: keyof typeof Feather.glyphMap,
    badge?: number
  ) => {
    const active = activeTab === id;
    const iconColor = active ? theme.accent : theme.textMuted;
    return (
      <Pressable
        key={id}
        onPress={() => onSelectTab(id)}
        style={styles.tabBtn}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
      >
        <View style={styles.iconWrap}>
          <Feather name={iconName} size={20} color={iconColor} />
          {badge && badge > 0 ? (
            <View
              style={[
                styles.badgeDot,
                { backgroundColor: theme.statusOverdue },
              ]}
            >
              <Text style={styles.badgeDotText}>
                {badge > 9 ? '9+' : badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.tabLabel,
            {
              color: active ? theme.accent : theme.textSecondary,
              fontWeight: active ? '800' : '600',
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.barContainer,
        {
          backgroundColor: theme.tabBarBg,
          borderTopColor: theme.border,
        },
      ]}
    >
      {renderTabItem('dashboard', 'Dashboard', 'grid')}
      {renderTabItem('tasks', 'My Tasks', 'check-square', overdueCount)}

      {/* Tombol Tengah (+) Cat Paw Quick Add */}
      <View style={styles.centerBtnSlot}>
        <Pressable
          onPress={onPressQuickAdd}
          accessibilityRole="button"
          accessibilityLabel="Tambah kegiatan baru"
          style={[
            styles.centerAddBtn,
            {
              backgroundColor: theme.accent,
              borderColor: theme.tabBarBg,
              shadowColor: theme.accent,
            },
          ]}
        >
          <PawPrintIcon size={24} color={theme.onAccent} />
        </Pressable>
      </View>

      {renderTabItem('calendar', 'Calendar', 'calendar')}
      {renderTabItem('statistics', 'Statistics', 'bar-chart-2')}
    </View>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 70,
    borderTopWidth: 1,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  tabBtn: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -14,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDotText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  centerBtnSlot: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAddBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
