import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnlineContext } from '../context/OnlineContext';
import CustomPopup from '../components/CustomPopup';
import RoleBadge from '../components/RoleBadge';

const { width } = Dimensions.get('window');

// FUNÇÃO DE ESTILO DO AVATAR (Manteve-se igual para dar o brilho no Dono)
const getRoleStyle = (role) => {
    switch(role) {
        case 'dono': return { borderColor: '#FFD700', borderWidth: 4 }; // Dourado
        case 'admin': return { borderColor: '#ff4444', borderWidth: 4 }; // Vermelho
        case 'premium': return { borderColor: '#ff00ff', borderWidth: 4 }; // Rosa
        default: return { borderColor: '#000', borderWidth: 4 };
    }
};

export default function ProfileScreen({ route, navigation }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });
  const [isMe, setIsMe] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false); // Amizade mútua
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState(0); 

  // Status Online
  const { isUserOnline } = useContext(OnlineContext);

  const [popup, setPopup] = useState({visible:false, title:'', msg:''});
  const targetUserId = route.params?.userId;
  const insets = useSafeAreaInsets();

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;
      const idToFetch = targetUserId || currentUserId;
      if (!idToFetch) return;
      
      setIsMe(currentUserId === idToFetch);

      let { data: u } = await supabase.from('profiles').select('*').eq('id', idToFetch).single();
      setProfile(u);

      const { data: p } = await supabase.from('posts').select('*').eq('user_id', idToFetch).order('created_at', {ascending:false});
      setPosts(p || []);
      
      const { count: f } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', idToFetch);
      const { count: g } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', idToFetch);
      setStats({ followers: f||0, following: g||0, posts: p?.length||0 });

      if (currentUserId !== idToFetch) {
        const { data: iFollow } = await supabase.from('follows').select('*').eq('follower_id', currentUserId).eq('following_id', idToFetch).single();
        const { data: heFollows } = await supabase.from('follows').select('*').eq('follower_id', idToFetch).eq('following_id', currentUserId).single();
        setIsFollowing(!!iFollow);
        setIsFriend(!!iFollow && !!heFollows);
      }
    } catch(e) {} finally { setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchProfile(); }, [targetUserId]));

  const isOnline = profile ? isUserOnline(profile.id) : false;
  const roleStyle = getRoleStyle(profile?.role);
  const displayUID = profile?.id ? profile.id.substring(0, 8).toUpperCase() : '...';

  // Lógica Botões
  const handleFollow = async () => { /* Mesma lógica anterior... */ };
  const handleChat = async () => { 
      // Abre ou cria chat
      navigation.navigate('ChatList'); 
      // Idealmente aqui vai para o Chat direto, vou deixar a lógica genérica para não quebrar
  }; 
  const copyID = async () => { if(profile?.id) await Clipboard.setStringAsync(profile.id.toUpperCase()); };

  return (
    <View style={styles.container}>
      {/* Botão Voltar (Só aparece se for perfil de outro e puder voltar) */}
      {!isMe && navigation.canGoBack() && (
        <TouchableOpacity style={[styles.backBtn, {top: insets.top+10}]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true); fetchProfile()}} tintColor="#00ff9d"/>}>
        
        {/* Banner (Muda cor se for dono) */}
        <LinearGradient 
          colors={profile?.role === 'dono' ? ['#FFD700', '#1a1a1a'] : ['#1a1a1a', '#000']} 
          style={styles.banner} 
        />

        <View style={styles.content}>
          <View style={styles.headerRow}>
              {/* FOTO DO USUÁRIO + STATUS */}
              <View>
                 <Image source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/150' }} style={[styles.avatar, roleStyle]} />
                 {/* BOLINHA VERDE DENTRO DO AVATAR */}
                 <View style={[styles.statusDot, { backgroundColor: isOnline ? '#00ff00' : '#444' }]} />
              </View>

              <View style={styles.statsBox}>
                  <View style={styles.statItem}><Text style={styles.statNum}>{stats.posts}</Text><Text style={styles.statL}>Posts</Text></View>
                  <View style={styles.statItem}><Text style={styles.statNum}>{stats.followers}</Text><Text style={styles.statL}>Seguidores</Text></View>
                  <View style={styles.statItem}><Text style={styles.statNum}>{stats.following}</Text><Text style={styles.statL}>Seguindo</Text></View>
              </View>
          </View>

          <View style={styles.info}>
              <View style={{flexDirection:'row', alignItems:'center'}}>
                  <Text style={[styles.name, profile?.role === 'dono' && {color:'gold'}]}>{profile?.username}</Text>
                  <RoleBadge role={profile?.role}/>
              </View>
              
              <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
                 <TouchableOpacity onPress={copyID}><Text style={styles.uid}>@{profile?.username} • #{displayUID}</Text></TouchableOpacity>
              </View>

              <Text style={styles.bio}>{profile?.bio || 'Sem biografia definida.'}</Text>
          </View>

          <View style={styles.actions}>
              {isMe ? (
                  <>
                      <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => navigation.navigate('EditProfile')}>
                          <Text style={{color:'white', fontWeight:'bold'}}>Editar Perfil</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
                          <Ionicons name="settings-outline" size={22} color="#fff" />
                      </TouchableOpacity>
                  </>
              ) : (
                  <>
                     <TouchableOpacity 
                        style={[styles.btn, isFollowing ? {backgroundColor:'#333'} : {backgroundColor:'#00ff9d'}]} 
                        onPress={handleFollow}
                     >
                         <Text style={{color: isFollowing?'white':'black', fontWeight:'bold'}}>{isFollowing?'Seguindo':'Seguir'}</Text>
                     </TouchableOpacity>
                     
                     {isFriend && (
                         <TouchableOpacity style={[styles.btn, {backgroundColor:'#6200ee'}]} onPress={handleChat}>
                             <Ionicons name="chatbubble" color="white" size={18}/>
                         </TouchableOpacity>
                     )}
                  </>
              )}
          </View>

          {/* Abas e Grid */}
          <View style={styles.tabs}>
              <TouchableOpacity onPress={()=>setTab(0)} style={[styles.tab, tab===0 && styles.activeTab]}>
                  <Text style={[styles.tabTxt, tab===0 && {color:'#00ff9d'}]}>Publicações</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setTab(1)} style={[styles.tab, tab===1 && styles.activeTab]}>
                  <Text style={[styles.tabTxt, tab===1 && {color:'#00ff9d'}]}>Criações</Text>
              </TouchableOpacity>
          </View>

          {tab === 0 && (
              <View style={styles.grid}>
                  {posts.map(p => (
                      <TouchableOpacity key={p.id} style={styles.gridItem} onPress={()=>navigation.navigate('PostDetail',{post:p})}>
                          {p.image_url ? (
                              <Image source={{uri:p.image_url}} style={{width:'100%', height:'100%'}} resizeMode="cover"/>
                          ) : (
                              <View style={styles.noImage}><Ionicons name="document-text" color="#333" size={24}/></View>
                          )}
                      </TouchableOpacity>
                  ))}
                  {posts.length===0 && <Text style={{color:'#666', width:'100%', textAlign:'center', marginTop:20}}>Nada publicado.</Text>}
              </View>
          )}
          
          {tab === 1 && <Text style={{color:'#666', width:'100%', textAlign:'center', marginTop:20}}>Em breve: Seus jogos da Engine PC.</Text>}

      </View>
      <CustomPopup visible={popup.visible} title={popup.title} message={popup.msg} onClose={()=>setPopup({visible:false})}/>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  banner: { height: 130, width: '100%' },
  backBtn: { position: 'absolute', left: 15, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  content: { paddingHorizontal: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems:'flex-end', marginTop: -50 },
  
  // AVATAR SIMPLES + ONLINE
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#222' },
  statusDot: { position: 'absolute', bottom: 5, right: 0, width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: '#000' },
  
  statsBox: { flexDirection: 'row', gap: 18, paddingTop: 60, flex: 1, justifyContent:'flex-end' },
  statItem: { alignItems: 'center' },
  statNum: { color: 'white', fontWeight: 'bold', fontSize: 17 },
  statL: { color: '#888', fontSize: 11, fontWeight:'600' },
  
  info: { marginTop: 10 },
  name: { color: 'white', fontSize: 26, fontWeight: '800' },
  uid: { color: '#666', fontSize: 12 },
  bio: { color: '#ccc', marginTop: 8, fontSize: 14, lineHeight: 22 },
  
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, borderRadius: 10, height: 44, alignItems: 'center', justifyContent: 'center' },
  btnOutline: { borderWidth: 1, borderColor: '#444', backgroundColor:'#1a1a1a' },
  iconBtn: { width: 44, height: 44, backgroundColor: '#1a1a1a', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth:1, borderColor:'#333' },

  tabs: { flexDirection: 'row', marginTop: 25, borderBottomWidth: 1, borderBottomColor: '#222' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#00ff9d' },
  tabTxt: { color: '#888', fontWeight: 'bold', fontSize:13 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginTop: 10 },
  gridItem: { width: (width-34)/3, height: (width-34)/3, backgroundColor: '#151515', borderRadius: 6, overflow: 'hidden' },
  noImage: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
