import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';
import { brand } from '@/constants/brand';

const TOTAL_STEPS = 4;

// ─── Data ──────────────────────────────────────────────────────────────────────

const CUISINES = [
  { label: '🍛 Sri Lankan', value: 'Sri Lankan' },
  { label: '🍕 Italian', value: 'Italian' },
  { label: '🍣 Japanese', value: 'Japanese' },
  { label: '🥢 Chinese', value: 'Chinese' },
  { label: '🫓 Indian', value: 'Indian' },
  { label: '🦞 Seafood', value: 'Seafood' },
  { label: '🍔 Burgers', value: 'Burgers' },
  { label: '🌿 Vegan', value: 'Vegan' },
  { label: '🍖 BBQ', value: 'BBQ' },
  { label: '🥗 Mediterranean', value: 'Mediterranean' },
  { label: '🌮 Mexican', value: 'Mexican' },
  { label: '☕ Café', value: 'Café' },
];

const DIETARY = [
  { label: '🥦 Vegetarian', value: 'Vegetarian' },
  { label: '🌱 Vegan', value: 'Vegan' },
  { label: '☪️ Halal', value: 'Halal' },
  { label: '🌾 Gluten-Free', value: 'Gluten-Free' },
  { label: '🥛 Dairy-Free', value: 'Dairy-Free' },
  { label: '🐟 Pescatarian', value: 'Pescatarian' },
  { label: '✅ No Restrictions', value: 'None' },
];

const BUDGETS = [
  { label: '💵 Budget-friendly', value: 'BUDGET', sub: 'Under LKR 1,000' },
  { label: '💳 Moderate', value: 'MODERATE', sub: 'LKR 1,000–3,000' },
  { label: '✨ Upscale', value: 'EXPENSIVE', sub: 'LKR 3,000–6,000' },
  { label: '👑 Fine Dining', value: 'FINE_DINING', sub: 'LKR 6,000+' },
];

const OCCASIONS = [
  { label: '💑 Romantic Date', value: 'romantic' },
  { label: '👨‍👩‍👧 Family Dinner', value: 'family' },
  { label: '💼 Business Lunch', value: 'business' },
  { label: '🍻 Casual Hangout', value: 'casual' },
  { label: '🎂 Birthday Celebration', value: 'birthday' },
  { label: '🎓 Graduation', value: 'graduation' },
  { label: '🌅 Weekend Brunch', value: 'brunch' },
];

const STEPS = [
  {
    title: 'What cuisines do you love?',
    subtitle: "Pick as many as you like — we'll personalise your recommendations.",
    icon: 'restaurant-outline' as const,
  },
  {
    title: 'Any dietary preferences?',
    subtitle: "We'll make sure every suggestion suits your needs.",
    icon: 'leaf-outline' as const,
  },
  {
    title: "What's your usual budget?",
    subtitle: 'This helps us suggest the right places for you.',
    icon: 'wallet-outline' as const,
  },
  {
    title: 'What occasions do you dine for?',
    subtitle: "We'll tailor our picks to your lifestyle.",
    icon: 'calendar-outline' as const,
  },
];

// ─── Chip Component ────────────────────────────────────────────────────────────

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
      {selected && (
        <Ionicons name="checkmark-circle" size={14} color="#fff" style={{ marginLeft: 4 }} />
      )}
    </Pressable>
  );
}

// ─── Budget Card ───────────────────────────────────────────────────────────────

