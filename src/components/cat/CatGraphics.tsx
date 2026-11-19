import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';

export const PawPrintIcon: React.FC<{
  size?: number;
  color?: string;
}> = ({ size = 18, color = '#FFFFFF' }) => {
  const padWidth = size * 0.56;
  const padHeight = size * 0.44;
  const toeSize = size * 0.24;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 4 Jari Kucing (Toe Beans) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'center',
          marginBottom: size * 0.05,
        }}
      >
        <View
          style={{
            width: toeSize,
            height: toeSize * 1.15,
            borderRadius: toeSize,
            backgroundColor: color,
            marginRight: size * 0.04,
            transform: [{ translateY: size * 0.08 }, { rotate: '-18deg' }],
          }}
        />
        <View
          style={{
            width: toeSize,
            height: toeSize * 1.2,
            borderRadius: toeSize,
            backgroundColor: color,
            marginRight: size * 0.05,
            transform: [{ rotate: '-6deg' }],
          }}
        />
        <View
          style={{
            width: toeSize,
            height: toeSize * 1.2,
            borderRadius: toeSize,
            backgroundColor: color,
            marginRight: size * 0.04,
            transform: [{ rotate: '6deg' }],
          }}
        />
        <View
          style={{
            width: toeSize,
            height: toeSize * 1.15,
            borderRadius: toeSize,
            backgroundColor: color,
            transform: [{ translateY: size * 0.08 }, { rotate: '18deg' }],
          }}
        />
      </View>
      {/* Bantalan Telapak Utama (Main Pad) */}
      <View
        style={{
          width: padWidth,
          height: padHeight,
          borderTopLeftRadius: padWidth * 0.48,
          borderTopRightRadius: padWidth * 0.48,
          borderBottomLeftRadius: padWidth * 0.36,
          borderBottomRightRadius: padWidth * 0.36,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

export const PawCheckbox: React.FC<{
  checked: boolean;
  inProgress?: boolean;
  accentColor?: string;
  onPress: () => void;
}> = ({ checked, inProgress = false, accentColor, onPress }) => {
  const { theme } = useAppTheme();
  const activeColor = accentColor || theme.statusCompleted;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.checkboxHitArea}
    >
      <View
        style={[
          styles.checkboxBox,
          {
            borderColor: checked
              ? activeColor
              : inProgress
              ? theme.statusInProgress
              : theme.border,
            backgroundColor: checked
              ? activeColor
              : inProgress
              ? theme.statusInProgressBg
              : theme.surface,
          },
        ]}
      >
        {checked ? (
          <PawPrintIcon size={16} color="#FFFFFF" />
        ) : inProgress ? (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: theme.statusInProgress,
            }}
          />
        ) : null}
      </View>
    </Pressable>
  );
};

export const CatMascotBadge: React.FC<{
  isNight: boolean;
  size?: number;
}> = ({ isNight, size = 56 }) => {
  const { theme } = useAppTheme();
  const headSize = size * 0.72;
  const earSize = size * 0.28;

  return (
    <View
      style={[
        styles.mascotWrap,
        {
          width: size,
          height: size,
          borderRadius: size * 0.34,
          backgroundColor: theme.accentSoft,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Indikator Matahari Pagi / Bulan Malam di Pojok */}
      <View
        style={[
          styles.skyOrb,
          {
            backgroundColor: isNight ? '#F09A4B' : '#F4B942',
          },
        ]}
      />
      {/* Telinga Kucing Kiri & Kanan */}
      <View style={[styles.earsRow, { width: headSize * 0.92 }]}>
        <View
          style={[
            styles.catEar,
            {
              width: earSize,
              height: earSize,
              backgroundColor: theme.accent,
              transform: [{ rotate: '-14deg' }],
            },
          ]}
        />
        <View
          style={[
            styles.catEar,
            {
              width: earSize,
              height: earSize,
              backgroundColor: theme.accent,
              transform: [{ rotate: '14deg' }],
            },
          ]}
        />
      </View>
      {/* Kepala Kucing */}
      <View
        style={[
          styles.catHead,
          {
            width: headSize,
            height: headSize * 0.82,
            borderRadius: headSize * 0.44,
            backgroundColor: theme.accent,
          },
        ]}
      >
        {/* Mata Kucing */}
        <View style={styles.eyesRow}>
          {isNight ? (
            <>
              <View style={styles.sleepyEye} />
              <View style={styles.sleepyEye} />
            </>
          ) : (
            <>
              <View style={styles.awakeEye} />
              <View style={styles.awakeEye} />
            </>
          )}
        </View>
        {/* Hidung Segitiga Kecil */}
        <View style={styles.catNose} />
      </View>
    </View>
  );
};

export const CategoryGlyph: React.FC<{
  icon: string;
  color: string;
  size?: number;
}> = ({ icon, color, size = 14 }) => {
  const cleanIcon = (icon || '').toLowerCase().trim();
  if (cleanIcon === 'paw' || cleanIcon === '🐾' || cleanIcon === 'pribadi') {
    return <PawPrintIcon size={size} color={color} />;
  }

  const iconNameMap: Record<string, keyof typeof Feather.glyphMap> = {
    briefcase: 'briefcase',
    '💼': 'briefcase',
    kerja: 'briefcase',
    book: 'book-open',
    '📚': 'book-open',
    kuliah: 'book-open',
    cart: 'shopping-bag',
    '🛒': 'shopping-bag',
    belanja: 'shopping-bag',
    star: 'star',
    '⭐': 'star',
    keinginan: 'star',
    heart: 'heart',
    '❤️': 'heart',
    '💖': 'heart',
    home: 'home',
    '🏠': 'home',
    code: 'code',
    '💻': 'code',
  };

  const name = iconNameMap[cleanIcon] || 'tag';
  return (
    <View
      style={{
        width: size + 2,
        height: size + 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Feather name={name} size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  checkboxHitArea: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotWrap: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  skyOrb: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  earsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: -6,
    zIndex: 1,
  },
  catEar: {
    borderTopLeftRadius: 3,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  catHead: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    paddingTop: 3,
  },
  eyesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '54%',
    marginBottom: 3,
  },
  awakeEye: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  sleepyEye: {
    width: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#12151E',
  },
  catNose: {
    width: 5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FFE3DC',
  },
});
