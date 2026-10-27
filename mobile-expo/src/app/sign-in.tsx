import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, GoogleAuthProvider, sendPasswordResetEmail, signInWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { brand } from '@/constants/brand';
import { api } from '@/lib/api';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const googleConfigured = Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.authentication?.idToken;
    if (!idToken) { Alert.alert('Google Sign In', 'Google did not return an ID token. Check the OAuth client configuration.'); return; }
    setLoading(true);
    signInWithCredential(auth, GoogleAuthProvider.credential(idToken))
      .then(async ({ user }) => {
        await api('/api/auth/register', { method: 'POST', body: { firebaseUid: user.uid, email: user.email ?? '', name: user.displayName ?? undefined } });
        router.replace('/(tabs)/explore');
      })
      .catch((error) => Alert.alert('Google Sign In Failed', error.message))
      .finally(() => setLoading(false));
  }, [response]);

  const submit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/explore');
        }
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        // New users go to onboarding to capture preferences
        router.replace('/onboarding');
      }
    } catch (e: any) {
      Alert.alert(mode === 'signin' ? 'Sign In Failed' : 'Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) { Alert.alert('Enter your email', 'Type the account email first, then tap Forgot password.'); return; }
    try { await sendPasswordResetEmail(auth, email.trim()); Alert.alert('Reset email sent', 'Check your inbox and follow the reset link.'); }
    catch (error: any) { Alert.alert('Could not send reset email', error.message); }
  };


  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Dark Banner */}
        <View style={styles.darkBanner}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="restaurant-outline" size={18} color={brand.green} />
            </View>
            <Text style={styles.brandTitle}>AgentDine</Text>
          </View>

          <View style={styles.tagChip}>
            <Ionicons name="sparkles-outline" size={12} color={brand.gold} />
            <Text style={styles.tagText}>Thoughtful dining, from search to seat</Text>
          </View>

          <Text style={styles.bannerHeading}>Your next table is closer than you think.</Text>

          <Text style={styles.bannerCopy}>
            Discover memorable restaurants, reserve in moments, and keep every plan in one calm place.
          </Text>

          <View style={styles.bulletsRow}>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={14} color={brand.coral} />
              <Text style={styles.bulletText}>Curated restaurants</Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={14} color={brand.coral} />
              <Text style={styles.bulletText}>Simple reservations</Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={14} color={brand.coral} />
              <Text style={styles.bulletText}>Personal favourites</Text>
            </View>
          </View>
        </View>

        {/* Form Container */}
        <View style={styles.formCard}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/explore'))}
            style={styles.backLink}
          >
            <Ionicons name="chevron-back" size={16} color={brand.muted} />
            <Text style={styles.backLinkText}>Back to home</Text>
          </Pressable>

          <Text style={styles.eyebrow}>
            {mode === 'signin' ? 'WELCOME BACK' : 'GET STARTED'}
          </Text>
          <Text style={styles.headingTitle}>
            {mode === 'signin' ? 'Good to see you again.' : 'Create your account.'}
          </Text>
          <Text style={styles.subtitleCopy}>
            {mode === 'signin'
              ? 'Sign in to manage reservations, saved restaurants, and your personalised recommendations.'
              : 'Create an account to save favorite restaurants and book tables in seconds.'}
          </Text>

          {/* Tab Segment Switcher */}
          <View style={styles.modeTabs}>
            <Pressable
              style={[styles.modeTabBtn, mode === 'signin' && styles.modeTabActive]}
              onPress={() => setMode('signin')}
            >
              <Text style={[styles.modeTabText, mode === 'signin' && styles.modeTabTextActive]}>
                Sign in
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeTabBtn, mode === 'signup' && styles.modeTabActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
                Create account
              </Text>
            </Pressable>
          </View>

          {/* Social Sign-In */}
          <Pressable
            style={styles.googleBtn}
            disabled={loading}
            onPress={() => {
              if (!googleConfigured) {
                Alert.alert('Google OAuth setup required', 'Add the Google OAuth client IDs to mobile-expo/.env, then restart Expo.');
                return;
              }
              if (!request) {
                Alert.alert('Google Sign In', 'Google Sign In is still loading. Please try again in a moment.');
                return;
              }
              promptAsync();
            }}
          >
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH EMAIL</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Input */}
          <Text style={styles.inputLabel}>Email address</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={brand.muted} />
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={brand.muted}
            />
          </View>

          {mode === 'signin' && <Pressable onPress={resetPassword} style={{ alignSelf: 'flex-end' }}><Text style={styles.forgotText}>Forgot password?</Text></Pressable>}

          {/* Password Input */}
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={brand.muted} />
            <TextInput
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={brand.muted}
            />
          </View>

          {/* Primary Action Button */}
          <Pressable style={styles.submitBtn} onPress={submit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: brand.cream },
  scrollContent: { paddingBottom: 32 },
  darkBanner: {
    backgroundColor: brand.green,
    padding: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 12,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: brand.mint, alignItems: 'center', justifyContent: 'center' },
  brandTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    alignSelf: 'flex-start',
  },
  tagText: { color: '#D4B57D', fontSize: 11, fontWeight: '600' },
  bannerHeading: { fontSize: 28, lineHeight: 34, color: '#FFFFFF', fontWeight: '800', letterSpacing: -0.6 },
  bannerCopy: { color: '#F1E7D8', fontSize: 14, lineHeight: 20 },
  bulletsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 4 },
  bulletItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bulletText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  formCard: { padding: 20, gap: 12 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  backLinkText: { color: brand.muted, fontSize: 13, fontWeight: '600' },
  eyebrow: { color: brand.coral, fontWeight: '800', fontSize: 11, letterSpacing: 1.2 },
  headingTitle: { fontSize: 26, fontWeight: '800', color: brand.ink, letterSpacing: -0.6 },
  subtitleCopy: { color: brand.muted, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(24, 35, 30, 0.05)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 8,
  },
  modeTabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  modeTabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  modeTabText: { fontWeight: '600', color: brand.muted, fontSize: 13 },
  modeTabTextActive: { color: brand.ink, fontWeight: '700' },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.border,
    paddingVertical: 12,
    borderRadius: 14,
  },
  googleBtnText: { color: brand.ink, fontWeight: '700', fontSize: 14 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: brand.border },
  dividerText: { fontSize: 10, fontWeight: '800', color: brand.muted, letterSpacing: 1 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: brand.ink, marginTop: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: { flex: 1, fontSize: 15, color: brand.ink },
  submitBtn: {
    backgroundColor: brand.green,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  forgotText: { color: brand.green, fontWeight: '700', fontSize: 12 },
});
