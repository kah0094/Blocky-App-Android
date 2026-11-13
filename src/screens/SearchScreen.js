import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import RoleBadge from '../components/RoleBadge';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('USERS'); 

  // Efeito "Debounce" (Busca ao digitar)
  useEffect(() => {
      if(!query) { setResults([]); return; }
      
      const timer = setTimeout(async () => {
          setLoading(true);
          try {
            if (tab === 'USERS') {
                const { data } = await supabase.from('profiles').select('*').ilike('username', `%${query}%`).limit(20);
                setResults(data || []);
            } else {
                const { data } = await supabase.from('posts').select('*, profiles(*)').ilike('title', `%${query}%`).limit(20);
                setResults(data || []);
            }
          } catch(e){} finally { setLoading(false); }
      }, 500); // 0.5s de delay

      return () => clearTimeout(timer);
  }, [query, tab]);

  const highlightText = (text, term) => {
      // Simulação simples de destaque (React Native requer componentes aninhados)
      return text; 
  };

  const renderItem = ({ item }) => {
    if (tab === 'USERS') {
        return (
            <TouchableOpacity style={styles.userCard} onPress={() => navigation.navigate('Profile', { userId: item.id })}>
                <Image source={{ uri: item.avatar_url || 'https://via.placeholder.com/50' }} style={styles.avatar} />
                <View style={{flex:1}}>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <Text style={styles.username}>{item.username}</Text>
                        <RoleBadge role={item.role} />
                    </View>
                    <Text style={styles.subtext} numberOfLines={1}>{item.bio || "Sem biografia."}</Text>
                </View>
                <Ionicons name="chevron-forward" color="#666" size={20} />
            </TouchableOpacity>
        );
    } else {
        return (
            <TouchableOpacity style={styles.postCard} onPress={() => navigation.navigate('PostDetail', { post: item })}>
                <Image source={{ uri: item.image_url }} style={styles.postThumb} />
                <View style={styles.postInfo}>
                    <Text style={styles.postTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <Image source={{uri:item.profiles?.avatar_url}} style={{width:16,height:16,borderRadius:8, marginRight:5}} />
                        <Text style={styles.subtext} numberOfLines={1}>{item.profiles?.username}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.headerArea}>
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#888" />
            <TextInput 
                style={styles.input} 
                placeholder={tab === 'USERS' ? "Buscar Pessoas..." : "Buscar Projetos..."} 
                placeholderTextColor="#666"
                value={query}
                onChangeText={setQuery}
                autoFocus
            />
            {query.length > 0 && <TouchableOpacity onPress={()=>setQuery('')}><Ionicons name="close-circle" size={18} color="#666"/></TouchableOpacity>}
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'USERS' && styles.activeTab]} onPress={() => {setTab('USERS'); setResults([]);}}>
            <Text style={[styles.tabText, tab === 'USERS' && {color:'#fff'}]}>Pessoas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'POSTS' && styles.activeTab]} onPress={() => {setTab('POSTS'); setResults([]);}}>
            <Text style={[styles.tabText, tab === 'POSTS' && {color:'#fff'}]}>Posts</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
         <View style={{marginTop:30}}><ActivityIndicator color="#00ff9d" /><Text style={{color:'#666', textAlign:'center', marginTop:10}}>Buscando...</Text></View>
      ) : (
         <FlatList
             data={results}
             keyExtractor={item => item.id.toString()}
             contentContainerStyle={{padding: 15, paddingBottom:50}}
             renderItem={renderItem}
             ListEmptyComponent={query.length > 0 && <Text style={styles.empty}>Nada encontrado.</Text>}
         />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 40 },
  headerArea: { paddingHorizontal: 15, marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 10, borderRadius: 12, borderWidth:1, borderColor:'#222' },
  input: { flex: 1, color: '#fff', marginLeft: 10, fontSize:16 },
  
  tabs: { flexDirection: 'row', paddingHorizontal:15, borderBottomWidth:1, borderColor:'#222' },
  tab: { marginRight: 20, paddingVertical: 10 },
  activeTab: { borderBottomWidth: 2, borderColor: '#00ff9d' },
  tabText: { color: '#666', fontWeight: 'bold' },

  // User Card
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#111', borderRadius: 12, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#333' },
  username: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  subtext: { color: '#888', fontSize: 12 },

  // Post Card
  postCard: { flexDirection: 'row', marginBottom: 10, backgroundColor: '#111', borderRadius: 12, padding:10 },
  postThumb: { width: 70, height: 70, borderRadius: 8, backgroundColor:'#333' },
  postInfo: { flex: 1, marginLeft: 10, justifyContent: 'center' },
  postTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  
  empty: { color: '#444', textAlign: 'center', marginTop: 50, fontStyle:'italic' }
});
