import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

/**
 * Friction modal for negative habits — matches web's DailyTasks friction flow.
 * Shows a countdown timer and requires a 10+ char reflection before confirming.
 *
 * Props:
 *   visible       - boolean
 *   habitName     - string (the habit being failed)
 *   onConfirm     - (reason: string) => void
 *   onCancel      - () => void
 */
export default function FrictionModal({ visible, habitName, onConfirm, onCancel }) {
  const [countdown, setCountdown] = useState(10);
  const [reason, setReason] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCountdown(10);
      setReason('');
    }
  }, [visible]);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (visible && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [visible, countdown]);

  const canConfirm = countdown === 0 && reason.trim().length >= 10;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/80 items-center justify-center px-6">
        <View className="bg-[#1a1d24] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm">
          {/* Icon */}
          <View className="w-12 h-12 bg-red-500/10 rounded-full items-center justify-center self-center mb-4 border border-red-500/20">
            <AlertTriangle size={24} color="#f87171" />
          </View>

          <Text className="text-xl font-bold text-white text-center mb-2">
            Breaking a Habit?
          </Text>
          <Text className="text-gray-400 text-center mb-6 text-sm">
            You are about to record a failure for{' '}
            <Text className="text-red-400 font-bold">{habitName}</Text>.
            Take a moment to reflect. Why is this happening?
          </Text>

          {/* Reflection textarea */}
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="I am breaking this habit because... (min 10 characters)"
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={4}
            className="bg-[#0f1115] border border-white/10 rounded-lg p-3 text-white mb-6"
            style={{ minHeight: 96, textAlignVertical: 'top' }}
          />

          {/* Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 bg-[#2a2d35] py-3 rounded-lg items-center"
            >
              <Text className="text-gray-300 font-medium">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { if (canConfirm) onConfirm(reason); }}
              disabled={!canConfirm}
              className={`flex-1 py-3 rounded-lg items-center
                ${canConfirm
                  ? 'bg-red-500'
                  : 'bg-[#2a2d35]'
                }`}
            >
              <Text className={`font-bold ${canConfirm ? 'text-white' : 'text-gray-500'}`}>
                {countdown > 0 ? `Wait ${countdown}s` : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
