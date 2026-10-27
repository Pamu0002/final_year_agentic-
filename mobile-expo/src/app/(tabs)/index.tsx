import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/screen';
import { BookingJourney } from '@/components/booking-journey';
import { brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Reservation, Restaurant } from '@/types/mobile-types';

export default function HomeScreen() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState<Restaurant | null>(null);
  const [nextBooking, setNextBooking] = useState<Reservation | null>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    api<{ data: Restaurant[] }>('/api/restaurants?limit=1')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setFeatured(res.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      setNextBooking(null);
      return;
    }

    let mounted = true;
    const loadBooking = () => {
      api<Reservation[]>('/api/reservations')
        .then((items) => {
          if (!mounted) return;
          const active = items
            .filter((item) => ['PENDING', 'MODIFIED', 'CONFIRMED', 'CHECKED_IN'].includes(item.status))
            .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))[0];
          const waitingForReview = items.find((item) => item.status === 'COMPLETED' && !item.review);
          setNextBooking(active || waitingForReview || null);
        })
        .catch(() => {});
    };

    loadBooking();
    const timer = setInterval(loadBooking, 20_000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [user]);

  const bookingAction = nextBooking
    ? nextBooking.payment?.status !== 'SUCCEEDED' && ['PENDING', 'MODIFIED', 'CONFIRMED'].includes(nextBooking.status)
      ? { eyebrow: 'ACTION REQUIRED', title: 'Complete your deposit', copy: 'Secure the booking so the restaurant can review it.', icon: 'card-outline' as const }
      : nextBooking.status === 'PENDING'
        ? { eyebrow: 'RESTAURANT RESPONSE', title: 'Waiting for confirmation', copy: 'Payment received. You will be notified as soon as the restaurant responds.', icon: 'storefront-outline' as const }
        : nextBooking.status === 'MODIFIED'
          ? { eyebrow: 'CHANGES SENT', title: 'Waiting for reconfirmation', copy: 'The restaurant is reviewing your updated date, time, or party size.', icon: 'time-outline' as const }
        : nextBooking.status === 'CONFIRMED'
          ? { eyebrow: 'YOU’RE ALL SET', title: 'Your table is confirmed', copy: 'Review your booking details before you arrive.', icon: 'checkmark-circle-outline' as const }
          : nextBooking.status === 'CHECKED_IN'
            ? { eyebrow: 'DINING NOW', title: 'Enjoy your experience', copy: 'You are checked in and your table journey is in progress.', icon: 'restaurant-outline' as const }
            : { eyebrow: 'ONE LAST STEP', title: 'How was your visit?', copy: 'Share a review and help other diners choose.', icon: 'star-outline' as const }
    : null;

  const handleProtectedAction = (targetRoute: string) => {
    if (!user) {
      router.push('/sign-in');
    } else {
      router.push(targetRoute as never);
    }
  };

  return (
    <Screen style={{ paddingHorizontal: 16 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="restaurant-outline" size={20} color={brand.green} />
            </View>
            <Text style={styles.brandName}>AgentDine</Text>
          </View>

          {!user ? (
            <View style={styles.authButtons}>
              <Pressable style={styles.signInBtn} onPress={() => router.push('/sign-in')}>
                <Text style={styles.signInText}>Sign In</Text>
              </Pressable>
              <Pressable style={styles.getStartedBtn} onPress={() => router.push('/sign-in')}>
                <Text style={styles.getStartedText}>Get Started</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.userBadge} onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.userInitial}>{user.email?.[0].toUpperCase() || 'U'}</Text>
            </Pressable>
          )}
        </View>

        {/* Greeting Pill */}
        <View style={styles.greetingPill}>
          <Ionicons name="sunny-outline" size={16} color={brand.coral} />
          <View>
            <Text style={styles.greetingTitle}>{greeting}</Text>
            <Text style={styles.greetingSubtitle}>Ready to find your table?</Text>
          </View>
        </View>

        {nextBooking && bookingAction && (
          <Pressable style={styles.bookingCard} onPress={() => router.push('/(tabs)/reservations')}>
            <View style={styles.bookingAccent} />
            <View style={styles.bookingTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingEyebrow}>YOUR NEXT BOOKING</Text>
                <Text style={styles.bookingRestaurant}>{nextBooking.restaurant.name}</Text>
                <Text style={styles.bookingMeta}>
                  {nextBooking.date.slice(0, 10)} · {nextBooking.time} · {nextBooking.partySize} guests
                </Text>
              </View>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            <View style={styles.nextActionPanel}>
              <View style={styles.nextActionIcon}>
                <Ionicons name={bookingAction.icon} size={19} color={brand.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextActionEyebrow}>{bookingAction.eyebrow}</Text>
                <Text style={styles.nextActionTitle}>{bookingAction.title}</Text>
                <Text style={styles.nextActionCopy}>{bookingAction.copy}</Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color="#FFFFFF" />
            </View>

            <BookingJourney reservation={nextBooking} compact />
          </Pressable>
        )}

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.tagBadge}>
            <Ionicons name="sparkles-outline" size={13} color={brand.green} />
            <Text style={styles.tagText}>Good food. Great company.</Text>
          </View>

          <Text style={styles.heroTitle}>Find your next favourite table.</Text>
          <Text style={styles.heroCopy}>
            Discover trusted restaurants, compare menus, check availability, and reserve a memorable table in minutes.
          </Text>

          <View style={styles.heroActions}>
            <Pressable
              style={styles.explorePrimaryBtn}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text style={styles.explorePrimaryText}>Explore restaurants</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={styles.findNearBtn}
              onPress={() => router.push({ pathname: '/(tabs)/explore', params: { nearby: '1' } })}
            >
              <Ionicons name="compass-outline" size={16} color={brand.ink} />
              <Text style={styles.findNearText}>Find near me</Text>
            </Pressable>
          </View>

          <View style={styles.bulletsRow}>
            <Text style={styles.bulletText}>✓ 20+ restaurants</Text>
            <Text style={styles.bulletText}>✓ Instant reservations</Text>
            <Text style={styles.bulletText}>✓ Verified reviews</Text>
          </View>
        </View>

        {/* Featured Tonight Card */}
        {featured && (
          <View style={styles.featuredCard}>
            <View style={styles.featuredImageContainer}>
              {featured.coverImageUrl || featured.imageUrls?.[0] ? (
                <Image
                  source={{ uri: featured.coverImageUrl || featured.imageUrls[0] }}
                  style={styles.featuredImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="restaurant" size={36} color={brand.green} />
                </View>
              )}
              <View style={styles.featuredBadge}>
                <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                <Text style={styles.featuredBadgeText}>FEATURED TONIGHT</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color={brand.gold} />
                <Text style={styles.ratingText}>
                  {featured.avgRating ? featured.avgRating.toFixed(1) : '4.7'}
                </Text>
              </View>
            </View>

            <View style={styles.featuredBody}>
              <Text style={styles.featuredCuisine}>
                {(featured.cuisineTypes || []).join(', ') || 'THAI'}
              </Text>
              <Text style={styles.featuredName}>{featured.name}</Text>
              <Text style={styles.featuredMeta}>
                📍 {featured.area} · {featured.priceRange} · {featured.totalReviews} reviews
              </Text>
              <Text style={styles.featuredDesc} numberOfLines={3}>
                {featured.description || 'Authentic flavours with curated dishes and warm ambience.'}
              </Text>

              <Pressable
                style={styles.viewVenueBtn}
                onPress={() => router.push(`/restaurant/${featured.id}` as never)}
              >
                <Text style={styles.viewVenueText}>View restaurant →</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Quick Actions List */}
        <Text style={styles.sectionHeading}>Make tonight easy</Text>
        <View style={styles.actionList}>
          <Pressable style={styles.actionCard} onPress={() => router.push('/(tabs)/explore')}>
            <View style={styles.actionIcon}>
              <Ionicons name="compass-outline" size={22} color={brand.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Explore</Text>
              <Text style={styles.actionDesc}>Browse menus and availability</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={brand.muted} />
          </Pressable>

          <Pressable style={styles.actionCard} onPress={() => handleProtectedAction('/(tabs)/chat')}>
            <View style={styles.actionIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={brand.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Ask AI Assistant</Text>
              <Text style={styles.actionDesc}>Personalized meal recommendations</Text>
            </View>
            {!user && <Text style={styles.lockBadge}>Login required</Text>}
            <Ionicons name="chevron-forward" size={18} color={brand.muted} />
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => handleProtectedAction('/(tabs)/reservations')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="calendar-outline" size={22} color={brand.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>My Bookings</Text>
              <Text style={styles.actionDesc}>Manage active table reservations</Text>
            </View>
            {!user && <Text style={styles.lockBadge}>Login required</Text>}
            <Ionicons name="chevron-forward" size={18} color={brand.muted} />
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
    marginBottom: 12,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontSize: 22, fontWeight: '800', color: brand.green, letterSpacing: -0.5 },
  authButtons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  signInBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  signInText: { color: brand.ink, fontWeight: '700', fontSize: 13 },
  getStartedBtn: { backgroundColor: brand.green, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  getStartedText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  userBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitial: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  greetingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  greetingTitle: { fontSize: 13, fontWeight: '700', color: brand.ink },
  greetingSubtitle: { fontSize: 11, color: brand.muted },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 24,
    padding: 15,
    gap: 12,
    overflow: 'hidden',
    marginBottom: 4,
    shadowColor: brand.greenDark,
    shadowOpacity: 0.11,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  bookingAccent: { position: 'absolute', left: 0, right: 0, top: 0, height: 4, backgroundColor: brand.gold },
  bookingTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 3 },
  bookingEyebrow: { color: brand.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  bookingRestaurant: { color: brand.ink, fontSize: 21, fontWeight: '800', marginTop: 4 },
  bookingMeta: { color: brand.muted, fontSize: 12, marginTop: 3 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: brand.mint, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: brand.green },
  liveText: { color: brand.green, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  nextActionPanel: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: brand.greenDark, borderRadius: 17, padding: 13 },
  nextActionIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.09)', alignItems: 'center', justifyContent: 'center' },
  nextActionEyebrow: { color: '#DCC08E', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  nextActionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginTop: 2 },
  nextActionCopy: { color: 'rgba(255,255,255,0.68)', fontSize: 11, lineHeight: 15, marginTop: 2 },
  heroSection: { gap: 10, marginBottom: 20 },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: brand.mint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    alignSelf: 'flex-start',
  },
  tagText: { color: brand.green, fontSize: 12, fontWeight: '700' },
  heroTitle: { fontSize: 34, fontWeight: '800', color: brand.ink, lineHeight: 40, letterSpacing: -1 },
  heroCopy: { fontSize: 15, color: brand.muted, lineHeight: 22 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  explorePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: brand.green,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  explorePrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  findNearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.border,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  findNearText: { color: brand.ink, fontWeight: '700', fontSize: 14 },
  bulletsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  bulletText: { fontSize: 12, color: brand.muted, fontWeight: '600' },
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  featuredImageContainer: { height: 160, width: '100%', position: 'relative' },
  featuredImage: { height: '100%', width: '100%' },
  imagePlaceholder: { height: '100%', backgroundColor: brand.mint, alignItems: 'center', justifyContent: 'center' },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(24, 35, 30, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: { fontSize: 12, fontWeight: '800', color: brand.ink },
  featuredBody: { padding: 16, gap: 6 },
  featuredCuisine: { fontSize: 11, fontWeight: '800', color: brand.coral, letterSpacing: 1 },
  featuredName: { fontSize: 20, fontWeight: '800', color: brand.ink },
  featuredMeta: { fontSize: 13, color: brand.muted },
  featuredDesc: { fontSize: 13, color: brand.muted, lineHeight: 19 },
  viewVenueBtn: { marginTop: 6, alignSelf: 'flex-start' },
  viewVenueText: { color: brand.green, fontWeight: '700', fontSize: 14 },
  sectionHeading: { fontSize: 20, fontWeight: '800', color: brand.ink, marginBottom: 12 },
  actionList: { gap: 10 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.border,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { fontSize: 16, fontWeight: '700', color: brand.ink },
  actionDesc: { fontSize: 12, color: brand.muted, marginTop: 1 },
  lockBadge: { fontSize: 10, fontWeight: '700', color: brand.coral, backgroundColor: '#F0E6D6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
});