function BudgetCard({
  label,
  sub,
  selected,
  onPress,
}: {
  label: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.budgetCard, selected && styles.budgetCardSelected]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.budgetLabel, selected && styles.budgetLabelSelected]}>{label}</Text>
        <Text style={[styles.budgetSub, selected && styles.budgetSubSelected]}>{sub}</Text>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={22} color={brand.green} />}
    </Pressable>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = (nextStep: number) => {
    Animated.spring(progressAnim, {
      toValue: nextStep / TOTAL_STEPS,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  };

  const goNext = () => {
    const next = step + 1;
    if (next < TOTAL_STEPS) {
      setStep(next);
      animateProgress(next);
    }
  };

  const goBack = () => {
    if (step > 0) {
      const prev = step - 1;
      setStep(prev);
      animateProgress(prev);
    }
  };

  const toggle = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const skip = () => {
    router.replace('/(tabs)/explore');
  };

  const finish = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      await api('/api/auth/register', {
        method: 'POST',
        body: {
          firebaseUid: user.uid,
          email: user.email ?? '',
          cuisines: selectedCuisines,
          dietaryRestrictions: selectedDietary.filter((d) => d !== 'None'),
          budgetPreference: selectedBudget || undefined,
          occasions: selectedOccasions,
        },
      });
    } catch (err: any) {
      // Non-fatal — user already registered via Firebase; AI will ask prefs in chat if this fails
      console.warn('Onboarding save failed (non-fatal):', err?.message);
    } finally {
      setSaving(false);
      router.replace('/(tabs)/explore');
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const current = STEPS[step];

  return (
    <SafeAreaView style={styles.page}>
      {/* ── Progress Bar ── */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* ── Header ── */}
      <View style={styles.header}>
        {step > 0 ? (
          <Pressable onPress={goBack} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={brand.ink} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
        <Text style={styles.stepLabel}>
          {step + 1} of {TOTAL_STEPS}
        </Text>
        <Pressable onPress={skip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* ── Step Content ── */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconBadge}>
          <Ionicons name={current.icon} size={28} color={brand.green} />
        </View>

        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>

        {/* Step 0 — Cuisines */}
        {step === 0 && (
          <View style={styles.chipWrap}>
            {CUISINES.map((c) => (
              <Chip
                key={c.value}
                label={c.label}
                selected={selectedCuisines.includes(c.value)}
                onPress={() => toggle(c.value, selectedCuisines, setSelectedCuisines)}
              />
            ))}
          </View>
        )}

        {/* Step 1 — Dietary */}
        {step === 1 && (
          <View style={styles.chipWrap}>
            {DIETARY.map((d) => (
              <Chip
                key={d.value}
                label={d.label}
                selected={selectedDietary.includes(d.value)}
                onPress={() => toggle(d.value, selectedDietary, setSelectedDietary)}
              />
            ))}
          </View>
        )}

        {/* Step 2 — Budget */}
        {step === 2 && (
          <View style={styles.budgetList}>
            {BUDGETS.map((b) => (
              <BudgetCard
                key={b.value}
                label={b.label}
                sub={b.sub}
                selected={selectedBudget === b.value}
                onPress={() => setSelectedBudget(b.value)}
              />
            ))}
          </View>
        )}

        {/* Step 3 — Occasions */}
        {step === 3 && (
          <View style={styles.chipWrap}>
            {OCCASIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                selected={selectedOccasions.includes(o.value)}
                onPress={() => toggle(o.value, selectedOccasions, setSelectedOccasions)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Footer Button ── */}
      <View style={styles.footer}>
        {step < TOTAL_STEPS - 1 ? (
          <Pressable style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.nextBtn, styles.finishBtn]}
            onPress={finish}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextBtnText}>Let's Go! 🎉</Text>
            )}
          </Pressable>
        )}
        <Text style={styles.footerNote}>You can update these anytime in your profile settings.</Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: brand.cream },

  progressTrack: { height: 5, backgroundColor: brand.border },
  progressFill: { height: 5, backgroundColor: brand.green },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 13, fontWeight: '700', color: brand.muted },
  skipBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  skipText: { fontSize: 13, fontWeight: '700', color: brand.muted },

  content: { paddingHorizontal: 20, paddingBottom: 140, paddingTop: 8 },

  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.6,
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: { fontSize: 14, color: brand.muted, lineHeight: 20, marginBottom: 28 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: brand.border,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  chipSelected: { backgroundColor: brand.green, borderColor: brand.green },
  chipText: { fontSize: 14, fontWeight: '600', color: brand.ink },
  chipTextSelected: { color: '#fff' },

  budgetList: { gap: 12 },
  budgetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: brand.border,
    borderRadius: 16,
    padding: 16,
  },
  budgetCardSelected: { borderColor: brand.green, backgroundColor: brand.mint },
  budgetLabel: { fontSize: 15, fontWeight: '700', color: brand.ink, marginBottom: 2 },
  budgetLabelSelected: { color: brand.green },
  budgetSub: { fontSize: 12, color: brand.muted },
  budgetSubSelected: { color: brand.green },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: brand.cream,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: brand.border,
    gap: 10,
    alignItems: 'center',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.green,
    borderRadius: 16,
    paddingVertical: 15,
    gap: 8,
    width: '100%',
  },
  finishBtn: { backgroundColor: brand.coral },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footerNote: { fontSize: 12, color: brand.muted, textAlign: 'center' },
});
