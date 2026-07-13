import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, Lock, Pencil, Trash2 } from 'lucide-react-native';
import { IconRenderer } from './Icons';

/**
 * A single habit row matching the web app's DailyTasks renderTask().
 * 
 * Props:
 *   habit          - Habit object from API (with .name, .icon, .category, .scheduledTime, .habitType, .dependsOn)
 *   isCompleted    - Whether this habit is completed today
 *   isLocked       - Whether blocked by an uncompleted dependency
 *   onToggle       - () => void — called when user taps to toggle completion
 *   onEdit         - () => void — called when user long-presses to edit
 *   onDelete       - () => void — called for delete
 */
export default function HabitItem({ habit, isCompleted, isLocked, onToggle, onEdit, onDelete }) {
  const isNegative = habit.habitType === 'negative';

  // Format scheduled time display
  const getTimeDisplay = () => {
    const st = habit.scheduledTime;
    if (!st || st.timeOption === 'any') return null;
    if (st.timeOption === 'fixed' && st.fixedTime) return st.fixedTime;
    if (st.timeOption === 'range' && st.timeRangeStart) {
      return `${st.timeRangeStart} - ${st.timeRangeEnd || '?'}`;
    }
    return null;
  };

  const timeDisplay = getTimeDisplay();

  return (
    <TouchableOpacity
      activeOpacity={isLocked ? 1 : 0.7}
      onPress={() => { if (!isLocked) onToggle?.(); }}
      onLongPress={() => { if (!isLocked && !isCompleted) onEdit?.(); }}
      className={`flex-row items-center p-3.5 rounded-xl border mb-2
        ${isCompleted
          ? 'bg-[#1a1d24]/30 border-white/5 opacity-50'
          : isLocked
            ? 'bg-[#12141a] border-white/5 opacity-40'
            : 'bg-[#1a1d24]/60 border-white/10'
        }`}
    >
      {/* Checkbox */}
      <View
        className={`w-6 h-6 rounded-md border items-center justify-center mr-3
          ${isCompleted
            ? (isNegative ? 'bg-red-500/80 border-red-500' : 'bg-red-500 border-red-500')
            : 'bg-[#12141a] border-white/20'
          }`}
      >
        {isCompleted && <Check size={16} color="#fff" strokeWidth={3} />}
        {isLocked && !isCompleted && <Lock size={14} color="#6b7280" />}
      </View>

      {/* Icon */}
      <View
        className={`w-8 h-8 rounded-full items-center justify-center mr-3 border
          ${isCompleted
            ? 'bg-[#12141a] border-white/5 opacity-50'
            : 'bg-[#12141a] border-white/10'
          }`}
      >
        <IconRenderer
          name={habit.icon || 'star'}
          size={16}
          color={isCompleted ? '#6b7280' : '#ef4444'}
        />
      </View>

      {/* Name + Meta */}
      <View className="flex-1 mr-2">
        <Text
          className={`font-medium text-base
            ${isCompleted
              ? (isNegative ? 'text-red-400/50 line-through' : 'text-gray-500 line-through')
              : 'text-gray-200'
            }`}
          numberOfLines={1}
        >
          {habit.name}
        </Text>

        <View className="flex-row items-center mt-0.5">
          {/* Category badge */}
          {habit.category && habit.category !== 'General' && (
            <View className="bg-white/10 px-2 py-0.5 rounded-full mr-2">
              <Text className="text-[10px] text-gray-400">{habit.category}</Text>
            </View>
          )}

          {/* Time */}
          {timeDisplay && (
            <Text className={`text-[11px] ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
              {timeDisplay}
            </Text>
          )}
        </View>
      </View>

      {/* Negative badge */}
      {isNegative && !isCompleted && (
        <View className="bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
          <Text className="text-[10px] text-red-400 font-bold">QUIT</Text>
        </View>
      )}

      {/* Actions (Edit / Delete) */}
      {!isCompleted && (
        <View className="flex-row items-center ml-2">
          <TouchableOpacity onPress={onEdit} className="p-2 bg-white/5 rounded-md mr-1.5 border border-white/5" activeOpacity={0.7}>
            <Pencil size={14} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} className="p-2 bg-red-500/10 rounded-md border border-red-500/20" activeOpacity={0.7}>
            <Trash2 size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}
