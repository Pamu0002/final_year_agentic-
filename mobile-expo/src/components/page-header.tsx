import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { brand } from '@/constants/brand';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}>
        <Ionicons name="arrow-back" size={21} color={brand.ink} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: brand.border, alignItems: 'center', justifyContent: 'center' },
  title: { color: brand.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: brand.muted, fontSize: 12, marginTop: 2 },
});
