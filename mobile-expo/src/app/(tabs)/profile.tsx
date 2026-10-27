import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/screen';
import { brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';

type LoyaltyInfo = {
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
};

export default function ProfileScreen() {
  const { user } = useAuth();
  const [loyalty, setLoyalty] = useState<LoyaltyInfo>({ points: 0, tier: 'BRONZE' });
  const [profile, setProfile] = useState<{ name?: string | null; email?: string; avatarUrl?: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      api<LoyaltyInfo>('/api/users/me/loyalty')
        .then((data) => setLoyalty(data))
        .catch(() => {});
      api<{ name?: string | null; email?: string; avatarUrl?: string | null }>('/api/users/me').then(setProfile).catch(() => undefined);
    }
  }, [user]);

  const rows = [
    {
      icon: 'heart-outline' as const,
      label: 'Saved restaurants',
      route: '/favorites',
    },
    {
      icon: 'card-outline' as const,
      label: 'Payment history',
      route: '/payments',
    },
    {
      icon: 'calendar-outline' as const,
      label: 'My Reservations',
      route: '/(tabs)/reservations',
    },
    { icon: 'options-outline' as const, label: 'Dining preferences', route: '/preferences' },
    { icon: 'people-outline' as const, label: 'My waitlists', route: '/waitlists' },
    { icon: 'trophy-outline' as const, label: 'Loyalty history', route: '/loyalty' },
    { icon: 'notifications-outline' as const, label: 'Notifications', route: '/notifications' },
    { icon: 'megaphone-outline' as const, label: 'Offers & promotions', route: '/promotions' },
    { icon: 'alert-circle-outline' as const, label: 'Complaints & support', route: '/complaints' },
    { icon: 'chatbubbles-outline' as const, label: 'AI chat history', route: '/chat-history' },
    { icon: 'create-outline' as const, label: 'Edit profile', route: '/edit-profile' },
  ];

  return (
    <Screen style={{ paddingHorizontal: 16 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Profile Card */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            {profile?.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{(profile?.name || user?.email || 'A')[0].toUpperCase()}</Text>}
          </View>
          <Text style={styles.name}>{user ? (profile?.name || user.email) : 'Welcome to AgentDine'}</Text>
          <Text style={styles.email}>
            {user ? 'Signed in with Firebase' : 'Sign in to sync your bookings and preferences'}
          </Text>

          {/* Loyalty Banner */}
          {user && (
            <View style={styles.loyaltyCard}>
              <View style={styles.loyaltyRow}>
                <Ionicons name="trophy" size={20} color={brand.gold} />
                <Text style={styles.loyaltyTitle}>AgentDine Rewards</Text>
              </View>
              <View style={styles.loyaltyRow}>
                <Text style={styles.loyaltyPoints}>{loyalty.points} Points</Text>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierText}>{loyalty.tier}</Text>
                </View>
              </View>
            </View>
          )}

          {!user ? (
            <Pressable style={styles.button} onPress={() => router.push('/sign-in')}>
              <Text style={styles.buttonText}>Sign in or create account</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.buttonOut} onPress={() => auth.signOut()}>
              <Text style={styles.buttonTextOut}>Sign out</Text>
            </Pressable>
          )}
        </View>

        {/* Menu Options List */}
        <View style={styles.list}>
          {rows.map((row) => (
            <Pressable key={row.label} style={styles.row} onPress={() => router.push(row.route as never)}>
              <Ionicons name={row.icon} size={21} color={brand.green} />
              <Text style={styles.rowText}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={19} color={brand.muted} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.footer}>AgentDine Mobile · Parity Release 2.0</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { padding: 24, alignItems: 'center', backgroundColor: brand.mint, borderRadius: 24, gap: 8 },
  avatar: { height: 66, width: 66, borderRadius: 33, backgroundColor: brand.green, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 27, fontWeight: '700' },
  avatarImage: { width: 66, height: 66, borderRadius: 33 },
  name: { fontSize: 20, color: brand.ink, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  email: { color: brand.muted, textAlign: 'center', fontSize: 13 },
  loyaltyCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: brand.border,
  },
  loyaltyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loyaltyTitle: { fontSize: 14, fontWeight: '700', color: brand.ink },
  loyaltyPoints: { fontSize: 18, fontWeight: '800', color: brand.green },
  tierBadge: { backgroundColor: '#F0E6D6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tierText: { fontSize: 11, fontWeight: '800', color: brand.gold },
  button: { marginTop: 10, backgroundColor: brand.green, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 13 },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  buttonOut: { marginTop: 10, backgroundColor: 'transparent', borderWidth: 1, borderColor: brand.green, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 13 },
  buttonTextOut: { color: brand.green, fontWeight: '700' },
  list: { backgroundColor: '#FFFFFF', borderRadius: 19, borderWidth: 1, borderColor: brand.border, overflow: 'hidden', marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16, borderBottomWidth: 1, borderBottomColor: brand.border },
  rowText: { color: brand.ink, fontWeight: '600', fontSize: 16, flex: 1 },
  footer: { color: brand.muted, textAlign: 'center', fontSize: 12, marginTop: 16 },
});
