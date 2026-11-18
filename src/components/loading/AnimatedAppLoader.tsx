import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { PawPrintIcon } from '../cat/CatGraphics';

interface AnimatedAppLoaderProps {
  onFinish?: () => void;
  minDuration?: number;
}

export const AnimatedAppLoader: React.FC<AnimatedAppLoaderProps> = ({
  onFinish,
  minDuration = 1800,
}) => {
  const { theme } = useAppTheme();

  // Animasi Values
  const bounceY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const paw1Scale = useRef(new Animated.Value(0)).current;
  const paw2Scale = useRef(new Animated.Value(0)).current;
  const paw3Scale = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(8)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance Anim (Card Pop-in & Text Fade-in)
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 45,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(textFade, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Loop Mengapung & Bernapas Lembut (Floating & Breathing)
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

    // 3. Animasi Kedipan Mata Kucing Alami (Natural Blink)
    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(2600),
        Animated.timing(blinkAnim, {
          toValue: 0.1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    );

    // 4. Jejak Kaki Bertahap (Staggered Paws)
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
    blinkLoop.start();
    pawsLoop.start();

    // 5. Transisi Keluar yang Mulus
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
      blinkLoop.stop();
      pawsLoop.stop();
    };
  }, [
    bounceY,
    scale,
    blinkAnim,
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
        {/* Kartu Maskot Kucing Presisi & Rapi (Clean Geometric Cat Mascot) */}
        <Animated.View
          style={[
            styles.mascotCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.accent,
              transform: [{ translateY: bounceY }, { scale }],
            },
          ]}
        >
          {/* Indikator Langit / Orb Celestial (Matahari / Bulan) */}
          <View
            style={[
              styles.skyOrb,
              {
                backgroundColor: theme.isNight ? '#F09A4B' : '#F4B942',
              },
            ]}
          />

          {/* Maskot Kucing Rapi Terpusat */}
          <View style={styles.catStructure}>
            {/* Telinga Kucing Simetris */}
            <View style={styles.earsRow}>
              <View
                style={[
                  styles.catEar,
                  styles.leftEar,
                  { backgroundColor: theme.accent },
                ]}
              >
                <View
                  style={[
                    styles.innerEar,
                    styles.leftInnerEar,
                    { backgroundColor: theme.surface },
                  ]}
                />
              </View>

              <View
                style={[
                  styles.catEar,
                  styles.rightEar,
                  { backgroundColor: theme.accent },
                ]}
              >
                <View
                  style={[
                    styles.innerEar,
                    styles.rightInnerEar,
                    { backgroundColor: theme.surface },
                  ]}
                />
              </View>
            </View>

            {/* Kepala Kucing Bulat Presisi */}
            <View
              style={[
                styles.catHead,
                { backgroundColor: theme.accent },
              ]}
            >
              {/* Kumis Kiri */}
              <View style={styles.leftWhiskers}>
                <View style={[styles.whisker, styles.whiskerTopLeft]} />
                <View style={[styles.whisker, styles.whiskerBottomLeft]} />
              </View>

              {/* Kumis Kanan */}
              <View style={styles.rightWhiskers}>
                <View style={[styles.whisker, styles.whiskerTopRight]} />
                <View style={[styles.whisker, styles.whiskerBottomRight]} />
              </View>

              {/* Area Wajah Kucing */}
              <View style={styles.faceArea}>
                {/* Baris Mata dengan Animasi Kedipan Alami */}
                <Animated.View
                  style={[
                    styles.eyesRow,
                    { transform: [{ scaleY: blinkAnim }] },
                  ]}
                >
                  {/* Mata Kiri */}
                  <View style={styles.eyeContainer}>
                    <View style={styles.eyeCircle}>
                      <View style={styles.eyeGlint} />
                    </View>
                  </View>

                  {/* Mata Kanan */}
                  <View style={styles.eyeContainer}>
                    <View style={styles.eyeCircle}>
                      <View style={styles.eyeGlint} />
                    </View>
                  </View>
                </Animated.View>

                {/* Pipi Merona & Hidung Imut */}
                <View style={styles.blushAndNoseRow}>
                  <View style={styles.blush} />
                  <View style={styles.catNose} />
                  <View style={styles.blush} />
                </View>

                {/* Senyum Kucing W :3 */}
                <View style={styles.mouthRow}>
                  <View style={styles.mouthCurve} />
                  <View style={styles.mouthCurve} />
                </View>
              </View>
            </View>
          </View>
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

      {/* Bagian Bawah: Hak Cipta Resmi Yenvys */}
      <Animated.View style={[styles.copyrightContainer, { opacity: textFade }]}>
        <View style={styles.copyrightRow}>
          <PawPrintIcon size={12} color={theme.accent} />
          <Text style={[styles.copyrightText, { color: theme.textMuted }]}>
            © 2026 Yenvys
          </Text>
        </View>
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
  mascotCard: {
    width: 120,
    height: 120,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    // iOS shadow
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    // Android elevation
    elevation: 8,
    marginBottom: 16,
  },
  skyOrb: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 13,
    height: 13,
    borderRadius: 7,
  },
  catStructure: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  earsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 76,
    marginBottom: -8,
    zIndex: 1,
  },
  catEar: {
    width: 26,
    height: 28,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  leftEar: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    transform: [{ rotate: '-12deg' }],
  },
  rightEar: {
    borderTopRightRadius: 14,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    transform: [{ rotate: '12deg' }],
  },
  innerEar: {
    width: 11,
    height: 14,
    opacity: 0.65,
    marginTop: 4,
  },
  leftInnerEar: {
    borderTopLeftRadius: 7,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  rightInnerEar: {
    borderTopRightRadius: 7,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  catHead: {
    width: 82,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    position: 'relative',
  },
  leftWhiskers: {
    position: 'absolute',
    left: -7,
    top: 25,
    gap: 5,
  },
  rightWhiskers: {
    position: 'absolute',
    right: -7,
    top: 25,
    gap: 5,
  },
  whisker: {
    width: 13,
    height: 1.8,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  whiskerTopLeft: {
    transform: [{ rotate: '-6deg' }],
  },
  whiskerBottomLeft: {
    transform: [{ rotate: '6deg' }],
  },
  whiskerTopRight: {
    transform: [{ rotate: '6deg' }],
  },
  whiskerBottomRight: {
    transform: [{ rotate: '-6deg' }],
  },
  faceArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  eyesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 44,
    alignItems: 'center',
  },
  eyeContainer: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  eyeGlint: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 1,
    right: 1,
  },
  blushAndNoseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 52,
    marginTop: 2,
  },
  blush: {
    width: 10,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 175, 175, 0.75)',
  },
  catNose: {
    width: 7,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#FFE3DC',
  },
  mouthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -0.5,
  },
  mouthCurve: {
    width: 6,
    height: 4.5,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    borderBottomWidth: 1.6,
    borderLeftWidth: 1.4,
    borderRightWidth: 1.4,
    borderTopWidth: 0,
    borderColor: '#FFFFFF',
    marginHorizontal: -0.5,
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
    marginBottom: 4,
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
});
