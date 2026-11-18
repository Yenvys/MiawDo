import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { PawPrintIcon } from '../cat/CatGraphics';

const APP_ICON = require('../../../assets/icon.png');

interface AnimatedAppLoaderProps {
  onFinish?: () => void;
  minDuration?: number;
}

export const AnimatedAppLoader: React.FC<AnimatedAppLoaderProps> = ({
  onFinish,
  minDuration = 1800,
}) => {
  const { theme } = useAppTheme();

  // Animasi Value
  const bounceY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const pulseOrb = useRef(new Animated.Value(0.4)).current;
  const paw1Scale = useRef(new Animated.Value(0)).current;
  const paw2Scale = useRef(new Animated.Value(0)).current;
  const paw3Scale = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(10)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance Animation (Icon Pop-In & Text Slide-In)
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(textFade, {
        toValue: 1,
        duration: 650,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 650,
        delay: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Loop Animasi Mengapung Lembut (Floating & Breathing)
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bounceY, {
            toValue: -8,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.04,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(bounceY, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.0,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // 3. Loop Denyut Cahaya Lembut (Ambient Glow Aura)
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOrb, {
          toValue: 0.85,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOrb, {
          toValue: 0.35,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 4. Jejak Kaki Kucing Berurutan (Staggered Paw Steps)
    const pawsLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(paw1Scale, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(paw2Scale, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(paw3Scale, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(paw1Scale, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(paw2Scale, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(paw3Scale, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(200),
      ])
    );

    floatLoop.start();
    glowLoop.start();
    pawsLoop.start();

    // 5. Timer Transisi Keluar yang Mulus
    const exitTimer = setTimeout(() => {
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        onFinish?.();
      });
    }, minDuration);

    return () => {
      clearTimeout(exitTimer);
      floatLoop.stop();
      glowLoop.stop();
      pawsLoop.stop();
    };
  }, [
    bounceY,
    scale,
    pulseOrb,
    paw1Scale,
    paw2Scale,
    paw3Scale,
    textFade,
    textTranslateY,
    exitOpacity,
    minDuration,
    onFinish,
  ]);

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          backgroundColor: theme.background,
          opacity: exitOpacity,
        },
      ]}
    >
      <StatusBar
        barStyle={theme.isNight ? 'light-content' : 'dark-content'}
      />

      {/* Kontainer Utama Terpusat */}
      <View style={styles.centerContainer}>
        {/* Lingkaran Cahaya Lembut (Ambient Glow) */}
        <Animated.View
          style={[
            styles.glowBackdrop,
            {
              backgroundColor: theme.accentSoft,
              opacity: pulseOrb,
              transform: [
                {
                  scale: pulseOrb.interpolate({
                    inputRange: [0.35, 0.85],
                    outputRange: [0.95, 1.25],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Kartu Ikon Aplikasi Resmi dengan Animasi Floating & Breathing */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              shadowColor: theme.accent,
              borderColor: theme.isNight
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.06)',
              transform: [{ translateY: bounceY }, { scale }],
            },
          ]}
        >
          <Image
            source={APP_ICON}
            style={styles.iconImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Indikator Jejak Kaki Bertahap */}
        <View style={styles.pawsTrailRow}>
          <Animated.View
            style={[
              styles.pawItem,
              {
                opacity: paw1Scale,
                transform: [{ scale: paw1Scale }],
              },
            ]}
          >
            <PawPrintIcon size={14} color={theme.accent} />
          </Animated.View>
          <Animated.View
            style={[
              styles.pawItem,
              {
                opacity: paw2Scale,
                transform: [{ scale: paw2Scale }, { translateY: -3 }],
              },
            ]}
          >
            <PawPrintIcon size={18} color={theme.accent} />
          </Animated.View>
          <Animated.View
            style={[
              styles.pawItem,
              {
                opacity: paw3Scale,
                transform: [{ scale: paw3Scale }],
              },
            ]}
          >
            <PawPrintIcon size={22} color={theme.accent} />
          </Animated.View>
        </View>

        {/* Teks Branding MiawDo */}
        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: textFade,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <View style={styles.brandTitleRow}>
            <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
              Miaw
            </Text>
            <Text style={[styles.brandTitleAccent, { color: theme.accent }]}>
              Do
            </Text>
          </View>
          <Text style={[styles.brandTagline, { color: theme.textSecondary }]}>
            Tetap santai, satu per satu tugas pasti beres
          </Text>
        </Animated.View>
      </View>

      {/* Bagian Bawah: Hak Cipta / Copyright Resmi Yenvys */}
      <Animated.View style={[styles.copyrightContainer, { opacity: textFade }]}>
        <View style={styles.copyrightRow}>
          <PawPrintIcon size={12} color={theme.accent} />
          <Text style={[styles.copyrightText, { color: theme.textMuted }]}>
            © 2026 Yenvys • MiawDo
          </Text>
        </View>
        <Text style={[styles.copyrightSubtext, { color: theme.textMuted }]}>
          Clean & Cozy Cat Productivity App
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glowBackdrop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow di iOS
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    // Elevation di Android
    elevation: 10,
    marginBottom: 18,
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  pawsTrailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 14,
    height: 26,
  },
  pawItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 2,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  brandTitleAccent: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  brandTagline: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  copyrightContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 32,
    alignItems: 'center',
    gap: 4,
  },
  copyrightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyrightText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  copyrightSubtext: {
    fontSize: 10.5,
    fontWeight: '500',
    letterSpacing: 0.2,
    opacity: 0.85,
  },
});
