import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';

interface MarqueeTextProps {
  text: string;
  style?: TextStyle | TextStyle[];
  pauseDuration?: number;
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  style,
  pauseDuration = 1200,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const animatedX = useRef(new Animated.Value(0)).current;

  const isOverflowing = textWidth > containerWidth + 2 && containerWidth > 0;

  useEffect(() => {
    if (!isOverflowing) {
      animatedX.setValue(0);
      return;
    }

    const scrollDistance = textWidth - containerWidth + 8;
    const scrollDuration = Math.max(1600, scrollDistance * 36);

    const animation = Animated.loop(
      Animated.sequence([
        // 1. Berhenti sejenak di awal agar bisa dibaca
        Animated.delay(pauseDuration),
        // 2. Teks bergerak perlahan ke kiri
        Animated.timing(animatedX, {
          toValue: -scrollDistance,
          duration: scrollDuration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // 3. Berhenti di ujung
        Animated.delay(pauseDuration),
        // 4. Kembali ke awal
        Animated.timing(animatedX, {
          toValue: 0,
          duration: 650,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // 5. Jeda sejenak sebelum berulang
        Animated.delay(500),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
      animatedX.setValue(0);
    };
  }, [isOverflowing, textWidth, containerWidth, pauseDuration, animatedX]);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (Math.abs(width - containerWidth) > 1) {
      setContainerWidth(width);
    }
  };

  const onTextLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (Math.abs(width - textWidth) > 1) {
      setTextWidth(width);
    }
  };

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <Animated.View
        style={[
          styles.animatedWrap,
          {
            transform: [{ translateX: animatedX }],
          },
        ]}
      >
        <Text
          numberOfLines={1}
          onLayout={onTextLayout}
          style={[style, { flexShrink: 0 }]}
        >
          {text}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  animatedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
