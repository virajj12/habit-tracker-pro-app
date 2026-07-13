import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Handle notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permissions from the user.
 * On Android 13+, this triggers the system permission dialog.
 * Also creates a high-importance notification channel for Android.
 * Returns true if permissions were granted.
 */
export async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted!');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habit-reminders', {
      name: 'Habit Reminders',
      description: 'Daily reminders for your habits',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
      lightColor: '#ef4444',
      sound: 'default',
    });
  }

  return true;
}

/**
 * Returns true if notification permissions are currently granted.
 */
export async function checkPermissionStatus() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedules local notifications based on habits.
 * It cancels all previous notifications and creates new daily/weekly triggers.
 * Respects the user's notification toggle setting.
 * Uses cached habit data so it works offline too.
 */
export async function scheduleHabitReminders(habits) {
  // Always clear existing scheduled notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Check user preference — exit if user disabled notifications
  const notificationsEnabled = await SecureStore.getItemAsync('notifications_enabled');
  if (notificationsEnabled === 'false') {
    return;
  }

  // Check that permission is actually granted
  const hasPermission = await checkPermissionStatus();
  if (!hasPermission) {
    console.log('Notifications permission not granted, skipping scheduling.');
    return;
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (const habit of habits) {
    // Only process visible/active habits
    if (habit.isVisible === false) continue;

    const skipDays = habit.skipDays || [];
    const st = habit.scheduledTime;

    let hour = null;
    let minute = null;
    let isSpecificTime = false;

    if (st?.timeOption === 'fixed' && st?.fixedTime) {
      const [h, m] = st.fixedTime.split(':');
      hour = parseInt(h, 10);
      minute = parseInt(m, 10);
      isSpecificTime = true;
    } else if (st?.timeOption === 'range' && st?.timeRangeStart) {
      const [h, m] = st.timeRangeStart.split(':');
      hour = parseInt(h, 10);
      minute = parseInt(m, 10);
      isSpecificTime = true;
    } else {
      // For 'anytime', schedule a generic morning reminder at 9:00 AM
      hour = 9;
      minute = 0;
    }

    if (hour !== null && minute !== null && !isNaN(hour) && !isNaN(minute)) {
      // Build the notification content with proper formatting
      const notificationContent = {
        title: `⏰ ${habit.name}`,
        body: isSpecificTime
          ? `It's time for "${habit.name}"! Keep your streak alive! 🔥`
          : `Good morning! Time to work on "${habit.name}". Keep your streak alive! 🔥`,
        data: { habitId: habit._id },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'habit-reminders' }),
      };

      if (skipDays.length === 0) {
        // Daily notification — use DAILY trigger type
        try {
          await Notifications.scheduleNotificationAsync({
            content: notificationContent,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour,
              minute,
            },
          });
        } catch (err) {
          console.error(`Failed to schedule daily notification for "${habit.name}":`, err);
        }
      } else {
        // Schedule specifically for each day it's NOT skipped using WEEKLY trigger
        for (let i = 0; i < 7; i++) {
          const dayName = dayNames[i];
          if (!skipDays.includes(dayName)) {
            // weekday: 1 = Sunday, 2 = Monday, ..., 7 = Saturday
            const weekday = i + 1;
            try {
              await Notifications.scheduleNotificationAsync({
                content: notificationContent,
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                  weekday,
                  hour,
                  minute,
                },
              });
            } catch (err) {
              console.error(`Failed to schedule weekly notification for "${habit.name}" on ${dayName}:`, err);
            }
          }
        }
      }
    }
  }

  // Log scheduled notifications for debugging
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log(`✅ Scheduled ${scheduled.length} notifications total.`);
}
