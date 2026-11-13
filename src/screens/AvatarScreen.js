import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar3DView from '../components/Avatar3DView';

const { height } = Dimensions.get('window');

const SHOP_ITEMS = [
  { id: 'blue', name: 'Camisa Azul', color: '#3498db', price: 0 },
  { id: 'red', name: 'Camisa Vermelha', color: '#e74c3c', price: 100 },
  { id: 'green', name: 'Camisa Verde', color: '#2ecc71', price: 250 },
  { id: 'purple', name: 'Terno Roxo', color: '#9b59b6', price: 500 },
  { id: 'gold', name: 'Armadura Dourada', color: '#ffd700', price: 9999 },
];

export default function AvatarScreen() {
  const [selectedColor, setSelectedColor] = useState('#3498db');
  const [coins, setCoins] = useState(150); // Simulação

  return (
    <View style={styles.container}>
      
      {/* 1. VIEWPORT 3D (Metade de Cima) */}
      <View style={styles.viewer3d}>
          <Avatar3DView color={selectedColor} />
          
          {/* HUD flutuante */}
          <View style={styles.hud}>
             <View style={styles.coinBadge}>
                 <Ionicons name="cash" color="gold" size={16} />
                 <Text style={styles.coinText}>{coins}</Text>
             </View>
          </View>
      </View>

      {/* 2. LOJA & INVENTÁRIO (Metade de Baixo) */}
      <View style={styles.shopContainer}>
         <Text style={styles.shopTitle}>Personalizar</Text>
         <ScrollView>
             {SHOP_ITEMS.map(item => (
                 <TouchableOpacity 
                    key={item.id} 
                    style={[styles.itemCard, selectedColor === item.color && styles.activeCard]}
                    onPress={() => setSelectedColor(item.color)}
                 >
                    <View style={[styles.previewColor, {backgroundColor: item.color}]} />
                    <View style={{flex:1}}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>{item.price === 0 ? 'Grátis' : item.price + ' Coins'}</Text>
                    </View>
                    {selectedColor === item.color ? (
                        <Ionicons name="checkmark-circle" color="#00ff9d" size={24} />
                    ) : (
                        <Text style={styles.btnEquip}>USAR</Text>
                    )}
                 </TouchableOpacity>
             ))}
             <View style={{height: 100}} />
         </ScrollView>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  // Área 3D
  viewer3d: { height: height * 0.45, width: '100%', backgroundColor: '#111' },
  hud: { position: 'absolute', top: 50, right: 20 },
  coinBadge: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20, alignItems: 'center', gap: 5 },
  coinText: { color: 'white', fontWeight: 'bold' },

  // Área Loja
  shopContainer: { flex: 1, backgroundColor: '#18181b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, marginTop: -20 },
  shopTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  
  itemCard: { 
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', 
      padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#333' 
  },
  activeCard: { borderColor: '#00ff9d', backgroundColor: '#1f2f25' },
  
  previewColor: { width: 40, height: 40, borderRadius: 8, marginRight: 15 },
  itemName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  itemPrice: { color: '#888', fontSize: 12 },
  btnEquip: { color: '#00ff9d', fontWeight: 'bold', fontSize: 12 }
});
