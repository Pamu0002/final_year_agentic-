import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/screen';
import { brand } from '@/constants/brand';
import { api } from '@/lib/api';
import { Restaurant } from '@/types/mobile-types';

import { useAuth } from '@/lib/auth';

type RestaurantListResponse = { data: Restaurant[]; total: number; page: number; limit: number };

const CUISINE_FILTERS = ['All', 'Sri Lankan', 'Japanese', 'Indian', 'Italian', 'Fine Dining', 'Cafe'];

const PRICE_MAP: Record<string, string> = {
  BUDGET: '$',
  MODERATE: '$$',
  EXPENSIVE: '$$$',
  FINE_DINING: '$$$$',
};

export default function ExploreScreen() {
  const { user } = useAuth();
  const { nearby } = useLocalSearchParams<{ nearby?: string }>();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCuisines, setUserCuisines] = useState<string[]>([]);
  const [nearbyActive, setNearbyActive] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const handledNearbyParam = useRef(false);
  const requestSequence = useRef(0);

  useEffect(() => {
    if (!user) { setUserCuisines([]); return; }
    api<{ cuisines?: string[] }>('/api/users/me/preferences').then((prefs) => setUserCuisines(prefs.cuisines ?? [])).catch(() => undefined);
  }, [user]);

  const getMatchScore = (r: Restaurant) => {
    if (!userCuisines.length) return 0;
    return (r.cuisineTypes || []).filter((c) =>
      userCuisines.some((p: string) => p.toLowerCase() === c.toLowerCase())
    ).length;
  };

  const loadRestaurants = useCallback(async (coords?: { latitude: number; longitude: number }) => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: '50' });
    if (coords) {
      params.set('lat', String(coords.latitude));
      params.set('lng', String(coords.longitude));
      params.set('radiusKm', '25');
    }
    try {
      const result = await api<RestaurantListResponse>(`/api/restaurants?${params.toString()}`);
      if (requestId === requestSequence.current) setRestaurants(result.data);
    } catch {
      if (requestId === requestSequence.current) setError('Could not reach backend server. Make sure server is running and check EXPO_PUBLIC_API_URL.');
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, []);

  const findNearby = useCallback(async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationError('Location permission is needed to find restaurants near you.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await loadRestaurants(position.coords);
      setNearbyActive(true);
    } catch {
      setLocationError('Your location could not be detected. Check location services and try again.');
    } finally {
      setLocating(false);
    }
  }, [loadRestaurants]);

  const clearNearby = useCallback(async () => {
    setNearbyActive(false);
    setLocationError(null);
    handledNearbyParam.current = false;
    router.setParams({ nearby: undefined });
    await loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    if (nearby !== '1') {
      handledNearbyParam.current = false;
      return;
    }
    if (handledNearbyParam.current) return;
    handledNearbyParam.current = true;
    findNearby();
  }, [findNearby, nearby]);

  const visible = restaurants
    .filter((r) => {
      const matchesSearch = `${r.name} ${(r.cuisineTypes || []).join(' ')} ${r.area} ${r.address}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesFilter =
        activeFilter === 'All' ||
        (r.cuisineTypes || []).some((c) => c.toLowerCase().includes(activeFilter.toLowerCase())) ||
        (activeFilter === 'Fine Dining' && r.priceRange === 'FINE_DINING');
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (nearbyActive) return (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
      const scoreA = getMatchScore(a);
      const scoreB = getMatchScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return (b.avgRating || 0) - (a.avgRating || 0);
    });

  return (
    <Screen style={{ paddingHorizontal: 16 }}>
      <Text style={styles.eyebrow}>DISCOVER & RESERVE</Text>
      <Text style={styles.title}>Where will you dine?</Text>

      {/* Search Input */}
      <View style={styles.search}>
        <Ionicons name="search-outline" size={20} color={brand.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search restaurant, cuisine, or area..."
          placeholderTextColor={brand.muted}
          style={styles.input}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={brand.muted} />
          </Pressable>
        )}
      </View>

      <Pressable
        style={[styles.nearbyButton, nearbyActive && styles.nearbyButtonActive]}
        onPress={nearbyActive ? clearNearby : findNearby}
        disabled={locating || loading}
      >
        {locating ? (
          <ActivityIndicator size="small" color={nearbyActive ? '#FFFFFF' : brand.green} />
        ) : (
          <Ionicons name={nearbyActive ? 'close-circle-outline' : 'navigate-outline'} size={18} color={nearbyActive ? '#FFFFFF' : brand.green} />
        )}
        <Text style={[styles.nearbyButtonText, nearbyActive && styles.nearbyButtonTextActive]}>
          {locating ? 'Finding your location…' : nearbyActive ? 'Clear nearby results' : 'Find restaurants near me'}
        </Text>
      </Pressable>

      {locationError && <Text style={styles.locationError}>{locationError}</Text>}
      {nearbyActive && !loading && (
        <Text style={styles.nearbySummary}>{visible.length} restaurant{visible.length === 1 ? '' : 's'} within 25 km, nearest first</Text>
      )}

      {/* Category Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filters}>
        {CUISINE_FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              style={[styles.filter, isActive && styles.activeFilter]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, isActive && styles.activeFilterText]}>{filter}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading && <ActivityIndicator color={brand.green} style={{ marginTop: 24 }} />}
      
      {error && (
        <View style={styles.error}>
          <Ionicons name="cloud-offline-outline" size={22} color={brand.coral} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && visible.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={42} color={brand.muted} />
          <Text style={styles.empty}>No restaurants found matching your criteria.</Text>
        </View>
      )}

      <View style={styles.list}>
        {visible.map((restaurant) => {
          const cover = restaurant.coverImageUrl || (restaurant.imageUrls && restaurant.imageUrls[0]);
          return (
            <Pressable
              key={restaurant.id}
              style={styles.card}
              onPress={() => router.push(`/restaurant/${restaurant.id}` as never)}
            >
              {cover ? (
                <Image source={{ uri: cover }} style={styles.cardImage} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="restaurant" size={32} color={brand.green} />
                </View>
              )}

              <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.name}>{restaurant.name}</Text>
                    {restaurant.isVerified && (
                      <Ionicons name="checkmark-circle" size={17} color={brand.green} />
                    )}
                  </View>
                  <Text style={styles.rating}>
                    ★ {restaurant.avgRating ? restaurant.avgRating.toFixed(1) : 'New'}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    {(restaurant.cuisineTypes || []).join(', ') || 'Dining'} · {restaurant.area}
                  </Text>
                  <Text style={styles.priceTag}>
                    {PRICE_MAP[restaurant.priceRange] || restaurant.priceRange}
                  </Text>
                </View>

                {restaurant.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {restaurant.description}
                  </Text>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.link}>View menu & book table →</Text>
                  {nearbyActive && restaurant.distanceKm != null ? (
                    <Text style={styles.distanceBadge}>{restaurant.distanceKm.toFixed(1)} km away</Text>
                  ) : restaurant.reservationDeposit > 0 && (
                    <Text style={styles.depositBadge}>Deposit LKR {restaurant.reservationDeposit}</Text>
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: brand.coral, fontWeight: '800', letterSpacing: 1.4, fontSize: 12 },
  title: { fontSize: 28, color: brand.ink, fontWeight: '700', letterSpacing: -0.8, marginBottom: 12 },
  search: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 15,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },
  input: { flex: 1, height: 48, fontSize: 15, color: brand.ink },
  nearbyButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: brand.green, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 8 },
  nearbyButtonActive: { backgroundColor: brand.green },
  nearbyButtonText: { color: brand.green, fontWeight: '700', fontSize: 13 },
  nearbyButtonTextActive: { color: '#FFFFFF' },
  locationError: { color: '#B42318', backgroundColor: '#FDECEC', borderRadius: 10, padding: 10, fontSize: 12, lineHeight: 17 },
  nearbySummary: { color: brand.muted, fontSize: 12, fontWeight: '600' },
  filterScroll: { marginBottom: 16, maxHeight: 42 },
  filters: { flexDirection: 'row', gap: 8, paddingRight: 16 },
  filter: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: '#FFFFFF',
  },
  activeFilter: { backgroundColor: brand.green, borderColor: brand.green },
  filterText: { color: brand.ink, fontWeight: '600', fontSize: 13 },
  activeFilterText: { color: '#FFFFFF' },
  list: { gap: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: brand.border,
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardImage: { height: 140, width: '100%' },
  imagePlaceholder: { height: 100, backgroundColor: brand.mint, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 15, gap: 6 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 18, fontWeight: '700', color: brand.ink },
  rating: { color: brand.green, fontWeight: '700', fontSize: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { color: brand.muted, fontSize: 13, flex: 1 },
  priceTag: { color: brand.ink, fontWeight: '700', fontSize: 13 },
  description: { color: brand.muted, fontSize: 13, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  link: { color: brand.green, fontWeight: '700', fontSize: 13 },
  depositBadge: { fontSize: 11, color: brand.coral, fontWeight: '600', backgroundColor: '#F0E6D6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  distanceBadge: { fontSize: 11, color: brand.green, fontWeight: '700', backgroundColor: brand.mint, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  error: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#F0E6D6', padding: 14, borderRadius: 14 },
  errorText: { color: brand.ink, flex: 1, lineHeight: 19, fontSize: 13 },
  emptyContainer: { alignItems: 'center', gap: 10, marginTop: 32 },
  empty: { color: brand.muted, textAlign: 'center' },
});
