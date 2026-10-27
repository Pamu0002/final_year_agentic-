import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/screen';
import { brand } from '@/constants/brand';
import { api } from '@/lib/api';
import { Restaurant } from '@/types/mobile-types';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ restaurant: Restaurant }[]>('/api/users/me/favorites')
      .then((data) => setFavorites(data.map((favorite) => favorite.restaurant)))
      .catch((err) => setError(err.message || 'Could not fetch saved favorites.'))
      .finally(() => setLoading(false));
  }, []);

  const removeFavorite = async (restaurantId: string) => {
    setFavorites((current) => current.filter((r) => r.id !== restaurantId));
    try {
      await api(`/api/users/me/favorites/${restaurantId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Failed to remove favorite');
    }
  };

  return (
    <Screen style={{ paddingHorizontal: 16 }}>
      {/* Header */}
      <View style={styles.navHeader}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={brand.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Saved Restaurants</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={brand.green} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={48} color={brand.coral} />
          <Text style={styles.emptyTitle}>No saved restaurants</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any restaurant to save it to your list.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {favorites.map((restaurant) => {
            const cover = restaurant.coverImageUrl || (restaurant.imageUrls && restaurant.imageUrls[0]);
            return (
              <View key={restaurant.id} style={styles.card}>
                {cover ? (
                  <Image source={{ uri: cover }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="restaurant" size={28} color={brand.green} />
                  </View>
                )}

                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.name}>{restaurant.name}</Text>
                    <Pressable onPress={() => removeFavorite(restaurant.id)}>
                      <Ionicons name="heart" size={20} color={brand.coral} />
                    </Pressable>
                  </View>

                  <Text style={styles.meta}>
                    {restaurant.area} · {(restaurant.cuisineTypes || []).join(', ') || 'Restaurant'}
                  </Text>

                  <Pressable
                    style={styles.viewBtn}
                    onPress={() => router.push(`/restaurant/${restaurant.id}` as never)}
                  >
                    <Text style={styles.viewBtnText}>View Venue & Reserve →</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingVertical: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: brand.ink },
  list: { gap: 14, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: 'hidden',
  },
  cardImage: { height: 120, width: '100%' },
  imagePlaceholder: { height: 80, backgroundColor: brand.mint, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 14, gap: 4 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '700', color: brand.ink, flex: 1 },
  meta: { color: brand.muted, fontSize: 13 },
  viewBtn: { marginTop: 8 },
  viewBtnText: { color: brand.green, fontWeight: '700', fontSize: 13 },
  errorCard: { padding: 16, backgroundColor: '#F0E6D6', borderRadius: 12, marginTop: 20 },
  errorText: { color: brand.ink },
  emptyContainer: { alignItems: 'center', gap: 10, marginTop: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: brand.ink },
  emptySubtitle: { color: brand.muted, textAlign: 'center', lineHeight: 20 },
});
