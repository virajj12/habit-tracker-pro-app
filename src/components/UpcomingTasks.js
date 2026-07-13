import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Clock, AlertCircle } from 'lucide-react-native';
import { IconRenderer } from './Icons';

// Helper to convert "HH:MM" to a Date object for today
const parseTime = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

// Format Date object back to "HH:MM AM/PM"
const formatTime = (dateObj) => {
  if (!dateObj) return '';
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function UpcomingTasks({ habits, completedIds, onToggle }) {
  const [now, setNow] = useState(new Date());

  // Update "now" every minute so cards stay accurate
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const tasks = habits.filter((h) => !completedIds.has(String(h._id)));

  const rightNow = [];
  const upNext = [];

  tasks.forEach((habit) => {
    const st = habit.scheduledTime;
    if (!st || st.timeOption === 'any') return;

    if (st.timeOption === 'fixed' && st.fixedTime) {
      const fixedD = parseTime(st.fixedTime);
      const diffMin = (fixedD - now) / 60000;
      
      // If it's passed or within 30 mins
      if (diffMin <= 30) {
        rightNow.push({ ...habit, displayTime: formatTime(fixedD), isOverdue: diffMin < 0 });
      } else {
        upNext.push({ ...habit, displayTime: formatTime(fixedD), sortTime: fixedD });
      }
    } else if (st.timeOption === 'range' && st.timeRangeStart && st.timeRangeEnd) {
      const startD = parseTime(st.timeRangeStart);
      const endD = parseTime(st.timeRangeEnd);
      
      if (now >= startD && now <= endD) {
        rightNow.push({ ...habit, displayTime: `Until ${formatTime(endD)}` });
      } else if (now < startD) {
        upNext.push({ ...habit, displayTime: formatTime(startD), sortTime: startD });
      }
    }
  });

  // Sort upNext by time
  upNext.sort((a, b) => a.sortTime - b.sortTime);

  if (rightNow.length === 0 && upNext.length === 0) {
    return null;
  }

  const renderCard = (task, isNow) => (
    <TouchableOpacity
      key={task._id}
      onPress={() => onToggle(task)}
      activeOpacity={0.7}
      className={`mr-4 p-4 rounded-2xl border min-w-[200px] shadow-lg ${
        isNow 
          ? 'bg-red-500/10 border-red-500/30' 
          : 'bg-[#1a1d24] border-white/5'
      }`}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${isNow ? 'bg-red-500/20' : 'bg-white/5'}`}>
            <IconRenderer name={task.icon || 'star'} size={14} color={isNow ? '#ef4444' : '#9ca3af'} />
          </View>
          {task.isOverdue && (
            <AlertCircle size={14} color="#ef4444" style={{ marginLeft: -4, marginTop: -8 }} />
          )}
        </View>
        <View className="flex-row items-center bg-black/20 px-2 py-1 rounded-full">
          <Clock size={10} color={isNow ? '#f87171' : '#6b7280'} />
          <Text className={`text-[10px] ml-1 font-medium ${isNow ? 'text-red-400' : 'text-gray-400'}`}>
            {task.displayTime}
          </Text>
        </View>
      </View>
      
      <Text className="text-white font-bold text-base" numberOfLines={1}>
        {task.name}
      </Text>
      {task.category && (
        <Text className="text-gray-500 text-xs mt-1">{task.category}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View className="mb-6">
      <Text className="text-lg font-bold text-white mb-3">Time Sensitive</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
        {rightNow.map(t => renderCard(t, true))}
        {upNext.map(t => renderCard(t, false))}
      </ScrollView>
    </View>
  );
}
