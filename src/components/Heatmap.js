import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Shield } from 'lucide-react-native';
import { getHabitLogs, updateMe, useStreakToken as apiUseStreakToken } from '../api';

function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  currentDate.setDate(currentDate.getDate() - currentDate.getDay()); // Start on Sunday
  
  const end = new Date(endDate);
  end.setDate(end.getDate() + (6 - end.getDay())); // End on Saturday

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

export default function Heatmap({ user, onTokensUpdated }) {
  const [rangeOption, setRangeOption] = useState('month');
  const [habitLogs, setHabitLogs] = useState({});
  const [tokenDays, setTokenDays] = useState(new Set());
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [targetDate, setTargetDate] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const tokens = user?.streakTokens ?? 3;

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();

    if (rangeOption === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    } else if (rangeOption === '3months') {
      start.setMonth(start.getMonth() - 3);
    } else if (rangeOption === '6months') {
      start.setMonth(start.getMonth() - 6);
    } else if (rangeOption === 'lifetime') {
      start.setFullYear(start.getFullYear() - 1);
    }

    return { startDate: start, endDate: end };
  }, [rangeOption]);

  const dates = useMemo(() => getDatesInRange(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    const fetchLogs = async () => {
      const startStr = startDate.toLocaleDateString('en-CA');
      const endStr = endDate.toLocaleDateString('en-CA');
      try {
        const res = await getHabitLogs({ startDate: startStr, endDate: endStr });
        if (res.success) {
          const logsByDate = {};
          const freezeDays = new Set();
          
          res.data.forEach(log => {
            if (log.status === 'skipped-token') {
              freezeDays.add(log.dateString);
            } else if (log.status === 'completed') {
              logsByDate[log.dateString] = (logsByDate[log.dateString] || 0) + 1;
            }
          });
          
          setHabitLogs(logsByDate);
          setTokenDays(freezeDays);
        }
      } catch (e) {
        console.error('Heatmap fetch error:', e);
      }
    };
    fetchLogs();
  }, [startDate, endDate]);

  const handleBlockClick = (date, intensity, isTokenUsed) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const clickedDate = new Date(date);
    clickedDate.setHours(0,0,0,0);

    const clickedDateStr = new Date(date).toLocaleDateString('en-CA');

    if (clickedDate < today && intensity === 0 && tokens > 0 && !isTokenUsed) {
      setTargetDate(clickedDateStr);
      setShowModal(true);
    }
  };

  const handleUseToken = async () => {
    if (tokens > 0 && targetDate) {
      setIsProcessing(true);
      try {
        const res = await apiUseStreakToken(targetDate);
        if (res.success) {
          setTokenDays(prev => new Set(prev).add(targetDate));
          await updateMe({ streakTokens: tokens - 1 });
          if (onTokensUpdated) onTokensUpdated(tokens - 1);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
        setShowModal(false);
        setTargetDate(null);
      }
    }
  };

  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  const getBlockStyle = (intensity, isTokenUsed, isOutOfRange) => {
    let backgroundColor = '#12141a'; // bg-surface-950/60
    let borderColor = 'rgba(255,255,255,0.05)';
    
    if (isTokenUsed) {
      backgroundColor = '#fbbf24'; // amber-400
      borderColor = '#f59e0b';
    } else {
      switch (intensity) {
        case 1: backgroundColor = 'rgba(239,68,68,0.3)'; borderColor = 'rgba(239,68,68,0.2)'; break;
        case 2: backgroundColor = 'rgba(239,68,68,0.6)'; borderColor = 'rgba(239,68,68,0.4)'; break;
        case 3: backgroundColor = 'rgba(239,68,68,0.8)'; borderColor = 'rgba(239,68,68,0.6)'; break;
        case 4: backgroundColor = '#ef4444'; borderColor = 'rgba(239,68,68,0.8)'; break;
        default: break;
      }
    }
    
    return {
      backgroundColor,
      borderColor,
      opacity: isOutOfRange ? 0.2 : 1,
    };
  };

  return (
    <View className="bg-[#1a1d24] p-4 rounded-2xl border border-white/5 mb-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-white">🔥 Activity Heatmap</Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
            <Shield size={14} color="#fbbf24" />
            <Text className="text-amber-400 font-bold ml-1 text-xs">{tokens}</Text>
          </View>
        </View>
      </View>

      <View className="flex-row gap-2 mb-4">
        {['month', '3months', '6months'].map(opt => (
          <TouchableOpacity 
            key={opt}
            onPress={() => setRangeOption(opt)}
            className={`px-3 py-1.5 rounded-lg border ${rangeOption === opt ? 'bg-red-500/20 border-red-500' : 'bg-[#0f1115] border-white/10'}`}
          >
            <Text className={`text-xs ${rangeOption === opt ? 'text-red-400' : 'text-gray-400'}`}>
              {opt === 'month' ? 'Month' : opt === '3months' ? '3 Months' : '6 Months'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
        <View className="flex-row gap-1">
          {weeks.map((week, wIndex) => (
            <View key={wIndex} className="gap-1">
              {week.map((date, dIndex) => {
                const dateStr = date.toLocaleDateString('en-CA');
                const isTokenUsed = tokenDays.has(dateStr);
                const intensity = habitLogs[dateStr] || 0;
                const isOutOfRange = date < startDate || date > endDate;
                const style = getBlockStyle(intensity > 4 ? 4 : intensity, isTokenUsed, isOutOfRange);
                
                return (
                  <TouchableOpacity
                    key={dIndex}
                    activeOpacity={0.6}
                    onPress={() => handleBlockClick(date, intensity, isTokenUsed)}
                    style={[
                      { width: 14, height: 14, borderRadius: 3, borderWidth: 1 },
                      style
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      
      {/* Legend */}
      <View className="flex-row items-center justify-end mt-4 gap-1">
        <Text className="text-[10px] text-gray-500 mr-1">Less</Text>
        {[0, 1, 2, 3, 4].map(level => (
          <View key={level} style={[{ width: 10, height: 10, borderRadius: 2, borderWidth: 1 }, getBlockStyle(level, false, false)]} />
        ))}
        <Text className="text-[10px] text-gray-500 ml-1">More</Text>
      </View>

      {/* Streak Freeze Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className="bg-[#1a1d24] border border-white/10 p-6 rounded-2xl w-full max-w-sm">
            <View className="w-12 h-12 bg-amber-500/10 rounded-full items-center justify-center self-center mb-4 border border-amber-500/20">
              <Shield size={24} color="#fbbf24" />
            </View>
            
            <Text className="text-xl font-bold text-white text-center mb-2">Save your streak?</Text>
            <Text className="text-gray-400 text-center mb-6 text-sm">
              You missed your habits on <Text className="text-gray-200 font-bold">{targetDate}</Text>. Use 1 Streak Token to freeze this day?
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setShowModal(false)} className="flex-1 bg-[#2a2d35] py-3 rounded-lg items-center">
                <Text className="text-gray-300 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleUseToken} 
                disabled={isProcessing}
                className={`flex-1 py-3 rounded-lg items-center ${isProcessing ? 'bg-amber-500/50' : 'bg-amber-500'}`}
              >
                {isProcessing ? <ActivityIndicator color="#451a03" /> : <Text className="text-amber-950 font-bold">Use Token</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
