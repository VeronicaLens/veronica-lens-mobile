import type { LucideIconName } from '@react-native-vector-icons/lucide';

import { theme } from '../../../shared/config/index.ts';

export interface EventTypeInfo {
  label: string;
  icon: LucideIconName;
  color: string;
}

// Event types are curated slugs; unknown ones fall back to a humanized label.
const knownTypes: Record<string, EventTypeInfo> = {
  eclipse: { label: 'Eclipse', icon: 'moon', color: theme.colors.event },
  'solar-eclipse': { label: 'Eclipse solar', icon: 'sun', color: theme.colors.event },
  'lunar-eclipse': { label: 'Eclipse lunar', icon: 'moon', color: theme.colors.event },
  'meteor-shower': { label: 'Chuva de meteoros', icon: 'sparkles', color: theme.colors.accent },
  conjunction: { label: 'Conjunção', icon: 'link', color: theme.colors.info },
  occultation: { label: 'Ocultação', icon: 'eye-off', color: theme.colors.info },
  opposition: { label: 'Oposição', icon: 'orbit', color: theme.colors.accent },
  'moon-phase': { label: 'Fase da Lua', icon: 'moon', color: theme.colors.info },
  comet: { label: 'Cometa', icon: 'star', color: theme.colors.accent },
};

export function humanizeEventType(type: string): string {
  const words = type.trim().replace(/[-_]+/g, ' ');
  return words ? words.charAt(0).toLocaleUpperCase('pt-BR') + words.slice(1) : 'Evento';
}

export function getEventTypeInfo(type: string): EventTypeInfo {
  return (
    knownTypes[type] ?? {
      label: humanizeEventType(type),
      icon: 'calendar-days',
      color: theme.colors.info,
    }
  );
}
