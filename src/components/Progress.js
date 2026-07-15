import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

export function Progress({ value = 0, className = "", trackColorClass = "bg-[#1a1d24]", indicatorColorClass = "bg-red-500", ...props }) {
  // Ensure value is always between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);
  
  // Use Animated.Value to smoothly transition the width
  const animatedValue = useRef(new Animated.Value(clampedValue)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: clampedValue,
      duration: 500, // Matches the timeout vibe of smooth transitions
      useNativeDriver: false, // width cannot use native driver
    }).start();
  }, [clampedValue]);

  // Interpolate 0-100 to 0%-100%
  const widthInterpolated = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View 
      className={`relative h-2.5 w-full overflow-hidden rounded-full ${trackColorClass} ${className}`} 
      {...props}
    >
      <Animated.View
        className={`h-full rounded-full ${indicatorColorClass}`}
        style={{ width: widthInterpolated }}
      />
    </View>
  );
}
