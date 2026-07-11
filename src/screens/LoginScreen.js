import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { login } from '../api';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const data = await login(email, password);
      if (data.token) {
        await SecureStore.setItemAsync('auth_token', data.token);
        onLogin();
      } else {
        setError('Login failed, no token received');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0f1115] justify-center px-6">
      <View className="bg-[#1a1d24] p-6 rounded-2xl border border-white/10 shadow-lg">
        <Text className="text-3xl font-bold text-red-500 mb-2 text-center">Habit Tracker</Text>
        <Text className="text-gray-400 text-center mb-8">Sign in to track your habits</Text>

        {error && (
          <View className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-6">
            <Text className="text-red-400 text-center text-sm">{error}</Text>
          </View>
        )}

        <View className="mb-4">
          <Text className="text-gray-400 mb-1.5 text-sm">Email Address</Text>
          <TextInput
            className="w-full bg-[#2a2d35] border border-white/10 rounded-xl px-4 py-3 text-white"
            placeholder="habittracker@mail.com"
            placeholderTextColor="#6b7280"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View className="mb-6">
          <Text className="text-gray-400 mb-1.5 text-sm">Password</Text>
          <TextInput
            className="w-full bg-[#2a2d35] border border-white/10 rounded-xl px-4 py-3 text-white"
            placeholder="••••••••"
            placeholderTextColor="#6b7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          className={`w-full bg-red-500 py-4 rounded-xl items-center ${loading ? 'opacity-50' : ''}`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Launch Tracker</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
