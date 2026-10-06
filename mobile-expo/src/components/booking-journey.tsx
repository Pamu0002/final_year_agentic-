import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import type { Reservation } from '@/types/mobile-types';

type StepState = 'complete' | 'current' | 'upcoming' | 'stopped';

const STEPS = [
  { key: 'reserved', label: 'Reserved', icon: 'calendar-outline' },
  { key: 'payment', label: 'Payment', icon: 'card-outline' },
  { key: 'confirm', label: 'Confirm', icon: 'storefront-outline' },
  { key: 'dining', label: 'Dining', icon: 'restaurant-outline' },
  { key: 'review', label: 'Review', icon: 'star-outline' },
] as const;

function getStates(reservation: Reservation): StepState[] {
  const cancelled = reservation.status === 'CANCELLED';
  const noShow = reservation.status === 'NO_SHOW';
  const paid = reservation.payment?.status === 'SUCCEEDED';
  const refunded = reservation.payment?.status === 'REFUNDED';
  const confirmed = ['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'NO_SHOW'].includes(reservation.status);
  const diningComplete = reservation.status === 'COMPLETED';

  return [
    'complete',
    paid ? 'complete' : cancelled || refunded ? 'stopped' : 'current',
    confirmed ? 'complete' : cancelled ? 'stopped' : paid ? 'current' : 'upcoming',
    diningComplete ? 'complete' : cancelled || noShow ? 'stopped' : ['CONFIRMED', 'CHECKED_IN'].includes(reservation.status) ? 'current' : 'upcoming',
    reservation.review ? 'complete' : cancelled || noShow ? 'stopped' : diningComplete ? 'current' : 'upcoming',
  ];
}

export function BookingJourney({ reservation, compact = false }: { reservation: Reservation; compact?: boolean }) {
  const theme = useTheme();
  const states = getStates(reservation);

  return (
    <View style={[styles.wrap, compact && styles.compactWrap, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.steps}>
        {STEPS.map((step, index) => {
          const state = states[index];
          const complete = state === 'complete';
          const stopped = state === 'stopped';
          const active = complete || state === 'current';
          const dotBackground = stopped
            ? `${theme.danger}20`
            : active
              ? theme.primary
              : theme.cardStrong;
          const dotColor = active ? theme.onPrimary : stopped ? theme.danger : theme.textSecondary;

          return (
            <View key={step.key} style={styles.step}>
              {index > 0 && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: complete ? theme.primary : theme.border },
                  ]}
                />
              )}
              <View style={[styles.dot, { backgroundColor: dotBackground, borderColor: stopped ? theme.danger : active ? theme.primary : theme.border }]}>
                <Ionicons
                  name={complete ? 'checkmark' : stopped ? 'close' : step.icon}
                  size={compact ? 13 : 14}
                  color={dotColor}
                />
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  compact && styles.compactLabel,
                  { color: state === 'upcoming' ? theme.textSecondary : theme.text },
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 8, paddingVertical: 13 },
  compactWrap: { paddingVertical: 10, borderRadius: 15 },
  steps: { flexDirection: 'row', alignItems: 'flex-start' },
  step: { flex: 1, alignItems: 'center', position: 'relative', minWidth: 0 },
  line: { position: 'absolute', height: 2, left: '-50%', right: '50%', top: 16 },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: { marginTop: 7, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  compactLabel: { fontSize: 9 },
});
