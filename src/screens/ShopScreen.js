import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';

const PFP_ITEMS = [
  { id: 'neon-fox', name: 'Raposa Neon', seed: 'neon-fox', color: '#00ff9d' },
  { id: 'pixel-robot', name: 'Robô Pixel', seed: 'pixel-robot', color: '#4dabf7' },
  { id: 'purple-cat', name: 'Gato Roxo', seed: 'purple-cat', color: '#b197fc' },
  { id: 'golden-warrior', name: 'Guerreiro Dourado', seed: 'golden-warrior', color: '#ffd43b' },
  { id: 'red-dragon', name: 'Dragão Vermelho', seed: 'red-dragon', color: '#ff6b6b' },
  { id: 'space-panda', name: 'Panda Espacial', seed: 'space-panda', color: '#f8f9fa' },
];

const getPfpUrl = (seed) =>
  `https://api.dicebear.com/9.x/bottts/png?seed=${encodeURIComponent(seed)}&size=256&backgroundColor=111111`;

export default function ShopScreen({ navigation }) {
  const [currentAvatar, setCurrentAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const loadProfileAvatar = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (error) Alert.alert('Erro', 'Não foi possível carregar sua PFP.');
    else setCurrentAvatar(data?.avatar_url || null);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    loadProfileAvatar();
  }, [loadProfileAvatar]));

  const usePfp = async (item) => {
    setSavingId(item.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Você precisa estar conectado.');

      const avatarUrl = getPfpUrl(item.seed);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (error) throw error;
      setCurrentAvatar(avatarUrl);
      Alert.alert('PFP atualizada', `${item.name} foi definida no seu perfil.`);
    } catch (error) {
      Alert.alert('Não foi possível atualizar', error.message || 'Tente novamente.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Loja de PFP</Text>
          <Text style={styles.subtitle}>Escolha uma foto para o seu perfil</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="image-outline" size={22} color="#00ff9d" />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00ff9d" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {PFP_ITEMS.map((item) => {
            const avatarUrl = getPfpUrl(item.seed);
            const selected = currentAvatar === avatarUrl;
            const saving = savingId === item.id;

            return (
              <View key={item.id} style={styles.card}>
                <View style={[styles.preview, { borderColor: item.color }]}>
                  <Image source={{ uri: avatarUrl }} style={styles.image} />
                  {selected && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark" size={16} color="#000" />
                    </View>
                  )}
                </View>
                <Text style={styles.name}>{item.name}</Text>
                <TouchableOpacity
                  disabled={saving || selected}
                  style={[styles.button, selected && styles.selectedButton]}
                  onPress={() => usePfp(item)}
                >
                  {saving ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>{selected ? 'Em uso' : 'Usar PFP'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
          <Text style={styles.note}>
            Nesta primeira versão, as PFPs são gratuitas. O sistema de moedas e inventário pode ser adicionado depois.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 18, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: '#222', gap: 12 },
  backButton: { backgroundColor: '#151515', padding: 9, borderRadius: 20 },
  headerIcon: { marginLeft: 'auto', backgroundColor: '#123326', padding: 10, borderRadius: 22 },
  title: { color: '#fff', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#777', fontSize: 12, marginTop: 3 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 16, paddingBottom: 40 },
  card: { width: '48%', backgroundColor: '#111', borderRadius: 16, padding: 12, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#222' },
  preview: { width: 116, height: 116, borderRadius: 58, borderWidth: 3, backgroundColor: '#111', overflow: 'hidden', marginBottom: 10 },
  image: { width: '100%', height: '100%' },
  selectedBadge: { position: 'absolute', right: 2, bottom: 2, backgroundColor: '#00ff9d', borderRadius: 14, padding: 4 },
  name: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  button: { width: '100%', minHeight: 36, borderRadius: 9, backgroundColor: '#00ff9d', alignItems: 'center', justifyContent: 'center' },
  selectedButton: { backgroundColor: '#244b3b' },
  buttonText: { color: '#000', fontWeight: '800', fontSize: 12 },
  note: { width: '100%', color: '#666', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 6 },
});
