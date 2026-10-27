import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/screen';
import { PageHeader } from '@/components/page-header';
import { brand } from '@/constants/brand';
import { api } from '@/lib/api';

type Session = {
  id: string;
  title?: string | null;
  messages: { role: 'user' | 'assistant'; content: string }[];
  updatedAt: string;
};

export default function ChatHistoryScreen() {
  const [items, setItems] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Session[]>('/api/chat/history').then(setItems).finally(() => setLoading(false));
  }, []);

  const openSession = (session: Session) => {
    router.replace({ pathname: '/(tabs)/chat', params: { sessionId: session.id } });
  };

  const remove = async (event: GestureResponderEvent, id: string) => {
    event.stopPropagation();
    try {
      await api(`/api/chat/session/${id}`, { method: 'DELETE' });
      setItems((all) => all.filter((item) => item.id !== id));
    } catch (error: any) {
      Alert.alert('Could not delete', error.message);
    }
  };

  return (
    <Screen>
      <PageHeader title="AI chat history" subtitle="Tap a conversation to reopen and continue it" />
      {loading ? (
        <ActivityIndicator color={brand.green} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>No saved conversations yet.</Text>
      ) : (
        items.map((session) => (
          <Pressable key={session.id} style={styles.card} onPress={() => openSession(session)}>
            <View style={styles.icon}><Ionicons name="sparkles" size={18} color={brand.green} /></View>
            <View style={styles.content}>
              <Text style={styles.title}>{session.title || 'Dining conversation'}</Text>
              <Text numberOfLines={2} style={styles.preview}>{session.messages.at(-1)?.content}</Text>
              <Text style={styles.date}>{new Date(session.updatedAt).toLocaleString()}</Text>
            </View>
            <View style={styles.actions}>
              <Ionicons name="chevron-forward" size={18} color={brand.green} />
              <Pressable style={styles.deleteButton} onPress={(event) => remove(event, session.id)} accessibilityLabel="Delete conversation">
                <Ionicons name="trash-outline" size={18} color="#B42318" />
              </Pressable>
            </View>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: brand.border, borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 38, height: 38, borderRadius: 13, backgroundColor: brand.mint, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  actions: { alignItems: 'center', gap: 7 },
  deleteButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#FDECEC' },
  title: { color: brand.ink, fontWeight: '800' },
  preview: { color: brand.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  date: { color: brand.muted, fontSize: 10, marginTop: 5 },
  empty: { color: brand.muted, textAlign: 'center', padding: 30 },
});
