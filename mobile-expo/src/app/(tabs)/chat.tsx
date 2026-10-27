import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Screen } from '@/components/screen';
import { brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { DiningPreferences } from '@/types/mobile-types';

type Message = {
  id: number;
  from: 'user' | 'assistant';
  text: string;
  recommendations?: { id?: string; restaurantId?: string; name: string; area: string; cuisine?: string }[];
};

const paymentUrlFrom = (text: string) => text.match(/Payment link:\s*(https?:\/\/\S+)/i)?.[1] ?? text.match(/https:\/\/checkout\.stripe\.com\/\S+/)?.[0];

const SUGGESTIONS = [
  'Romantic dinner spots in Colombo',
  'Best vegetarian restaurants nearby',
  'Family dining under LKR 3000',
  'Where to get fresh seafood tonight?',
];

export default function ChatScreen() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      from: 'assistant',
      text: "Hello! I'm your AgentDine AI assistant. What are you craving today, or what occasion are you planning for?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Crypto.randomUUID());
  const [savedPreferences, setSavedPreferences] = useState<Partial<DiningPreferences>>({});

  useEffect(() => {
    if (!user) { setSavedPreferences({}); return; }
    api<Partial<DiningPreferences>>('/api/users/me/preferences').then(setSavedPreferences).catch(() => undefined);
  }, [user]);

  const userPrefs = savedPreferences;
  const userCuisines: string[] = userPrefs?.cuisines || [];
  const userDietary: string[] = userPrefs?.dietaryRestrictions || [];
  const userBudget: string | undefined = userPrefs?.budgetPreference;

  const dynamicSuggestions = (() => {
    const list: string[] = [];
    if (userCuisines.length > 0) {
      list.push(`Top ${userCuisines.slice(0, 2).join(' & ')} spots`);
    } else {
      list.push('Romantic dinner spots in Colombo');
    }

    if (userDietary.length > 0) {
      list.push(`${userDietary.join(', ')} friendly dining`);
    } else {
      list.push('Best vegetarian restaurants nearby');
    }

    if (userBudget) {
      const budgetStr =
        userBudget === 'BUDGET'
          ? 'budget-friendly'
          : userBudget === 'FINE_DINING'
          ? 'fine dining'
          : userBudget.toLowerCase();
      list.push(`Best ${budgetStr} places`);
    } else {
      list.push('Family dining under LKR 3000');
    }

    list.push('Where to get fresh seafood tonight?');
    return list;
  })();

  const send = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text) return;

    const history = messages.map((message) => ({ role: message.from, content: message.text }));
    setMessages((current) => [...current, { id: Date.now(), from: 'user', text }]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const response = await api<{ message: string; data?: unknown; guest_limit_reached?: boolean }>(user ? '/api/chat/message' : '/api/chat/guest', {
        method: 'POST',
        body: { message: text, sessionId, history },
      });

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          from: 'assistant',
          text: response.message || "Here's what I found for you!",
          recommendations: Array.isArray(response.data) ? response.data : undefined,
        },
      ]);
      if (response.guest_limit_reached) {
        setMessages((current) => [...current, { id: Date.now() + 2, from: 'assistant', text: 'Sign in to keep chatting and save your dining history.' }]);
      }
    } catch (err: any) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          from: 'assistant',
          text: 'Sorry, I ran into an error connecting to the AI dining engine. ' + (err.message || ''),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ flex: 1, paddingHorizontal: 16 }}>
      {/* Header */}
      <View style={styles.heading}>
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>AI Dining Assistant</Text>
          <Text style={styles.subtitle}>{user ? 'Personalized suggestions with saved history' : 'Guest mode · 3 free messages'}</Text>
        </View>
        {user && <Pressable onPress={() => router.push('/chat-history')}><Ionicons name="time-outline" size={23} color={brand.green}/></Pressable>}
      </View>

      {/* Connection Notice */}
      <View style={styles.notice}>
        <Ionicons name="checkmark-circle-outline" size={16} color={brand.green} />
        <Text style={styles.noticeText}>{user ? 'AI Concierge: Active & saving this chat' : 'Try AI without an account'}</Text>
      </View>

      {!user && <Pressable style={styles.guestBanner} onPress={() => router.push('/sign-in')}><Text style={styles.guestText}>Sign in for unlimited chat and personalised recommendations →</Text></Pressable>}

      {/* Suggestion Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.suggestionScroll}
        contentContainerStyle={styles.suggestionContainer}
      >
        {dynamicSuggestions.map((suggestion) => (
          <Pressable
            key={suggestion}
            style={styles.suggestionChip}
            onPress={() => send(suggestion)}
            disabled={loading}
          >
            <Ionicons name="compass-outline" size={14} color={brand.green} />
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Messages List */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[styles.bubble, message.from === 'user' ? styles.userBubble : styles.aiBubble]}
          >
            <Text style={[styles.bubbleText, message.from === 'user' && styles.userText]}>
              {message.text}
            </Text>

            {message.from === 'assistant' && paymentUrlFrom(message.text) && (
              <Pressable style={styles.paymentAction} onPress={() => WebBrowser.openBrowserAsync(paymentUrlFrom(message.text)!)}>
                <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                <Text style={styles.paymentActionText}>Open secure payment</Text>
              </Pressable>
            )}

            {message.recommendations && message.recommendations.length > 0 && (
              <View style={styles.recsContainer}>
                {message.recommendations.map((rec) => (
                  <Pressable
                    key={rec.id ?? rec.restaurantId}
                    style={styles.recCard}
                    onPress={() => router.push(`/restaurant/${rec.id ?? rec.restaurantId}` as never)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recName}>{rec.name}</Text>
                      <Text style={styles.recArea}>{rec.area}</Text>
                    </View>
                    <Text style={styles.recAction}>Book →</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.aiBubble, { flexDirection: 'row', gap: 8, alignItems: 'center' }]}>
            <ActivityIndicator size="small" color={brand.green} />
            <Text style={styles.bubbleText}>Finding top recommendations...</Text>
          </View>
        )}
      </ScrollView>

      {/* Composer */}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send()}
          placeholder="Ask about restaurants, menus, or tables..."
          placeholderTextColor={brand.muted}
          editable={!loading}
        />
        <Pressable style={styles.send} onPress={() => send()} disabled={loading || !input.trim()}>
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 8 },
  aiIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', backgroundColor: brand.green },
  title: { fontSize: 20, fontWeight: '700', color: brand.ink },
  subtitle: { fontSize: 13, color: brand.muted, marginTop: 1 },
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
  notice: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    backgroundColor: brand.mint,
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeText: { color: brand.green, fontSize: 12, fontWeight: '600' },
  guestBanner: { backgroundColor: brand.greenDark, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 11, marginBottom: 8 },
  guestText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  suggestionScroll: { maxHeight: 38, marginBottom: 8 },
  suggestionContainer: { gap: 8, paddingRight: 16 },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
  },
  suggestionText: { color: brand.ink, fontSize: 12, fontWeight: '600' },
  messagesContainer: { flex: 1 },
  messages: { gap: 12, paddingBottom: 16 },
  bubble: { padding: 14, borderRadius: 18, maxWidth: '88%' },
  aiBubble: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: brand.border, alignSelf: 'flex-start' },
  userBubble: { backgroundColor: brand.green, alignSelf: 'flex-end' },
  bubbleText: { fontSize: 15, lineHeight: 22, color: brand.ink },
  userText: { color: '#FFFFFF' },
  recsContainer: { marginTop: 10, gap: 6 },
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.cream,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.border,
  },
  recName: { fontWeight: '700', color: brand.ink, fontSize: 13 },
  recArea: { color: brand.muted, fontSize: 11 },
  recAction: { color: brand.green, fontWeight: '700', fontSize: 12 },
  paymentAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: brand.green, borderRadius: 11, paddingVertical: 10, marginTop: 10 },
  paymentActionText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  composer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.border,
    padding: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  input: { flex: 1, height: 42, paddingHorizontal: 10, fontSize: 14, color: brand.ink },
  send: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.green },
});
