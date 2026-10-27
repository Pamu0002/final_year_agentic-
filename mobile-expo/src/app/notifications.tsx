import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/screen';
import { PageHeader } from '@/components/page-header';
import { brand } from '@/constants/brand';
import { api } from '@/lib/api';
import type { NotificationItem } from '@/types/mobile-types';

export default function NotificationsScreen() {
  const [items,setItems]=useState<NotificationItem[]>([]); const [loading,setLoading]=useState(true); const [unread,setUnread]=useState(0);
  useEffect(()=>{const load=()=>api<{data:NotificationItem[];unreadCount:number}>('/api/users/me/notifications').then((r)=>{setItems(r.data);setUnread(r.unreadCount)}).finally(()=>setLoading(false));load();const timer=setInterval(load,15000);return()=>clearInterval(timer);},[]);
  const read=async(item:NotificationItem)=>{if(!item.isRead){await api(`/api/users/me/notifications/${item.id}/read`,{method:'PATCH'});setItems((all)=>all.map((n)=>n.id===item.id?{...n,isRead:true}:n));setUnread((n)=>Math.max(0,n-1));}};
  const readAll=async()=>{await api('/api/users/me/notifications/read-all',{method:'PATCH'});setItems((all)=>all.map((n)=>({...n,isRead:true})));setUnread(0)};
  return <Screen><PageHeader title="Notifications" subtitle={`${unread} unread updates`} />{unread>0&&<Pressable style={styles.readAll} onPress={readAll}><Ionicons name="checkmark-done" size={17} color={brand.green}/><Text style={styles.readAllText}>Mark all as read</Text></Pressable>}{loading?<ActivityIndicator color={brand.green}/>:items.length===0?<Text style={styles.empty}>You’re all caught up.</Text>:items.map((item)=><Pressable key={item.id} onPress={()=>read(item)} style={[styles.card,!item.isRead&&styles.unread]}><View style={styles.icon}><Ionicons name={item.type.startsWith('PAYMENT')?'card-outline':'notifications-outline'} size={20} color={brand.green}/></View><View style={{flex:1}}><View style={styles.row}><Text style={styles.title}>{item.title}</Text>{!item.isRead&&<View style={styles.dot}/>}</View><Text style={styles.message}>{item.message}</Text><Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text></View></Pressable>)}</Screen>;
}
const styles=StyleSheet.create({readAll:{alignSelf:'flex-end',flexDirection:'row',gap:6,alignItems:'center',padding:8},readAllText:{color:brand.green,fontWeight:'700'},card:{flexDirection:'row',gap:12,padding:15,borderRadius:18,borderWidth:1,borderColor:brand.border,backgroundColor:'#FFF'},unread:{backgroundColor:brand.mint,borderColor:'#CDA8A0'},icon:{width:42,height:42,borderRadius:14,backgroundColor:'#FFF',alignItems:'center',justifyContent:'center'},row:{flexDirection:'row',alignItems:'center',gap:6},title:{color:brand.ink,fontWeight:'800',fontSize:15,flex:1},dot:{width:7,height:7,borderRadius:4,backgroundColor:brand.green},message:{color:brand.muted,fontSize:13,lineHeight:19,marginTop:3},date:{color:brand.muted,fontSize:10,marginTop:6},empty:{textAlign:'center',color:brand.muted,padding:30}});
