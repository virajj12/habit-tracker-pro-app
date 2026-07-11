import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Handle notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get notification token for push notification!');
    return false;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

/**
 * Schedules local notifications based on habits.
 * It cancels all previous notifications and creates new daily triggers.
 */
export async function scheduleHabitReminders(habits) {
  // Clear existing scheduled notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (const habit of habits) {
    // Only process visible/active habits
    if (habit.isVisible === false) continue;

    const skipDays = habit.skipDays || [];
    const st = habit.scheduledTime;

    let hour = null;
    let minute = null;

    if (st?.timeOption === 'fixed' && st?.fixedTime) {
      const [h, m] = st.fixedTime.split(':');
      hour = parseInt(h, 10);
      minute = parseInt(m, 10);
    } else if (st?.timeOption === 'range' && st?.timeRangeStart) {
      const [h, m] = st.timeRangeStart.split(':');
      hour = parseInt(h, 10);
      minute = parseInt(m, 10);
    } else {
      // For 'anytime', let's schedule a generic morning reminder at 9:00 AM
      hour = 9;
      minute = 0;
    }

    if (hour !== null && minute !== null && !isNaN(hour) && !isNaN(minute)) {
      // Create a daily repeating trigger for days not skipped
      // Since expo-notifications daily triggers fire every day, we will schedule 
      // specific weekday triggers if skipDays are used, otherwise a daily one.
      
      if (skipDays.length === 0) {
        // Daily
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${habit.name}!`,
            body: `Keep your streak alive. Tap to mark as completed.`,
            data: { habitId: habit._id },
          },
          trigger: {
            hour,
            minute,
            repeats: true,
          },
        });
      } else {
        // Schedule specifically for each day it's NOT skipped
        for (let i = 0; i < 7; i++) {
          const dayName = dayNames[i];
          if (!skipDays.includes(dayName)) {
            // Note: weekday in expo-notifications is 1-7 (Sun-Sat) on iOS, but 1-7 (Sun-Sat) on Android too.
            const weekday = i + 1; 
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `Time for ${habit.name}!`,
                body: `Keep your streak alive. Tap to mark as completed.`,
                data: { habitId: habit._id },
              },
              trigger: {
                weekday,
                hour,
                minute,
                repeats: true,
              },
            });
          }
        }
      }
    }
  }
}
