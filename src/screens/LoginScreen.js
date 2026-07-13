import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { login, signup, forgotPassword } from '../api';

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error' | 'success', text: string }

  const handleSubmit = async () => {
    if (!email) return;
    if (mode !== 'forgot' && !password) return;
    if (mode === 'signup' && !name) return;

    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'login') {
        const data = await login(email, password);
        if (data.token) {
          await SecureStore.setItemAsync('auth_token', data.token);
          onLogin();
        } else {
          setMessage({ type: 'error', text: 'Login failed, no token received' });
        }
      } else if (mode === 'signup') {
        const data = await signup(name, email, password);
        if (data.token) {
          await SecureStore.setItemAsync('auth_token', data.token);
          onLogin();
        } else {
          setMessage({ type: 'error', text: 'Signup failed, no token received' });
        }
      } else if (mode === 'forgot') {
        await forgotPassword(email);
        setMessage({ type: 'success', text: 'Check your email and open the link to reset your password on the website.' });
        setMode('login');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === 'login') return 'Sign in to track your habits';
    if (mode === 'signup') return 'Create a new account';
    return 'Reset your password';
  };

  const getButtonText = () => {
    if (mode === 'login') return 'Launch Tracker';
    if (mode === 'signup') return 'Join Tracker';
    return 'Send Reset Link';
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0f1115] justify-center px-6">
      <View className="bg-[#1a1d24] p-6 rounded-3xl border border-white/5 shadow-lg">
        <Text className="text-3xl font-bold text-red-500 mb-1 text-center">Habit Tracker</Text>
        <Text className="text-gray-400 text-center mb-8">{getTitle()}</Text>

        {message && (
          <View className={`p-3 rounded-xl mb-6 border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
            <Text className={`text-center text-sm ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
              {message.text}
            </Text>
          </View>
        )}

        {mode === 'signup' && (
          <View className="mb-4">
            <Text className="text-gray-400 mb-1.5 text-sm ml-1">Full Name</Text>
            <TextInput
              className="w-full bg-[#2a2d35] border border-white/10 rounded-xl px-4 py-3 text-white"
              placeholder="Pioneer"
              placeholderTextColor="#6b7280"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        )}

        <View className="mb-4">
          <Text className="text-gray-400 mb-1.5 text-sm ml-1">Email Address</Text>
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

        {mode !== 'forgot' && (
          <View className="mb-6">
            <Text className="text-gray-400 mb-1.5 text-sm ml-1">Password</Text>
            <TextInput
              className="w-full bg-[#2a2d35] border border-white/10 rounded-xl px-4 py-3 text-white"
              placeholder="••••••••"
              placeholderTextColor="#6b7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        )}

        {mode === 'login' && (
          <TouchableOpacity onPress={() => { setMode('forgot'); setMessage(null); }} className="mb-6 self-end">
            <Text className="text-red-400 text-sm font-medium">Forgot Password?</Text>
          </TouchableOpacity>
        )}
        
        {(mode === 'signup' || mode === 'forgot') && <View className="h-2" />}

        <TouchableOpacity 
          className={`w-full bg-red-500 py-4 rounded-xl items-center shadow-lg ${loading ? 'opacity-50' : ''}`}
          style={{ shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">{getButtonText()}</Text>
          )}
        </TouchableOpacity>

        {mode === 'login' && (
          <View className="mt-8 flex-row justify-center items-center">
            <Text className="text-gray-500 text-sm">New to Habit Tracker? </Text>
            <TouchableOpacity onPress={() => { setMode('signup'); setMessage(null); }}>
              <Text className="text-red-400 text-sm font-bold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {(mode === 'signup' || mode === 'forgot') && (
          <View className="mt-8 flex-row justify-center items-center">
            <Text className="text-gray-500 text-sm">Remembered your account? </Text>
            <TouchableOpacity onPress={() => { setMode('login'); setMessage(null); }}>
              <Text className="text-red-400 text-sm font-bold">Log In</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
