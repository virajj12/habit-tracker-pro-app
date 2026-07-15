import React from 'react';
import { View, Text } from 'react-native';

export function Alert({ children, className = "" }) {
  // Extract icon and content from children
  const childrenArray = React.Children.toArray(children);
  
  // Separate the icon from the text content based on component types
  const icon = childrenArray.find(child => 
    child.type !== AlertTitle && child.type !== AlertDescription
  );
  const title = childrenArray.find(child => child.type === AlertTitle);
  const description = childrenArray.find(child => child.type === AlertDescription);

  return (
    <View className={`w-full rounded-xl border border-white/10 bg-[#1a1d24] p-4 flex-row items-start gap-3 shadow-sm ${className}`}>
      {icon && (
        <View className="pt-0.5">
          {icon}
        </View>
      )}
      <View className="flex-1 flex-col">
        {title}
        {description}
      </View>
    </View>
  );
}

export function AlertTitle({ children, className = "" }) {
  return (
    <Text className={`font-semibold tracking-tight text-white mb-1 ${className}`}>
      {children}
    </Text>
  );
}

export function AlertDescription({ children, className = "" }) {
  return (
    <Text className={`text-sm text-gray-300 leading-relaxed ${className}`}>
      {children}
    </Text>
  );
}
