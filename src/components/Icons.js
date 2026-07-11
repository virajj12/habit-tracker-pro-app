import React from 'react';
import {
  Star, BedDouble, BookOpen, Dumbbell, Apple, Sprout, Coffee,
  GlassWater, Code, Pen, Music, PersonStanding, Palette
} from 'lucide-react-native';

// Maps the web app's icon key names to lucide-react-native components
const ICON_MAP = {
  star: Star,
  sleep: BedDouble,
  reading: BookOpen,
  workout: Dumbbell,
  nutrition: Apple,
  growth: Sprout,
  coffee: Coffee,
  water: GlassWater,
  coding: Code,
  writing: Pen,
  music: Music,
  cardio: PersonStanding,
  art: Palette,
};

/**
 * Renders an icon by its string key (matching the Habit.icon field).
 * Falls back to Star if the key is not found.
 *
 * @param {string} name - Icon key from the Habit model
 * @param {number} size - Icon size (default 20)
 * @param {string} color - Icon color (default '#ef4444')
 */
export function IconRenderer({ name, size = 20, color = '#ef4444', ...props }) {
  const IconComponent = ICON_MAP[name] || ICON_MAP.star;
  return <IconComponent size={size} color={color} {...props} />;
}

export { ICON_MAP };
export default IconRenderer;
