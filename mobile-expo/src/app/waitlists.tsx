import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/screen';
import { PageHeader } from '@/components/page-header';
import { brand } from '@/constants/brand';
import { api } from '@/lib/api';
import type { WaitlistEntry } from '@/types/mobile-types';

export default function WaitlistsScreen() {
  const [items, setItems] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const load = () => api<WaitlistEntry[]>('/api/waitlist').then(setItems).finally(() => setLoading(false));
  useEffect(() => { load().catch(() => undefined); }, []);

  const leave = async (id: string) => {
    try { await api(`/api/waitlist/${id}`, { method: 'DELETE' }); setItems((all) => all.filter((item) => item.id !== id)); }
    catch (error: any) { Alert.alert('Unable to leave waitlist', error.message); }
  };

  return <Screen><PageHeader title="My waitlists" subtitle="Live queue positions and available tables" />
    {loading ? <ActivityIndicator color={brand.green} /> : items.length === 0 ? <View style={styles.empty}><Ionicons name="time-outline" size={42} color={brand.green}/><Text style={styles.emptyTitle}>No active waitlists</Text><Text style={styles.muted}>Join from a restaurant page when your preferred time is full.</Text></View> : items.map((item) => <View key={item.id} style={styles.card}>
      <View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.name}>{item.restaurant?.name ?? 'Restaurant'}</Text><Text style={styles.muted}>{item.date.slice(0,10)} · {item.time} · {item.partySize} guests</Text></View><View style={styles.position}><Text style={styles.positionText}>#{item.position ?? '—'}</Text></View></View>
      <View style={styles.row}><Text style={styles.status}>{item.status === 'NOTIFIED' ? 'A table is available' : 'Waiting for a table'}</Text><Pressable onPress={() => leave(item.id)}><Text style={styles.leave}>Leave</Text></Pressable></View>
    </View>)}
  </Screen>;
}
const styles = StyleSheet.create({card:{backgroundColor:'#FFF',borderWidth:1,borderColor:brand.border,borderRadius:18,padding:16,gap:14},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},name:{fontSize:17,fontWeight:'800',color:brand.ink},muted:{color:brand.muted,fontSize:13,lineHeight:19},position:{width:46,height:46,borderRadius:16,backgroundColor:brand.green,alignItems:'center',justifyContent:'center'},positionText:{color:'#FFF',fontWeight:'900'},status:{color:brand.green,fontWeight:'700',fontSize:12},leave:{color:'#B42318',fontWeight:'700'},empty:{alignItems:'center',padding:28,gap:8,backgroundColor:'#FFF',borderRadius:20,borderWidth:1,borderColor:brand.border},emptyTitle:{color:brand.ink,fontSize:18,fontWeight:'800'}});
