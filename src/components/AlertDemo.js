import React from 'react';
import { View } from 'react-native';
import { CheckCircle2, Info } from 'lucide-react-native';
import { Alert, AlertTitle, AlertDescription } from './Alert';

export function AlertDemo() {
  return (
    <View className="w-full max-w-md gap-4 p-4">
      <Alert>
        <CheckCircle2 size={20} color="#16a34a" />
        <AlertTitle>Task added successfully</AlertTitle>
        <AlertDescription>
          Your new task has been saved to your habit tracker. We'll remind you when it's time!
        </AlertDescription>
      </Alert>
      
      <Alert>
        <Info size={20} color="#2563eb" />
        <AlertTitle>New feature available</AlertTitle>
        <AlertDescription>
          We've added dark mode support. You can enable it in your account settings.
        </AlertDescription>
      </Alert>
    </View>
  );
}
