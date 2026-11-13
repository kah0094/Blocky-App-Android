import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import BlockyAvatar from '../components/BlockyAvatar';

const ITEMS = [
  { id: 'shirt_red', name: 'Camisa Vermelha', price: 100, category: 'shirt' },
  { id: 'hair_blonde', name: 'Cabelo Loiro', price: 500, category: 'hair' },
  { id: 'shirt_green', name: 'Traje Verde', price: 250, category: 'shirt' },
];

export default function ShopScreen() {
  const [coins, setCoins] = useState(0);

  useFocusEffect(useCallback(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
        if(user) {
            const { data } = await supabase.from('profiles').select('coins').eq('id', user.id).single();
            setCoins(data?.coins || 0);
        }
    });
  }, []));

  const buy = (item) => Alert.alert("Loja", `Comprar ${item.name} por ${item.price}?`, [
      { text: "Cancelar" },
      { text: "Comprar", onPress: () => Alert.alert("Sucesso", "Item comprado (Lógica backend necessária)") }
  ]);

  return (
    <View style={styles.container}>
       <LinearGradient colors={['#FFD700', '#222']} style={styles.banner}>
           <Text style={styles.title}>LOJA DE ITENS</Text>
           <View style={styles.coinBox}>
               <Ionicons name="cash" size={24} color="gold" />
               <Text style={styles.coinText}>{coins} BlockCoins</Text>
           </View>
       </LinearGradient>
       
       <ScrollView contentContainerStyle={styles.grid}>
           {ITEMS.map(i => (
               <View key={i.id} style={styles.card}>
                   <View style={styles.preview}>
                       {/* Previa Fake do Avatar usando o item */}
                       <BlockyAvatar config={{ [i.category]: i.id }} size={80} />
                   </View>
                   <Text style={styles.name}>{i.name}</Text>
                   <TouchableOpacity style={styles.btn} onPress={() => buy(i)}>
                       <Text style={styles.price}>{i.price} 💰</Text>
                   </TouchableOpacity>
               </View>
           ))}
       </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  banner: { height: 160, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: '900', color: 'white' },
  coinBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20, alignSelf: 'flex-start', marginTop: 10, gap: 10 },
  coinText: { color: 'gold', fontWeight: 'bold', fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 15, gap: 15 },
  card: { width: '45%', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  preview: { marginBottom: 10 },
  name: { color: 'white', fontWeight: 'bold', marginBottom: 10, fontSize: 12 },
  btn: { backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 15, borderWidth: 1, borderColor: 'gold' },
  price: { color: 'gold', fontWeight: 'bold' }
});
