import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export function ScrollFadeDemo() {
  return (
    <View className="mx-auto w-[90%] max-w-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <View className="h-72 relative">
        <ScrollView 
          showsVerticalScrollIndicator={false}
          className="flex-1"
        >
          {/* Using pt-6 and pb-6 to ensure content is visible under the fade gradients */}
          <View className="flex flex-col p-3 pt-6 pb-6" style={{ gap: 6 }}>
            {Array.from({ length: 12 }, (_, index) => (
              <View
                key={index}
                className="rounded-lg bg-gray-100 px-3 py-3"
              >
                <Text className="text-sm text-gray-800 font-medium">
                  Item {index + 1}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
        
        {/* Top Fade Gradient */}
        <LinearGradient
          colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
          style={styles.topFade}
          pointerEvents="none"
        />
        
        {/* Bottom Fade Gradient */}
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
          style={styles.bottomFade}
          pointerEvents="none"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 32,
    zIndex: 10,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    zIndex: 10,
  }
});
