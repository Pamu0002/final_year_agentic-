import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Screen } from '@/components/screen';
import { brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Reservation } from '@/types/mobile-types';
import { BookingJourney } from '@/components/booking-journey';

export default function ReservationsScreen() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'upcoming' | 'past'>('upcoming');

  // Selected Reservation Modal
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchReservations = () => {
    if (!user) return;
    setLoading(true);
    api<Reservation[]>('/api/reservations')
      .then((data) => setReservations(data))
      .catch((err) => setError(err.message || 'Could not fetch reservations.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReservations();
  }, [user]);

  const handleCancelReservation = async (resId: string) => {
    Alert.alert(
      'Cancel Reservation?',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await api(`/api/reservations/${resId}`, { method: 'DELETE' });
              setSelectedRes(null);
              fetchReservations();
              Alert.alert('Reservation Cancelled', 'Your table reservation has been cancelled.');
            } catch (err: any) {
              Alert.alert('Cancellation Error', err.message || 'Failed to cancel reservation.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const isPast = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  };

  const filteredReservations = reservations.filter((r) => {
    if (filterTab === 'upcoming') {
      return !isPast(r.date) && r.status !== 'CANCELLED';
    }
    return isPast(r.date) || r.status === 'CANCELLED';
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { bg: brand.mint, color: brand.green, label: 'Confirmed' };
      case 'PENDING':
        return { bg: '#F7ECD6', color: '#8A5B13', label: 'Awaiting restaurant' };
      case 'CHECKED_IN':
        return { bg: '#E5EDF8', color: '#315C91', label: 'Checked in' };
      case 'COMPLETED':
        return { bg: '#E0F2FE', color: '#0369A1', label: 'Completed' };
      case 'CANCELLED':
        return { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' };
      default:
        return { bg: brand.cream, color: brand.ink, label: status };
    }
  };

  if (!user) {
    return (
      <Screen style={{ paddingHorizontal: 16 }}>
        <Text style={styles.eyebrow}>MY DINING</Text>
        <Text style={styles.title}>Bookings & payments</Text>

        <View style={styles.authLockCard}>
          <Ionicons name="calendar-outline" size={42} color={brand.green} />
          <Text style={styles.authLockTitle}>Sign in to View Bookings</Text>
          <Text style={styles.authLockCopy}>
            Keep all your table reservations, active dates, party details, and deposit receipts in one calm place.
          </Text>
          <Pressable style={styles.authSignInBtn} onPress={() => router.push('/sign-in')}>
            <Text style={styles.authSignInText}>Sign in or Create Account</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingHorizontal: 16 }}>
      <Text style={styles.eyebrow}>MY DINING</Text>
      <Text style={styles.title}>Bookings & payments</Text>
      <Text style={styles.intro}>Follow each table from deposit to restaurant confirmation, dining, and review.</Text>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabBtn, filterTab === 'upcoming' && styles.activeTabBtn]}
          onPress={() => setFilterTab('upcoming')}
        >
          <Text style={[styles.tabText, filterTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, filterTab === 'past' && styles.activeTabBtn]}
          onPress={() => setFilterTab('past')}
        >
          <Text style={[styles.tabText, filterTab === 'past' && styles.activeTabText]}>
            Past & Cancelled
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={brand.green} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={24} color={brand.coral} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filteredReservations.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={34} color={brand.green} />
          </View>
          <Text style={styles.emptyTitle}>No {filterTab} reservations</Text>
          <Text style={styles.copy}>
            Discover restaurants and reserve your table in just a few taps.
          </Text>
          <Pressable style={styles.findBtn} onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.findBtnText}>Find a restaurant</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filteredReservations.map((res) => {
            const badge = getStatusBadge(res.status);
            return (
              <Pressable key={res.id} style={styles.card} onPress={() => setSelectedRes(res)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.resName}>{res.restaurant?.name || 'Restaurant'}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={styles.cardDetailRow}>
                  <Ionicons name="location-outline" size={16} color={brand.muted} />
                  <Text style={styles.detailText}>{res.restaurant?.area || 'Location'}</Text>
                </View>

                <View style={styles.cardDetailRow}>
                  <Ionicons name="time-outline" size={16} color={brand.muted} />
                  <Text style={styles.detailText}>
                    {res.date} at {res.time} · {res.partySize} guests
                  </Text>
                </View>

                <View style={styles.paymentSummary}>
                  <Ionicons name="card-outline" size={15} color={brand.green} />
                  <Text style={styles.paymentText}>
                    {res.payment?.status === 'SUCCEEDED'
                      ? `${res.payment.currency} ${res.payment.amount.toLocaleString()} paid`
                      : res.payment?.status === 'REFUNDED'
                        ? 'Deposit refunded'
                        : 'Deposit payment required'}
                  </Text>
                </View>

                <BookingJourney reservation={res} compact />
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Reservation Detail Modal */}
      <Modal visible={!!selectedRes} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          {selectedRes && (
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reservation Details</Text>
                <Pressable onPress={() => setSelectedRes(null)}>
                  <Ionicons name="close" size={22} color={brand.ink} />
                </Pressable>
              </View>

              <Text style={styles.venueTitle}>{selectedRes.restaurant?.name}</Text>
              <Text style={styles.venueArea}>{selectedRes.restaurant?.area}</Text>

              <View style={styles.modalMetaCard}>
                <View style={styles.metaLine}>
                  <Text style={styles.metaLabel}>Date & Time:</Text>
                  <Text style={styles.metaVal}>
                    {selectedRes.date} at {selectedRes.time}
                  </Text>
                </View>

                <View style={styles.metaLine}>
                  <Text style={styles.metaLabel}>Guests:</Text>
                  <Text style={styles.metaVal}>{selectedRes.partySize} People</Text>
                </View>

                <View style={styles.metaLine}>
                  <Text style={styles.metaLabel}>Status:</Text>
                  <Text style={[styles.metaVal, { color: getStatusBadge(selectedRes.status).color }]}>
                    {getStatusBadge(selectedRes.status).label}
                  </Text>
                </View>

                {selectedRes.specialRequests && (
                  <View style={styles.metaLine}>
                    <Text style={styles.metaLabel}>Requests:</Text>
                    <Text style={styles.metaVal}>{selectedRes.specialRequests}</Text>
                  </View>
                )}
              </View>

              <View style={styles.modalSectionHeader}>
                <Text style={styles.modalSectionTitle}>Booking progress</Text>
                <Text style={styles.modalSectionCaption}>Live status</Text>
              </View>
              <BookingJourney reservation={selectedRes} />

              <View style={styles.paymentCard}>
                <View style={styles.paymentCardIcon}>
                  <Ionicons name="receipt-outline" size={18} color={brand.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentCardLabel}>Reservation deposit</Text>
                  <Text style={styles.paymentCardValue}>
                    {selectedRes.payment
                      ? `${selectedRes.payment.currency} ${selectedRes.payment.amount.toLocaleString()} · ${selectedRes.payment.status}`
                      : 'Payment not completed'}
                  </Text>
                </View>
              </View>

              {selectedRes.status !== 'CANCELLED' && !isPast(selectedRes.date) && (
                <Pressable
                  style={styles.cancelActionBtn}
                  onPress={() => handleCancelReservation(selectedRes.id)}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <ActivityIndicator color="#DC2626" />
                  ) : (
                    <Text style={styles.cancelActionText}>Cancel Booking</Text>
                  )}
                </Pressable>
              )}
            </View>
          )}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: brand.coral, fontWeight: '800', letterSpacing: 1.4, fontSize: 12 },
  title: { fontSize: 28, color: brand.ink, fontWeight: '700', letterSpacing: -0.8, marginBottom: 12 },
  intro: { color: brand.muted, fontSize: 14, lineHeight: 20, marginTop: -10, marginBottom: 4 },
  authLockCard: {
    marginTop: 40,
    alignItems: 'center',
    padding: 28,
    gap: 12,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  authLockTitle: { fontSize: 20, fontWeight: '800', color: brand.ink },
  authLockCopy: { color: brand.muted, textAlign: 'center', fontSize: 14, lineHeight: 21 },
  authSignInBtn: { marginTop: 8, backgroundColor: brand.green, paddingVertical: 13, paddingHorizontal: 22, borderRadius: 14 },
  authSignInText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTabBtn: { backgroundColor: brand.green },
  tabText: { fontWeight: '600', color: brand.muted, fontSize: 13 },
  activeTabText: { color: '#FFFFFF' },
  empty: {
    marginTop: 20,
    alignItems: 'center',
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  emptyIcon: { height: 64, width: 64, backgroundColor: brand.mint, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: brand.ink, fontSize: 18, fontWeight: '700' },
  copy: { color: brand.muted, lineHeight: 20, textAlign: 'center', fontSize: 14 },
  findBtn: { backgroundColor: brand.green, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  findBtnText: { color: '#FFFFFF', fontWeight: '700' },
  errorContainer: { marginTop: 20, padding: 14, backgroundColor: '#F0E6D6', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: { color: brand.ink, fontSize: 13, flex: 1 },
  list: { gap: 12, paddingBottom: 24 },
  card: { padding: 16, borderWidth: 1, borderColor: brand.border, borderRadius: 20, backgroundColor: '#FFFFFF', gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resName: { fontSize: 17, fontWeight: '700', color: brand.ink, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  cardDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: brand.muted, fontSize: 13 },
  paymentSummary: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  paymentText: { color: brand.ink, fontWeight: '600', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 30, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: brand.ink },
  venueTitle: { fontSize: 22, fontWeight: '700', color: brand.ink },
  venueArea: { fontSize: 14, color: brand.muted, marginBottom: 14 },
  modalMetaCard: { backgroundColor: brand.cream, borderRadius: 14, padding: 14, gap: 8, marginBottom: 16 },
  metaLine: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontWeight: '600', color: brand.muted, fontSize: 13 },
  metaVal: { fontWeight: '700', color: brand.ink, fontSize: 13 },
  modalSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalSectionTitle: { color: brand.ink, fontSize: 15, fontWeight: '800' },
  modalSectionCaption: { color: brand.green, fontSize: 11, fontWeight: '700' },
  paymentCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: brand.cream, borderRadius: 15, padding: 13, marginTop: 12, marginBottom: 16 },
  paymentCardIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: brand.mint, alignItems: 'center', justifyContent: 'center' },
  paymentCardLabel: { color: brand.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  paymentCardValue: { color: brand.ink, fontSize: 13, fontWeight: '700', marginTop: 2 },
  cancelActionBtn: {
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelActionText: { color: '#DC2626', fontWeight: '700', fontSize: 15 },
});
