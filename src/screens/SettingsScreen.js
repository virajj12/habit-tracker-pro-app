import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, Platform, StatusBar, Switch } from 'react-native';
import { ArrowLeft, LogOut, Shield, Zap, Target, Trophy, Key, Bell } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoNotifications from 'expo-notifications';
import { getMe, forgotPassword } from '../api';
import { scheduleHabitReminders, checkPermissionStatus } from '../services/notifications';

export default function SettingsScreen({ navigation, onLogout }) {
  const [user, setUser] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMe();
        setUser(data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    const fetchNotificationPref = async () => {
      const pref = await SecureStore.getItemAsync('notifications_enabled');
      if (pref === 'false') {
        setNotificationsEnabled(false);
      }
      const hasPermission = await checkPermissionStatus();
      setPermissionGranted(hasPermission);
    };
    fetchUser();
    fetchNotificationPref();
  }, []);

  const toggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    await SecureStore.setItemAsync('notifications_enabled', value ? 'true' : 'false');
    
    if (value) {
      // Reschedule from cached habits
      try {
        const cachedHabits = await AsyncStorage.getItem('cached_habits');
        if (cachedHabits) {
          await scheduleHabitReminders(JSON.parse(cachedHabits));
        }
      } catch (err) {
        console.error('Failed to reschedule notifications:', err);
      }
    } else {
      // Cancel all scheduled notifications immediately
      await ExpoNotifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('auth_token');
            if (onLogout) onLogout();
          },
        },
      ]
    );
  };

  const xp = user?.xp || 0;
  const level = user?.level || 1;
  const xpNextLevel = 100;
  const currentLevelXp = xp % xpNextLevel;
  const tokens = user?.streakTokens ?? 3;

  const handleChangePassword = async () => {
    if (!user?.email) return;
    Alert.alert(
      'Change Password',
      'We will send a password reset link to your email. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            try {
              await forgotPassword(user.email);
              Alert.alert('Success', 'Check your email and open the link to reset your password on the website.');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to send reset link.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f1115', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-[#1a1d24] border border-white/10 items-center justify-center mr-3"
        >
          <ArrowLeft size={20} color="#9ca3af" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Settings</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Profile Card */}
        <View className="bg-[#1a1d24] p-5 rounded-2xl border border-white/5 mb-4">
          <View className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 items-center justify-center self-center mb-3">
            <Text className="text-2xl font-bold text-red-400">
              {(user?.name || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <Text className="text-lg font-bold text-white text-center">{user?.name || 'Loading...'}</Text>
          <Text className="text-sm text-gray-400 text-center mt-1">{user?.email || ''}</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-[#1a1d24] p-4 rounded-xl border border-white/5 items-center">
            <View className="w-10 h-10 rounded-full bg-yellow-500/10 items-center justify-center mb-2 border border-yellow-500/20">
              <Zap size={20} color="#eab308" />
            </View>
            <Text className="text-xs text-gray-400 mb-0.5">XP</Text>
            <Text className="text-xl font-bold text-white">{xp}</Text>
          </View>

          <View className="flex-1 bg-[#1a1d24] p-4 rounded-xl border border-white/5 items-center">
            <View className="w-10 h-10 rounded-full bg-purple-500/10 items-center justify-center mb-2 border border-purple-500/20">
              <Trophy size={20} color="#a855f7" />
            </View>
            <Text className="text-xs text-gray-400 mb-0.5">Level</Text>
            <Text className="text-xl font-bold text-white">{level}</Text>
          </View>

          <View className="flex-1 bg-[#1a1d24] p-4 rounded-xl border border-white/5 items-center">
            <View className="w-10 h-10 rounded-full bg-amber-500/10 items-center justify-center mb-2 border border-amber-500/20">
              <Shield size={20} color="#f59e0b" />
            </View>
            <Text className="text-xs text-gray-400 mb-0.5">Tokens</Text>
            <Text className="text-xl font-bold text-white">{tokens}</Text>
          </View>
        </View>

        {/* XP Progress */}
        <View className="bg-[#1a1d24] p-4 rounded-xl border border-white/5 mb-6">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-400">Next Level Progress</Text>
            <Text className="text-sm text-gray-400">{currentLevelXp}/{xpNextLevel} XP</Text>
          </View>
          <View className="h-3 bg-[#0f1115] rounded-full overflow-hidden">
            <View
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${(currentLevelXp / xpNextLevel) * 100}%` }}
            />
          </View>
        </View>

        {/* Notifications Toggle */}
        <View className="bg-[#1a1d24] p-4 rounded-xl border border-white/5 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-full bg-blue-500/10 items-center justify-center border border-blue-500/20">
                <Bell size={20} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-white">Push Notifications</Text>
                <Text className="text-xs text-gray-400">Daily habit reminders</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#374151', true: '#ef4444' }}
              thumbColor={Platform.OS === 'ios' ? undefined : (notificationsEnabled ? '#ffffff' : '#9ca3af')}
            />
          </View>
          {!permissionGranted && (
            <View className="mt-3 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <Text className="text-red-400 text-xs">
                ⚠️ Notification permission not granted. Please enable notifications in your device Settings.
              </Text>
            </View>
          )}
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          onPress={handleChangePassword}
          className="bg-blue-500/10 border border-blue-500/20 py-4 rounded-xl flex-row items-center justify-center gap-2 mb-4"
        >
          <Key size={20} color="#3b82f6" />
          <Text className="text-blue-400 font-bold text-base">Change Password</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-500/10 border border-red-500/20 py-4 rounded-xl flex-row items-center justify-center gap-2 mb-10"
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-400 font-bold text-base">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
