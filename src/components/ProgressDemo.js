import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Progress } from './Progress';

export function ProgressDemo() {
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    // Mimic the exact behavior of the web version: jumping from 13% to 66% after 500ms
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="w-full flex-row justify-center py-4">
      <Progress value={progress} className="w-[60%]" />
    </View>
  );
}
