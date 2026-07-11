import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, RefreshControl, Platform, StatusBar } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { getAnalytics, getHistory, getMe } from '../api';
import { IconRenderer } from '../components/Icons';
import Heatmap from '../components/Heatmap';

const DISTRIBUTION_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function DashboardScreen() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    completionRate: 0,
    currentStreak: 0,
    totalTasksDone: 0,
    weeklyProgress: [],
    habitDistribution: [],
  });
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [analyticsRes, historyRes, meRes] = await Promise.all([
        getAnalytics(),
        getHistory(),
        getMe(),
      ]);
      if (analyticsRes.success) setStats(analyticsRes.data);
      if (historyRes.success) setHistory(historyRes.data);
      if (meRes) setUser(meRes);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const chartData = stats.weeklyProgress.map(item => ({
    value: item.completed,
    label: item.date,
    frontColor: '#ef4444',
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f1115', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />}
      >
        <Text className="text-2xl font-bold text-white mb-6">Analytics Dashboard</Text>
        
        {/* Heatmap */}
        {user && (
          <Heatmap 
            user={user} 
            onTokensUpdated={(newTokens) => setUser({...user, streakTokens: newTokens})} 
          />
        )}

        {/* Stats Grid */}
        <View className="flex-row justify-between mb-6">
          <View className="flex-1 bg-[#1a1d24] p-4 rounded-xl border border-white/5 mr-2">
            <Text className="text-xs text-gray-400 mb-1">Completion (30d)</Text>
            <Text className="text-2xl font-bold text-red-500">{stats.completionRate}%</Text>
          </View>
          <View className="flex-1 bg-[#1a1d24] p-4 rounded-xl border border-white/5 mx-1">
            <Text className="text-xs text-gray-400 mb-1">Current Streak</Text>
            <Text className="text-2xl font-bold text-orange-500">{stats.currentStreak} Days</Text>
          </View>
          <View className="flex-1 bg-[#1a1d24] p-4 rounded-xl border border-white/5 ml-2">
            <Text className="text-xs text-gray-400 mb-1">Tasks Done</Text>
            <Text className="text-2xl font-bold text-white">{stats.totalTasksDone}</Text>
          </View>
        </View>

        {/* Weekly Progress Chart */}
        <View className="bg-[#1a1d24] p-4 rounded-2xl border border-white/5 mb-6">
          <Text className="text-lg font-bold text-white mb-4">Weekly Progress</Text>
          {chartData.length > 0 ? (
            <BarChart
              data={chartData}
              barWidth={22}
              noOfSections={3}
              barBorderRadius={4}
              frontColor="#ef4444"
              yAxisThickness={0}
              xAxisThickness={0}
              hideRules
              yAxisTextStyle={{ color: '#9ca3af' }}
              xAxisLabelTextStyle={{ color: '#9ca3af', textAlign: 'center', fontSize: 10 }}
              isAnimated
            />
          ) : (
            <Text className="text-gray-500 text-center py-4">Not enough data to display chart.</Text>
          )}
        </View>

        {/* Habit Distribution */}
        {stats.habitDistribution.length > 0 && (
          <View className="bg-[#1a1d24] p-4 rounded-2xl border border-white/5 mb-6">
            <Text className="text-lg font-bold text-white mb-4">Habit Distribution</Text>
            {stats.habitDistribution.map((item, index) => {
              const total = stats.habitDistribution.reduce((acc, i) => acc + i.value, 0);
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              const color = DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length];
              return (
                <View key={item.name} className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-sm text-gray-300">{item.name}</Text>
                    <Text className="text-sm text-gray-400">{item.value} ({pct}%)</Text>
                  </View>
                  <View className="h-2 bg-[#0f1115] rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Completion History */}
        <View className="bg-[#1a1d24] p-4 rounded-2xl border border-white/5 mb-6">
          <Text className="text-lg font-bold text-white mb-4">Recent History</Text>
          {history.length > 0 ? (
            history.slice(0, 15).map((log) => {
              const d = new Date(log.loggedAt);
              const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const habit = log.habitId || {};

              return (
                <View key={log._id} className="py-3 border-b border-white/5 flex-row items-center">
                  {/* Icon */}
                  <View className="w-8 h-8 rounded-full bg-[#0f1115] border border-white/5 items-center justify-center mr-3">
                    <IconRenderer
                      name={habit.icon || 'star'}
                      size={14}
                      color="#ef4444"
                    />
                  </View>

                  {/* Info */}
                  <View className="flex-1">
                    <Text className="text-white font-medium" numberOfLines={1}>
                      {habit.name || 'Unknown'}
                    </Text>
                    {habit.category && (
                      <View className="flex-row mt-0.5">
                        <View className="bg-white/10 px-2 py-0.5 rounded-full">
                          <Text className="text-[10px] text-gray-400">{habit.category}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Date/Time */}
                  <View className="items-end">
                    <Text className="text-gray-300 text-xs">{dateStr}</Text>
                    <Text className="text-gray-500 text-[10px]">{timeStr}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text className="text-gray-500 text-center py-4">No tasks completed yet. Go crush some habits! 💪</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
