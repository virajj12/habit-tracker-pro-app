import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  ScrollView, ActivityIndicator, Alert, Platform, StatusBar
} from 'react-native';
import { ArrowLeft, Check } from 'lucide-react-native';
import { createHabit, updateHabit, getCategories, createCategory } from '../api';
import { IconRenderer, ICON_MAP } from '../components/Icons';

const DAYS_OF_WEEK = [
  { label: 'S', value: 'Sun' },
  { label: 'M', value: 'Mon' },
  { label: 'T', value: 'Tue' },
  { label: 'W', value: 'Wed' },
  { label: 'T', value: 'Thu' },
  { label: 'F', value: 'Fri' },
  { label: 'S', value: 'Sat' },
];

const DEFAULT_CATEGORIES = ['General', 'Health', 'Work', 'Productivity'];

export default function AddHabitScreen({ navigation, route }) {
  const editingHabit = route?.params?.habit || null;
  const isEditing = !!editingHabit;

  // ─── Form State ──────────────────────────────────────────────────
  const [name, setName] = useState(editingHabit?.name || '');
  const [selectedIcon, setSelectedIcon] = useState(editingHabit?.icon || 'star');
  const [isDaily, setIsDaily] = useState(editingHabit?.dateRange?.isDaily ?? true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [skipDays, setSkipDays] = useState(editingHabit?.skipDays || []);
  const [timeOption, setTimeOption] = useState(editingHabit?.scheduledTime?.timeOption || 'any');
  const [fixedTime, setFixedTime] = useState(editingHabit?.scheduledTime?.fixedTime || '');
  const [timeRangeStart, setTimeRangeStart] = useState(editingHabit?.scheduledTime?.timeRangeStart || '');
  const [timeRangeEnd, setTimeRangeEnd] = useState(editingHabit?.scheduledTime?.timeRangeEnd || '');
  const [selectedCategory, setSelectedCategory] = useState(editingHabit?.category || 'General');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newCatName, setNewCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Load categories from API ──────────────────────────────────
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategories();
        if (res.success && res.data.length > 0) {
          const userCats = res.data.map(c => c.name);
          const all = [...new Set([...DEFAULT_CATEGORIES, ...userCats])];
          setCategories(all);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCats();
  }, []);

  // ─── Toggle skip day ──────────────────────────────────────────
  const toggleSkipDay = (dayValue) => {
    if (skipDays.includes(dayValue)) {
      setSkipDays(skipDays.filter(d => d !== dayValue));
    } else {
      setSkipDays([...skipDays, dayValue]);
    }
  };

  // ─── Add new category ─────────────────────────────────────────
  const handleAddCategory = async () => {
    const catName = newCatName.trim();
    if (!catName) return;
    if (!categories.includes(catName)) {
      setCategories([...categories, catName]);
    }
    setSelectedCategory(catName);
    setNewCatName('');
    setShowNewCat(false);

    try {
      await createCategory(catName);
    } catch (err) {
      console.error('Error creating category:', err);
    }
  };

  // ─── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a task name.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      icon: selectedIcon,
      category: selectedCategory,
      habitType: 'positive',
      dateRange: {
        isDaily,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      skipDays,
      scheduledTime: {
        timeOption,
        fixedTime: timeOption === 'fixed' ? fixedTime : undefined,
        timeRangeStart: timeOption === 'range' ? timeRangeStart : undefined,
        timeRangeEnd: timeOption === 'range' ? timeRangeEnd : undefined,
      },
    };

    try {
      if (isEditing) {
        await updateHabit(editingHabit._id, payload);
      } else {
        await createHabit(payload);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save habit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────
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
        <Text className="text-xl font-bold text-white">
          {isEditing ? 'Edit Habit' : 'New Habit'}
        </Text>
      </View>

      <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
        {/* Task Name */}
        <View className="mt-4 mb-5">
          <Text className="text-gray-400 text-sm mb-1.5">Task Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Read 10 pages"
            placeholderTextColor="#4b5563"
            className="bg-[#1a1d24] border border-white/10 rounded-xl px-4 py-3 text-white text-base"
          />
        </View>

        {/* Icon Selector */}
        <View className="mb-5">
          <Text className="text-gray-400 text-sm mb-1.5">Icon</Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.keys(ICON_MAP).map((iconName) => (
              <TouchableOpacity
                key={iconName}
                onPress={() => setSelectedIcon(iconName)}
                className={`w-11 h-11 rounded-full items-center justify-center border
                  ${selectedIcon === iconName
                    ? 'bg-red-500/20 border-red-500'
                    : 'bg-[#1a1d24] border-white/10'
                  }`}
              >
                <IconRenderer
                  name={iconName}
                  size={20}
                  color={selectedIcon === iconName ? '#ef4444' : '#9ca3af'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category */}
        <View className="mb-5">
          <Text className="text-gray-400 text-sm mb-1.5">Category</Text>
          {!showNewCat ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl border
                        ${selectedCategory === cat
                          ? 'bg-red-500/20 border-red-500'
                          : 'bg-[#1a1d24] border-white/10'
                        }`}
                    >
                      <Text className={`text-sm ${selectedCategory === cat ? 'text-red-400' : 'text-gray-400'}`}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => setShowNewCat(true)}
                    className="px-4 py-2 rounded-xl border border-dashed border-white/20"
                  >
                    <Text className="text-sm text-gray-500">+ New</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </>
          ) : (
            <View className="flex-row gap-2">
              <TextInput
                value={newCatName}
                onChangeText={setNewCatName}
                placeholder="Category name"
                placeholderTextColor="#6b7280"
                className="flex-1 bg-[#1a1d24] border border-white/10 rounded-xl px-4 py-2.5 text-white"
                autoFocus
              />
              <TouchableOpacity onPress={handleAddCategory} className="bg-red-500 px-4 rounded-xl items-center justify-center">
                <Text className="text-white font-medium">Add</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowNewCat(false)} className="bg-[#2a2d35] px-3 rounded-xl items-center justify-center">
                <Text className="text-gray-400">✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Skip Days */}
        <View className="mb-5">
          <Text className="text-gray-400 text-sm mb-1.5">
            Skip Days <Text className="text-gray-600 text-xs">(Optional)</Text>
          </Text>
          <View className="flex-row justify-between">
            {DAYS_OF_WEEK.map((day) => {
              const isSkipped = skipDays.includes(day.value);
              return (
                <TouchableOpacity
                  key={day.value}
                  onPress={() => toggleSkipDay(day.value)}
                  className={`w-10 h-10 rounded-full border items-center justify-center
                    ${isSkipped
                      ? 'bg-red-500/20 border-red-500/50'
                      : 'bg-[#1a1d24] border-white/10'
                    }`}
                >
                  <Text className={`text-sm font-medium ${isSkipped ? 'text-red-300' : 'text-gray-400'}`}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Schedule */}
        <View className="mb-5">
          <Text className="text-gray-400 text-sm mb-1.5">
            Schedule <Text className="text-gray-600 text-xs">(Optional)</Text>
          </Text>
          <View className="flex-row gap-2 mb-3">
            {[
              { key: 'any', label: 'Anytime' },
              { key: 'fixed', label: 'Fixed' },
              { key: 'range', label: 'Range' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setTimeOption(opt.key)}
                className={`flex-1 py-2.5 rounded-xl border items-center
                  ${timeOption === opt.key
                    ? 'bg-red-500/20 border-red-500'
                    : 'bg-[#1a1d24] border-white/10'
                  }`}
              >
                <Text className={`text-sm ${timeOption === opt.key ? 'text-red-400' : 'text-gray-400'}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {timeOption === 'fixed' && (
            <TextInput
              value={fixedTime}
              onChangeText={setFixedTime}
              placeholder="e.g. 09:00"
              placeholderTextColor="#6b7280"
              className="bg-[#1a1d24] border border-white/10 rounded-xl px-4 py-3 text-white"
            />
          )}

          {timeOption === 'range' && (
            <View className="flex-row items-center gap-2">
              <TextInput
                value={timeRangeStart}
                onChangeText={setTimeRangeStart}
                placeholder="Start (09:00)"
                placeholderTextColor="#6b7280"
                className="flex-1 bg-[#1a1d24] border border-white/10 rounded-xl px-4 py-3 text-white"
              />
              <Text className="text-gray-500">to</Text>
              <TextInput
                value={timeRangeEnd}
                onChangeText={setTimeRangeEnd}
                placeholder="End (10:00)"
                placeholderTextColor="#6b7280"
                className="flex-1 bg-[#1a1d24] border border-white/10 rounded-xl px-4 py-3 text-white"
              />
            </View>
          )}
        </View>

        {/* Date Range Toggle */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-400 text-sm">Date Range</Text>
            <View className="flex-row bg-[#1a1d24] rounded-xl border border-white/10 overflow-hidden">
              <TouchableOpacity
                onPress={() => setIsDaily(true)}
                className={`px-4 py-2 ${isDaily ? 'bg-red-500/20' : ''}`}
              >
                <Text className={`text-sm ${isDaily ? 'text-red-400' : 'text-gray-400'}`}>Daily</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsDaily(false)}
                className={`px-4 py-2 ${!isDaily ? 'bg-red-500/20' : ''}`}
              >
                <Text className={`text-sm ${!isDaily ? 'text-red-400' : 'text-gray-400'}`}>Specific</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting || !name.trim()}
          className={`py-4 rounded-xl items-center mb-10
            ${!name.trim() ? 'bg-[#2a2d35]' : 'bg-red-500'}
            ${isSubmitting ? 'opacity-50' : ''}
          `}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`font-bold text-lg ${!name.trim() ? 'text-gray-500' : 'text-white'}`}>
              {isEditing ? 'Save Changes' : 'Add Habit'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
