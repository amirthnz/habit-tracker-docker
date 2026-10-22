import React from 'react';
import {
  Sun,
  Flame,
  Zap,
  Dumbbell,
  BookOpen,
  Droplet,
  Moon,
  Heart,
  Smile,
  Sparkles,
  Target,
  Coffee,
  Check,
  LucideProps,
} from 'lucide-react';

interface HabitIconProps extends LucideProps {
  name: string;
}

export const ICON_OPTIONS = [
  { id: 'Sun', label: 'Sun', Icon: Sun },
  { id: 'Flame', label: 'Flame', Icon: Flame },
  { id: 'Zap', label: 'Energy', Icon: Zap },
  { id: 'Dumbbell', label: 'Workout', Icon: Dumbbell },
  { id: 'BookOpen', label: 'Reading', Icon: BookOpen },
  { id: 'Droplet', label: 'Water', Icon: Droplet },
  { id: 'Moon', label: 'Sleep', Icon: Moon },
  { id: 'Heart', label: 'Health', Icon: Heart },
  { id: 'Smile', label: 'Mood', Icon: Smile },
  { id: 'Sparkles', label: 'Magic', Icon: Sparkles },
  { id: 'Target', label: 'Focus', Icon: Target },
  { id: 'Coffee', label: 'Routine', Icon: Coffee },
];

export const COLOR_OPTIONS = [
  { hex: '#f59e0b', name: 'Amber Glow' },
  { hex: '#6366f1', name: 'Electric Indigo' },
  { hex: '#10b981', name: 'Emerald Peak' },
  { hex: '#ec4899', name: 'Rose Quartz' },
  { hex: '#06b6d4', name: 'Cyan Flow' },
  { hex: '#8b5cf6', name: 'Royal Violet' },
  { hex: '#f97316', name: 'Blaze Orange' },
];

export const HabitIcon: React.FC<HabitIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Sun':
      return <Sun {...props} />;
    case 'Flame':
      return <Flame {...props} />;
    case 'Zap':
      return <Zap {...props} />;
    case 'Dumbbell':
      return <Dumbbell {...props} />;
    case 'BookOpen':
      return <BookOpen {...props} />;
    case 'Droplet':
      return <Droplet {...props} />;
    case 'Moon':
      return <Moon {...props} />;
    case 'Heart':
      return <Heart {...props} />;
    case 'Smile':
      return <Smile {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'Target':
      return <Target {...props} />;
    case 'Coffee':
      return <Coffee {...props} />;
    default:
      return <Sparkles {...props} />;
  }
};
