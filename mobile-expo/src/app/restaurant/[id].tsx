import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Screen } from '@/components/screen';
import { brand } from '@/constants/brand';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { MenuItem, Promotion, Restaurant, Review } from '@/types/mobile-types';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab selection inside restaurant page
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'offers' | 'reviews'>('overview');

  // Booking Modal State
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('19:00');
  const [partySize, setPartySize] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [availability, setAvailability] = useState<{ time: string; available: boolean; remainingSeats: number; reason?: string | null }[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Waitlist Modal State
  const [waitlistModalVisible, setWaitlistModalVisible] = useState(false);
  const [waitlistPartySize, setWaitlistPartySize] = useState(2);
  const [submittingWaitlist, setSubmittingWaitlist] = useState(false);

  // Favorite State
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      api<Restaurant>(`/api/restaurants/${id}`).catch(() => null),
      api<MenuItem[]>(`/api/restaurants/${id}/menu`).catch(() => []),
      api<Promotion[]>(`/api/restaurants/${id}/promotions`).catch(() => []),
      api<{ data: Review[] }>(`/api/restaurants/${id}/reviews`).then((res) => res.data).catch(() => []),
    ])
      .then(([restData, menuData, promoData, reviewData]) => {
        if (!restData) {
          setError('Restaurant not found or server offline.');
        } else {
          setRestaurant(restData);
          setMenuItems(menuData);
          setPromotions(promoData);
          setReviews(reviewData);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || (!bookingModalVisible && !waitlistModalVisible) || !bookingDate) return;
    setAvailabilityLoading(true);
    api<{ time: string; available: boolean; remainingSeats: number; reason?: string | null }[]>(
      `/api/restaurants/${id}/slot-capacity?date=${encodeURIComponent(bookingDate)}&partySize=${partySize}`,
    )
      .then((slots) => {
        setAvailability(slots);
        if (!slots.some((slot) => slot.time === bookingTime && slot.available)) {
          setBookingTime(slots.find((slot) => slot.available)?.time ?? '');
        }
      })
      .catch(() => setAvailability([]))
      .finally(() => setAvailabilityLoading(false));
  }, [id, bookingModalVisible, waitlistModalVisible, bookingDate, partySize]);

  useEffect(() => {
    if (!id || !user) return;
    api<{ isFavorited: boolean }>(`/api/users/me/favorites/${id}/check`)
      .then((result) => setIsFavorite(result.isFavorited))
      .catch(() => undefined);
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }
    setIsFavorite(!isFavorite);
    try {
      if (!isFavorite) {
        await api('/api/users/me/favorites', { method: 'POST', body: { restaurantId: id } });
      } else {
        await api(`/api/users/me/favorites/${id}`, { method: 'DELETE' });
      }
    } catch (e) {
      // Revert if error
      setIsFavorite(isFavorite);
    }
  };

  const handleBookTable = async () => {
    if (!id || !bookingTime) return;
    setSubmittingBooking(true);
    let pendingReservationId: string | null = null;
    try {
      const reservation = await api<{ id: string }>('/api/reservations', {
        method: 'POST',
        body: {
          restaurantId: id,
          date: bookingDate,
          time: bookingTime,
          partySize,
          specialRequests: specialRequests || undefined,
        },
      });
      pendingReservationId = reservation.id;
      const checkout = await api<{ paymentUrl: string }>('/api/payments/checkout-session', {
        method: 'POST',
        body: { reservationId: reservation.id, orderItems: [] },
      });
      setBookingModalVisible(false);
      await WebBrowser.openBrowserAsync(checkout.paymentUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
      router.push('/(tabs)/reservations');
    } catch (err: any) {
      if (pendingReservationId) {
        await api(`/api/reservations/${pendingReservationId}`, { method: 'DELETE' }).catch(() => undefined);
      }
      Alert.alert('Booking Error', err.message || 'Could not place reservation.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!id || !bookingTime) {
      Alert.alert('Select a time', 'Choose a date and unavailable time before joining the waitlist.');
      return;
    }
    setSubmittingWaitlist(true);
    try {
      await api('/api/waitlist', {
        method: 'POST',
        body: { restaurantId: id, date: bookingDate, time: bookingTime, partySize: waitlistPartySize },
      });
      setWaitlistModalVisible(false);
      Alert.alert('Joined Waitlist!', 'You have been added to the queue.');
    } catch (err: any) {
      Alert.alert('Waitlist Error', err.message || 'Could not join waitlist.');
    } finally {
      setSubmittingWaitlist(false);
    }
  };

  if (loading) {
    return (
      <Screen style={styles.centerContainer}>
        <ActivityIndicator size="large" color={brand.green} />
        <Text style={{ marginTop: 12, color: brand.muted }}>Loading restaurant details...</Text>
      </Screen>
    );
  }

  if (error || !restaurant) {
    return (
      <Screen style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={brand.coral} />
        <Text style={styles.errorTitle}>Error Loading Venue</Text>
        <Text style={styles.errorDesc}>{error || 'Could not find details.'}</Text>
        <Pressable
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/explore'))}
        >
          <Text style={styles.backBtnText}>Back to Explore</Text>
        </Pressable>
      </Screen>
    );
  }

  const cover = restaurant.coverImageUrl || (restaurant.imageUrls && restaurant.imageUrls[0]);
  const categories = Array.from(new Set(menuItems.map((m) => m.category || 'Main Course')));

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      {/* Top Navigation Bar */}
      <View style={styles.navHeader}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/explore'))}
          style={styles.headerIconBtn}
        >
          <Ionicons name="arrow-back" size={22} color={brand.ink} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <Pressable onPress={toggleFavorite} style={styles.headerIconBtn}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? brand.coral : brand.ink}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover Hero Banner */}
        <View style={styles.heroContainer}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="restaurant" size={48} color={brand.green} />
            </View>
          )}

          {restaurant.profileImageUrl && (
            <Image source={{ uri: restaurant.profileImageUrl }} style={styles.profileBadge} resizeMode="cover" />
          )}
        </View>

        {/* Header Details Info */}
        <View style={styles.detailsHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            {restaurant.isVerified && <Ionicons name="checkmark-circle" size={20} color={brand.green} />}
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={brand.muted} />
            <Text style={styles.areaText}>
              {restaurant.area} · {restaurant.address}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Ionicons name="star" size={15} color={brand.gold} />
              <Text style={styles.statText}>
                {restaurant.avgRating ? restaurant.avgRating.toFixed(1) : 'New'} ({restaurant.totalReviews} reviews)
              </Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statText}>Price: {restaurant.priceRange}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statText}>Deposit: LKR {restaurant.reservationDeposit}</Text>
            </View>
          </View>
        </View>

        {/* Section Tabs */}
        <View style={styles.tabsRow}>
          {(['overview', 'menu', 'offers', 'reviews'] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {restaurant.description && (
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeading}>About {restaurant.name}</Text>
                <Text style={styles.bodyText}>{restaurant.description}</Text>
              </View>
            )}

            <View style={styles.cardSection}>
              <Text style={styles.sectionHeading}>Contact & Location</Text>
              {restaurant.phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={18} color={brand.green} />
                  <Text style={styles.infoText}>{restaurant.phone}</Text>
                </View>
              )}
              {restaurant.email && (
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={18} color={brand.green} />
                  <Text style={styles.infoText}>{restaurant.email}</Text>
                </View>
              )}
              {restaurant.website && (
                <View style={styles.infoRow}>
                  <Ionicons name="globe-outline" size={18} color={brand.green} />
                  <Text style={styles.infoText}>{restaurant.website}</Text>
                </View>
              )}
            </View>

            {restaurant.openingHours && (
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeading}>Opening Hours</Text>
                {Object.entries(restaurant.openingHours).map(([day, val]) => (
                  <View key={day} style={styles.hoursRow}>
                    <Text style={styles.dayText}>{day.toUpperCase()}</Text>
                    <Text style={styles.hoursText}>
                      {typeof val === 'object' && val?.open
                        ? `${val.open} - ${val.close}`
                        : 'Open Regular Hours'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab 2: Menu */}
        {activeTab === 'menu' && (
          <View style={styles.tabContent}>
            {categories.map((category) => (
              <View key={category} style={{ marginBottom: 16 }}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {menuItems
                  .filter((m) => (m.category || 'Main Course') === category)
                  .map((item) => (
                    <View key={item.id} style={styles.menuCard}>
                      {item.imageUrl && (
                        <Image source={{ uri: item.imageUrl }} style={styles.menuImage} resizeMode="cover" />
                      )}
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.menuItemName}>{item.name}</Text>
                        {item.description && (
                          <Text style={styles.menuItemDesc} numberOfLines={2}>
                            {item.description}
                          </Text>
                        )}
                        <Text style={styles.menuItemPrice}>LKR {item.price.toLocaleString()}</Text>
                      </View>
                    </View>
                  ))}
              </View>
            ))}
          </View>
        )}

        {/* Tab 3: Offers */}
        {activeTab === 'offers' && (
          <View style={styles.tabContent}>
            {promotions.length === 0 ? (
              <Text style={styles.emptyText}>No special promotions running currently.</Text>
            ) : (
              promotions.map((p) => (
                <View key={p.id} style={styles.promoCard}>
                  <View style={styles.promoBadge}>
                    <Text style={styles.promoBadgeText}>{p.type}</Text>
                  </View>
                  <Text style={styles.promoTitle}>{p.title}</Text>
                  {p.description && <Text style={styles.promoDesc}>{p.description}</Text>}
                  <Text style={styles.promoDiscount}>
                    {p.discountValue ? `${p.discountValue}% OFF` : 'Special Event'}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab 4: Reviews */}
        {activeTab === 'reviews' && (
          <View style={styles.tabContent}>
            {reviews.length === 0 ? (
              <Text style={styles.emptyText}>No customer reviews yet.</Text>
            ) : (
              reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUser}>{rev.user?.name || 'Customer'}</Text>
                    <Text style={styles.reviewRating}>★ {rev.rating}</Text>
                  </View>
                  {rev.comment && <Text style={styles.reviewComment}>{rev.comment}</Text>}
                  {rev.reply && (
                    <View style={styles.ownerReply}>
                      <Text style={styles.ownerReplyTag}>Response from Owner:</Text>
                      <Text style={styles.ownerReplyText}>{rev.reply.content}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Booking Bar */}
      <View style={styles.bottomActionBar}>
        <Pressable style={styles.bookBtn} onPress={() => setBookingModalVisible(true)}>
          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
          <Text style={styles.bookBtnText}>Reserve Table</Text>
        </Pressable>

        <Pressable style={styles.waitlistBtn} onPress={() => setWaitlistModalVisible(true)}>
          <Ionicons name="people-outline" size={18} color={brand.green} />
          <Text style={styles.waitlistBtnText}>Waitlist</Text>
        </Pressable>
      </View>

      {/* Table Booking Modal */}
      <Modal visible={bookingModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book a Table at {restaurant.name}</Text>
              <Pressable onPress={() => setBookingModalVisible(false)}>
                <Ionicons name="close" size={22} color={brand.ink} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={bookingDate}
                onChangeText={setBookingDate}
                placeholder="2026-09-25"
              />

              <Text style={styles.label}>Time Slot</Text>
              {availabilityLoading ? (
                <ActivityIndicator color={brand.green} style={{ marginVertical: 16 }} />
              ) : availability.length === 0 ? (
                <Text style={styles.emptyText}>No bookable times are available for this date and party size.</Text>
              ) : (
              <View style={styles.timeSlots}>
                {availability.map((slot) => (
                  <Pressable
                    key={slot.time}
                    disabled={!slot.available}
                    style={[styles.slotBtn, bookingTime === slot.time && styles.slotBtnActive, !slot.available && { opacity: 0.35 }]}
                    onPress={() => setBookingTime(slot.time)}
                  >
                    <Text style={[styles.slotText, bookingTime === slot.time && styles.slotTextActive]}>
                      {slot.time}
                    </Text>
                    {slot.available && <Text style={[styles.slotCapacity, bookingTime === slot.time && styles.slotTextActive]}>{slot.remainingSeats} seats</Text>}
                  </Pressable>
                ))}
              </View>
              )}

              <Text style={styles.label}>Party Size: {partySize} guests</Text>
              <View style={styles.partyRow}>
                {[1, 2, 3, 4, 6, 8, 10].map((num) => (
                  <Pressable
                    key={num}
                    style={[styles.partyChip, partySize === num && styles.partyChipActive]}
                    onPress={() => setPartySize(num)}
                  >
                    <Text style={[styles.partyChipText, partySize === num && styles.partyChipTextActive]}>
                      {num}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Special Requests (Optional)</Text>
              <TextInput
                style={[styles.input, { height: 70 }]}
                multiline
                value={specialRequests}
                onChangeText={setSpecialRequests}
                placeholder="Dietary preferences, seating preference..."
              />

              {restaurant.reservationDeposit > 0 && (
                <View style={styles.depositNotice}>
                  <Ionicons name="information-circle" size={18} color={brand.coral} />
                  <Text style={styles.depositNoticeText}>
                    This restaurant requires a LKR {restaurant.reservationDeposit} deposit per reservation.
                  </Text>
                </View>
              )}
            </ScrollView>

            <Pressable
              style={styles.confirmBtn}
              onPress={handleBookTable}
              disabled={submittingBooking}
            >
              {submittingBooking ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Continue to secure payment</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Join Waitlist Modal */}
      <Modal visible={waitlistModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Waitlist</Text>
              <Pressable onPress={() => setWaitlistModalVisible(false)}>
                <Ionicons name="close" size={22} color={brand.ink} />
              </Pressable>
            </View>

            <Text style={styles.label}>For {bookingDate} at {bookingTime || 'a selected time'}</Text>
            <TextInput style={styles.input} value={bookingDate} onChangeText={setBookingDate} placeholder="YYYY-MM-DD" />
            <View style={styles.timeSlots}>
              {availability.map((slot) => <Pressable key={slot.time} style={[styles.slotBtn, bookingTime===slot.time&&styles.slotBtnActive]} onPress={()=>setBookingTime(slot.time)}><Text style={[styles.slotText,bookingTime===slot.time&&styles.slotTextActive]}>{slot.time}</Text></Pressable>)}
            </View>
            <Text style={styles.label}>Party Size</Text>
            <View style={styles.partyRow}>
              {[1, 2, 3, 4, 6, 8].map((num) => (
                <Pressable
                  key={num}
                  style={[styles.partyChip, waitlistPartySize === num && styles.partyChipActive]}
                  onPress={() => setWaitlistPartySize(num)}
                >
                  <Text
                    style={[styles.partyChipText, waitlistPartySize === num && styles.partyChipTextActive]}
                  >
                    {num}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.confirmBtn, { marginTop: 24 }]}
              onPress={handleJoinWaitlist}
              disabled={submittingWaitlist}
            >
              {submittingWaitlist ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Get in Line</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: brand.ink, marginTop: 12 },
  errorDesc: { color: brand.muted, textAlign: 'center', marginTop: 4 },
  backBtn: { marginTop: 16, backgroundColor: brand.green, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
  backBtnText: { color: '#FFFFFF', fontWeight: '700' },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
    backgroundColor: '#FFFFFF',
  },
  headerIconBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: brand.ink, flex: 1, textAlign: 'center' },
  scrollContent: { paddingBottom: 90 },
  heroContainer: { height: 180, width: '100%', position: 'relative', backgroundColor: brand.mint },
  heroImage: { height: '100%', width: '100%' },
  heroPlaceholder: { height: '100%', alignItems: 'center', justifyContent: 'center' },
  profileBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    position: 'absolute',
    bottom: -20,
    left: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  detailsHeader: { padding: 16, paddingTop: 26, backgroundColor: '#FFFFFF' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  restaurantName: { fontSize: 24, fontWeight: '700', color: brand.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  areaText: { color: brand.muted, fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: brand.cream,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statText: { fontSize: 12, fontWeight: '600', color: brand.ink },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
    backgroundColor: '#FFFFFF',
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTabBtn: { borderBottomWidth: 2, borderBottomColor: brand.green },
  tabText: { fontSize: 13, fontWeight: '600', color: brand.muted },
  activeTabText: { color: brand.green },
  tabContent: { padding: 16 },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: brand.ink, marginBottom: 8 },
  bodyText: { fontSize: 14, color: brand.muted, lineHeight: 21 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  infoText: { fontSize: 14, color: brand.ink },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  dayText: { fontSize: 12, fontWeight: '700', color: brand.ink },
  hoursText: { fontSize: 12, color: brand.muted },
  categoryTitle: { fontSize: 18, fontWeight: '700', color: brand.ink, marginBottom: 10 },
  menuCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: 10,
  },
  menuImage: { width: 70, height: 70, borderRadius: 10 },
  menuItemName: { fontSize: 15, fontWeight: '700', color: brand.ink },
  menuItemDesc: { fontSize: 13, color: brand.muted },
  menuItemPrice: { fontSize: 14, fontWeight: '700', color: brand.green, marginTop: 4 },
  promoCard: {
    backgroundColor: '#F0E6D6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: brand.gold,
  },
  promoBadge: { backgroundColor: brand.coral, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  promoBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  promoTitle: { fontSize: 17, fontWeight: '700', color: brand.ink, marginTop: 6 },
  promoDesc: { fontSize: 13, color: brand.muted, marginTop: 2 },
  promoDiscount: { fontSize: 15, fontWeight: '800', color: brand.coral, marginTop: 8 },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.border,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewUser: { fontWeight: '700', color: brand.ink },
  reviewRating: { fontWeight: '700', color: brand.gold },
  reviewComment: { color: brand.muted, fontSize: 13 },
  ownerReply: { marginTop: 8, backgroundColor: brand.mint, padding: 8, borderRadius: 8 },
  ownerReplyTag: { fontSize: 11, fontWeight: '700', color: brand.green },
  ownerReplyText: { fontSize: 12, color: brand.ink, marginTop: 2 },
  emptyText: { textAlign: 'center', color: brand.muted, marginTop: 20 },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: brand.border,
  },
  bookBtn: {
    flex: 2,
    backgroundColor: brand.green,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  waitlistBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: brand.green,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  waitlistBtnText: { color: brand.green, fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: brand.ink },
  label: { fontSize: 14, fontWeight: '600', color: brand.ink, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 15,
    color: brand.ink,
  },
  timeSlots: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  slotBtn: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: brand.border, borderRadius: 10 },
  slotBtnActive: { backgroundColor: brand.green, borderColor: brand.green },
  slotText: { fontSize: 13, fontWeight: '600', color: brand.ink },
  slotCapacity: { color: brand.muted, fontSize: 9, marginTop: 2 },
  slotTextActive: { color: '#FFFFFF' },
  partyRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  partyChip: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: brand.border, alignItems: 'center', justifyContent: 'center' },
  partyChipActive: { backgroundColor: brand.green, borderColor: brand.green },
  partyChipText: { fontWeight: '700', color: brand.ink },
  partyChipTextActive: { color: '#FFFFFF' },
  depositNotice: { flexDirection: 'row', gap: 8, backgroundColor: '#F0E6D6', padding: 10, borderRadius: 10, marginTop: 14 },
  depositNoticeText: { color: brand.coral, fontSize: 12, flex: 1, lineHeight: 16 },
  confirmBtn: { backgroundColor: brand.green, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  confirmBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
