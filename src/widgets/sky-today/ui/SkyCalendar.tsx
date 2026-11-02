import { Lucide } from '@react-native-vector-icons/lucide';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { theme } from '../../../shared/config/index.ts';
import { addMonths, buildMonthGrid, isSameDay, monthIndex, startOfDay } from '../lib/month-grid.ts';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
// The rise/set service accepts dates up to one year ahead.
const MAX_DAYS_AHEAD = 364;

export interface SkyCalendarProps {
  /** Selected day, or null for today (the next 24 hours from now). */
  selected: Date | null;
  onSelect(day: Date | null): void;
}

function formatMonth(value: Date): string {
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(value);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function SkyCalendar({ selected, onSelect }: SkyCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const max = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate() + MAX_DAYS_AHEAD),
    [today],
  );
  const effectiveSelected = selected ?? today;
  const [visibleMonth, setVisibleMonth] = useState(() => addMonths(effectiveSelected, 0));
  const weeks = useMemo(() => buildMonthGrid(visibleMonth, today, max), [max, today, visibleMonth]);
  const canGoBack = monthIndex(visibleMonth) > monthIndex(today);
  const canGoForward = monthIndex(visibleMonth) < monthIndex(max);

  return (
    <View className="gap-3 rounded-card border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityLabel="Mês anterior"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canGoBack }}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
          disabled={!canGoBack}
          onPress={() => setVisibleMonth((month) => addMonths(month, -1))}
        >
          <Lucide
            color={canGoBack ? theme.colors.accent : theme.colors.border}
            name="chevron-left"
            size={22}
          />
        </Pressable>
        <Pressable
          accessibilityLabel="Voltar para hoje"
          accessibilityRole="button"
          className="items-center active:opacity-70"
          onPress={() => {
            setVisibleMonth(addMonths(today, 0));
            onSelect(null);
          }}
        >
          <Text className="font-display text-base text-ink">{formatMonth(visibleMonth)}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Próximo mês"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canGoForward }}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
          disabled={!canGoForward}
          onPress={() => setVisibleMonth((month) => addMonths(month, 1))}
        >
          <Lucide
            color={canGoForward ? theme.colors.accent : theme.colors.border}
            name="chevron-right"
            size={22}
          />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAYS.map((label, index) => (
          <Text
            key={index}
            className="flex-1 text-center font-label text-[10px] uppercase text-muted"
          >
            {label}
          </Text>
        ))}
      </View>

      <View className="gap-1">
        {weeks.map((week) => (
          <View key={week[0]?.date.getTime()} className="flex-row">
            {week.map((cell) => {
              const isSelected = isSameDay(cell.date, effectiveSelected);
              const isToday = isSameDay(cell.date, today);
              return (
                <View key={cell.date.getTime()} className="flex-1 items-center">
                  {cell.inMonth ? (
                    <Pressable
                      accessibilityLabel={new Intl.DateTimeFormat('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      }).format(cell.date)}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: cell.disabled, selected: isSelected }}
                      className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
                      disabled={cell.disabled}
                      onPress={() => onSelect(isToday ? null : cell.date)}
                      style={{
                        backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                        borderColor: isToday && !isSelected ? theme.colors.accent : 'transparent',
                        borderWidth: 1,
                      }}
                    >
                      <Text
                        className="font-label text-sm"
                        style={{
                          color: isSelected
                            ? theme.colors.text
                            : cell.disabled
                              ? theme.colors.border
                              : theme.colors.text,
                        }}
                      >
                        {cell.date.getDate()}
                      </Text>
                    </Pressable>
                  ) : (
                    <View className="h-10 w-10" />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
