import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userCuisines: string[] = (user as any)?.diningPreferences?.cuisines || [];

  const getMatchScore = (r: Restaurant) => {
    if (!userCuisines.length) return 0;
    return (r.cuisineTypes || []).filter((c) =>
      userCuisines.some((p: string) => p.toLowerCase() === c.toLowerCase())
    ).length;
  };

  useEffect(() => {
    setLoading(true);
    api<RestaurantListResponse>('/api/restaurants?limit=50')
      .then((result) => setRestaurants(result.data))
      .catch(() => setError('Could not reach backend server. Make sure server is running and check EXPO_PUBLIC_API_URL.'))
      .finally(() => setLoading(false));
  }, []);

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
                  {restaurant.reservationDeposit > 0 && (
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
  error: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#F0E6D6', padding: 14, borderRadius: 14 },
  errorText: { color: brand.ink, flex: 1, lineHeight: 19, fontSize: 13 },
  emptyContainer: { alignItems: 'center', gap: 10, marginTop: 32 },
  empty: { color: brand.muted, textAlign: 'center' },
});
