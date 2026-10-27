import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/screen';
import { brand } from '@/constants/brand';
import { api } from '@/lib/api';

type PaymentRecord = {
  id: string;
  amount: number;
  status: string;
  type: string;
  createdAt: string;
  description?: string;
};

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<PaymentRecord[]>('/api/payments/history')
      .then((data) => setPayments(data))
      .catch((err) => setError(err.message || 'Could not fetch payment history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Screen style={{ paddingHorizontal: 16 }}>
      <View style={styles.navHeader}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={brand.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment History</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={brand.green} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={48} color={brand.green} />
          <Text style={styles.emptyTitle}>No transaction history</Text>
          <Text style={styles.emptySubtitle}>
            Your reservation deposits and payment receipts will be listed here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {payments.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.iconContainer}>
                <Ionicons name="receipt-outline" size={22} color={brand.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.description}>{p.description || 'Reservation Deposit'}</Text>
                <Text style={styles.date}>
                  {new Date(p.createdAt).toLocaleDateString()} · {p.status}
                </Text>
              </View>
              <Text style={styles.amount}>LKR {p.amount.toLocaleString()}</Text>
            </View>
          ))}
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
  list: { gap: 10, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 14,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: { fontWeight: '700', color: brand.ink, fontSize: 15 },
  date: { color: brand.muted, fontSize: 12, marginTop: 2 },
  amount: { fontWeight: '800', color: brand.green, fontSize: 15 },
  errorCard: { padding: 16, backgroundColor: '#F0E6D6', borderRadius: 12, marginTop: 20 },
  errorText: { color: brand.ink },
  emptyContainer: { alignItems: 'center', gap: 10, marginTop: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: brand.ink },
  emptySubtitle: { color: brand.muted, textAlign: 'center', lineHeight: 20 },
});
