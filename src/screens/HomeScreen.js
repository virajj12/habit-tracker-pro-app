import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
  RefreshControl, Alert, Platform, StatusBar
} from 'react-native';
import { Plus, Settings } from 'lucide-react-native';
import { getMe, getHabits, getHabitLogs, createHabitLog, deleteHabitLog, updateMe } from '../api';
import HabitItem from '../components/HabitItem';
import FrictionModal from '../components/FrictionModal';

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [habits, setHabits] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [frictionHabit, setFrictionHabit] = useState(null);

  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  const loadData = useCallback(async () => {
    try {
      const [meRes, habitsRes, logsRes] = await Promise.all([
        getMe(),
        getHabits(),
        getHabitLogs({ dateString: todayStr }),
      ]);
      setUser(meRes);
      
      const loadedHabits = habitsRes.data || [];
      setHabits(loadedHabits);
      
      // Schedule local notifications for these habits
      try {
        const { scheduleHabitReminders } = require('../services/notifications');
        scheduleHabitReminders(loadedHabits);
      } catch (err) {
        console.error('Failed to schedule notifications:', err);
      }

      // Build set of completed habit IDs for today
      if (logsRes.success) {
        const ids = logsRes.data
          .filter(log => log.status === 'completed')
          .map(log => String(log.habitId));
        setCompletedIds(new Set(ids));
      }
    } catch (e) {
      console.error('HomeScreen loadData error:', e);
    }
  }, [todayStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data when screen comes into focus (e.g., after adding a habit)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ─── XP / Level ─────────────────────────────────────────────────
  const xp = user?.xp || 0;
  const level = user?.level || 1;
  const xpNextLevel = 100;
  const currentLevelXp = xp % xpNextLevel;
  const progressPercent = (currentLevelXp / xpNextLevel) * 100;

  // ─── Skip-day filtering ────────────────────────────────────────
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDayStr = dayNames[new Date().getDay()];

  const todaysTasks = habits.filter(
    h => !h.skipDays || !h.skipDays.includes(currentDayStr)
  );
  const restOfTasks = habits.filter(
    h => h.skipDays && h.skipDays.includes(currentDayStr)
  );

  // ─── Velocity / Momentum ──────────────────────────────────────
  const completedTodayCount = todaysTasks.filter(h => completedIds.has(String(h._id))).length;
  const momentumPercent = todaysTasks.length > 0
    ? Math.round((completedTodayCount / todaysTasks.length) * 100)
    : 0;

  // ─── Toggle Task ───────────────────────────────────────────────
  const toggleTask = async (habit) => {
    const habitId = habit._id;
    const wasCompleted = completedIds.has(String(habitId));

    // Guard: dependency lock
    if (habit.dependsOn) {
      const parent = habits.find(h => String(h._id) === String(habit.dependsOn));
      if (parent && !completedIds.has(String(parent._id))) return;
    }

    // Negative habit friction
    if (habit.habitType === 'negative' && !wasCompleted) {
      setFrictionHabit(habit);
      return;
    }

    // Optimistic update
    const newSet = new Set(completedIds);
    if (wasCompleted) {
      newSet.delete(String(habitId));
    } else {
      newSet.add(String(habitId));
    }
    setCompletedIds(newSet);

    try {
      if (wasCompleted) {
        // Undo completion
        await deleteHabitLog(habitId, todayStr);
      } else {
        // Mark completed
        await createHabitLog({
          habitId,
          status: 'completed',
          dateString: todayStr,
        });
        // Award XP
        const newXp = xp + 10;
        const newLevel = newXp % xpNextLevel === 0 ? level + 1 : level;
        setUser(prev => ({ ...prev, xp: newXp, level: newLevel }));
        updateMe({ xp: newXp, level: newLevel }).catch(console.error);
      }
    } catch (err) {
      console.error('Toggle error:', err);
      // Revert optimistic update
      setCompletedIds(completedIds);
    }
  };

  // ─── Friction Confirm ──────────────────────────────────────────
  const handleFrictionConfirm = async (reason) => {
    if (!frictionHabit) return;
    const habitId = frictionHabit._id;

    const newSet = new Set(completedIds);
    newSet.add(String(habitId));
    setCompletedIds(newSet);

    try {
      await createHabitLog({
        habitId,
        status: 'completed',
        dateString: todayStr,
        mood: 'bad',
      });
    } catch (err) {
      console.error('Friction confirm error:', err);
      newSet.delete(String(habitId));
      setCompletedIds(new Set(newSet));
    }

    setFrictionHabit(null);
  };

  // ─── Delete Task ───────────────────────────────────────────────
  const handleDelete = (habit) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { deleteHabit } = require('../api');
              await deleteHabit(habit._id);
              setHabits(prev => prev.filter(h => h._id !== habit._id));
            } catch (err) {
              console.error('Delete error:', err);
            }
          },
        },
      ]
    );
  };

  // ─── Check if task is locked by dependency ─────────────────────
  const isTaskLocked = (habit) => {
    if (!habit.dependsOn) return false;
    const parent = habits.find(h => String(h._id) === String(habit.dependsOn));
    return parent && !completedIds.has(String(parent._id));
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f1115', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />
        }
      >
        {/* RPG Gamification Header */}
        <View className="mb-6 flex-row justify-between items-end">
          <View className="flex-1 mr-4">
            <Text className="text-2xl font-bold text-white mb-2" numberOfLines={1}>
              Hello, {user?.name || 'Pioneer'}!
            </Text>
            <View className="flex-row items-center">
              <View className="flex-1 h-3 bg-[#1a1d24] rounded-full overflow-hidden border border-white/5 mr-3">
                <View
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </View>
              <Text className="text-xs text-gray-400 font-medium">
                Lvl {level} ({currentLevelXp}/{xpNextLevel})
              </Text>
            </View>
          </View>

          {/* Settings button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            className="w-10 h-10 rounded-full bg-[#1a1d24] border border-white/10 items-center justify-center"
          >
            <Settings size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Velocity Score */}
        <View className="bg-[#1a1d24] p-4 rounded-2xl border border-white/5 shadow-lg mb-6 flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-blue-500/10 items-center justify-center border border-blue-500/20 mr-4">
            <Text className="text-blue-500 text-xl font-bold">⚡</Text>
          </View>
          <View>
            <Text className="text-xs text-gray-500 font-bold uppercase tracking-wider">Velocity</Text>
            <Text className="text-lg font-bold text-blue-400">
              {momentumPercent}% Momentum
            </Text>
          </View>
        </View>

        {/* Today's Tasks */}
        <View className="bg-[#1a1d24] p-4 rounded-2xl border border-white/5 mb-4">
          <Text className="text-lg font-bold text-white mb-4">Today's Tasks</Text>

          {todaysTasks.length === 0 ? (
            <Text className="text-gray-500 text-center py-4">
              No tasks for today. You're all caught up! 🎉
            </Text>
          ) : (
            todaysTasks.map(habit => (
              <HabitItem
                key={habit._id}
                habit={habit}
                isCompleted={completedIds.has(String(habit._id))}
                isLocked={isTaskLocked(habit)}
                onToggle={() => toggleTask(habit)}
                onEdit={() => navigation.navigate('AddHabit', { habit })}
                onDelete={() => handleDelete(habit)}
              />
            ))
          )}
        </View>

        {/* Rest of Tasks (skipped today) */}
        {restOfTasks.length > 0 && (
          <View className="bg-[#1a1d24]/50 p-4 rounded-2xl border border-white/5 mb-6 opacity-60">
            <Text className="text-lg font-semibold text-gray-400 mb-4">Rest of the Tasks</Text>
            {restOfTasks.map(habit => (
              <HabitItem
                key={habit._id}
                habit={habit}
                isCompleted={completedIds.has(String(habit._id))}
                isLocked={isTaskLocked(habit)}
                onToggle={() => toggleTask(habit)}
                onEdit={() => navigation.navigate('AddHabit', { habit })}
                onDelete={() => handleDelete(habit)}
              />
            ))}
          </View>
        )}

        {/* Spacer for FAB */}
        <View className="h-20" />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('AddHabit')}
        className="absolute bottom-24 right-6 w-14 h-14 rounded-full bg-red-500 items-center justify-center shadow-lg"
        style={{
          shadowColor: '#ef4444',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Friction Modal */}
      <FrictionModal
        visible={!!frictionHabit}
        habitName={frictionHabit?.name || ''}
        onConfirm={handleFrictionConfirm}
        onCancel={() => setFrictionHabit(null)}
      />
    </SafeAreaView>
  );
}
