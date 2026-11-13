import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView, Image, Alert, PanResponder, Animated, Dimensions, ActivityIndicator, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import CustomPopup from './CustomPopup';

const MENU_ITEMS = [
  { id: 'USERS', icon: 'person', label: 'Gestão' },
  { id: 'MOD', icon: 'hammer', label: 'Punição' },
  { id: 'MAIL', icon: 'mail', label: 'Reports' },
  { id: 'SYS', icon: 'server', label: 'Sistema' }
];

export default function DebugFab() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('USERS');
  
  // Dados
  const [searchTxt, setSearchTxt] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [target, setTarget] = useState(null);
  
  // Mailbox
  const [reports, setReports] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({visible:false, title:'', msg:''});

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
        if(user) {
            const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (['dono', 'admin'].includes(data?.role)) {
                setVisible(true);
                loadReports();
            }
        }
    });
  }, []);

  const show = (t, m) => setPopup({visible:true, title:t, msg:m});

  const handleSearch = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').ilike('username', `%${searchTxt}%`).limit(5);
    setSearchResults(data || []);
    setLoading(false);
  };
  const selectUser = (u) => { setTarget(u); setSearchResults([]); setSearchTxt(''); };

  const loadReports = async () => {
      setLoadingReport(true);
      const { data } = await supabase
        .from('reports')
        .select('*, reporter:profiles!reporter_id(username)')
        .eq('status', 'open')
        .order('created_at', {ascending:false});
      setReports(data || []);
      setLoadingReport(false);
  };
  
  const closeReport = async (rid) => {
      await supabase.from('reports').update({status: 'solved'}).eq('id', rid);
      loadReports();
      show("Resolvido", "Denúncia arquivada.");
  };

  const run = async (cmd, val) => {
      if(!target && cmd !== 'nuke_all') return show("Erro", "Selecione um alvo.");
      
      try {
          if (cmd === 'role') {
              const { error } = await supabase.rpc('admin_set_role', { target_id: target.id, new_role: val });
              if(error) throw error;
              setTarget({...target, role:val});
              show("Sucesso", `Cargo: ${val}`);
          }
          if (cmd === 'ban') {
              const { error } = await supabase.rpc('admin_ban_user_v2', { target_id: target.id, hours: val, reason: 'Via GM Panel' });
              if(error) throw error;
              show("Punido", `Banido por ${val}h.`);
          }
          if (cmd === 'unban') {
              const { error } = await supabase.rpc('admin_unban_user', { target_id: target.id });
              if(error) throw error;
              show("Alívio", "Usuário desbanido.");
          }
          if (cmd === 'alert') {
             const text = val || "Aviso da Administração";
             await supabase.from('notifications').insert({
                 recipient_id: target.id, 
                 type: 'system_alert', 
                 content: text,
                 actor_id: (await supabase.auth.getUser()).data.user.id
             });
             show("Enviado", "Popup enviado.");
          }
      } catch (e) {
          show("Erro", e.message);
      }
  };

  const pan = useRef(new Animated.ValueXY({ x: 20, y: 100 })).current;
  const panResponder = useRef(PanResponder.create({
      onStartShouldSetPanResponder: ()=>true,
      onPanResponderMove: Animated.event([null, {dx:pan.x, dy:pan.y}], {useNativeDriver:false}),
      onPanResponderRelease: ()=>pan.extractOffset()
  })).current;

  if(!visible) return null;

  return (
    <>
      <Animated.View style={[styles.fabBox, {transform: [{translateX:pan.x}, {translateY:pan.y}]}]} {...panResponder.panHandlers}>
         <TouchableOpacity onPress={()=>setOpen(true)} style={styles.fabBtn} activeOpacity={0.8}>
            <Ionicons name="bug" size={26} color="black"/>
            {reports.length > 0 && <View style={styles.badge}><Text style={styles.badgeTxt}>{reports.length}</Text></View>}
         </TouchableOpacity>
      </Animated.View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
        <View style={styles.overlay}>
           <View style={styles.panel}>
              <View style={styles.header}>
                  <Text style={styles.title}>GM PANEL v5</Text>
                  <TouchableOpacity onPress={()=>setOpen(false)}><Ionicons name="close" color="white" size={26}/></TouchableOpacity>
              </View>

              {tab !== 'MAIL' && (
                <View style={{zIndex:100}}>
                   <View style={styles.searchRow}>
                       <TextInput style={styles.input} placeholder="Buscar..." placeholderTextColor="#666" value={searchTxt} onChangeText={setSearchTxt} />
                       <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                           {loading ? <ActivityIndicator size="small" color="#000"/> : <Ionicons name="search" size={20}/>}
                       </TouchableOpacity>
                   </View>
                   {searchResults.length > 0 && (
                       <ScrollView style={styles.resBox}>
                           {searchResults.map(u => (
                               <TouchableOpacity key={u.id} style={styles.resItem} onPress={()=>selectUser(u)}>
                                   <Image source={{uri:u.avatar_url}} style={{width:24,height:24, borderRadius:12, marginRight:10}} />
                                   <Text style={{color:'white'}}>{u.username}</Text>
                               </TouchableOpacity>
                           ))}
                       </ScrollView>
                   )}
                </View>
              )}
              
              {target && tab !== 'MAIL' && (
                  <View style={styles.targetInfo}>
                      <View>
                        <Text style={{color:'#00ff9d', fontWeight:'bold'}}>{target.username}</Text>
                        <Text style={{color:'#666', fontSize:10}}>ID: {target.id.substring(0,8)}... Role: {target.role}</Text>
                      </View>
                      <TouchableOpacity onPress={()=>setTarget(null)}><Ionicons name="close-circle" size={20} color="red"/></TouchableOpacity>
                  </View>
              )}

              <View style={styles.tabs}>
                  {MENU_ITEMS.map(i => (
                      <TouchableOpacity key={i.id} onPress={()=>setTab(i.id)} style={[styles.tabBtn, tab===i.id && styles.activeTab]}>
                          <Ionicons name={i.icon} size={20} color={tab===i.id?'black':'#888'} />
                          <Text style={[styles.tabTxt, tab===i.id && {color:'black'}]}>{i.label}</Text>
                      </TouchableOpacity>
                  ))}
              </View>

              <ScrollView style={styles.body}>
                  {tab === 'USERS' && (
                      <View>
                          <Label>HIERARQUIA</Label>
                          <View style={styles.grid}>
                             <Btn label="DONO" color="gold" onClick={()=>run('role','dono')}/>
                             <Btn label="ADMIN" color="red" onClick={()=>run('role','admin')}/>
                             <Btn label="DEV" color="#00ff00" onClick={()=>run('role','dev')}/>
                             <Btn label="MEMBER" color="#666" onClick={()=>run('role','member')}/>
                          </View>
                          <Label>DADOS</Label>
                          <Btn label="📋 COPIAR ID" color="#333" textColor="white" onClick={()=>Alert.alert(target.id)} />
                      </View>
                  )}

                  {tab === 'MOD' && (
                      <View>
                          <Label>PUNIÇÃO</Label>
                          <View style={styles.grid}>
                             <Btn label="1H BAN" color="orange" onClick={()=>run('ban', 1)} />
                             <Btn label="24H BAN" color="orange" onClick={()=>run('ban', 24)} />
                          </View>
                          <Btn label="⛔ PERMA BAN" color="#900" textColor="white" onClick={()=>run('ban', -1)} />
                          <View style={{height:10}} />
                          <Btn label="😇 UNBAN" color="lime" textColor="black" onClick={()=>run('unban')} />
                          
                          <View style={{height:10}} />
                          <Label>COMUNICAÇÃO</Label>
                          <Btn label="📢 ALERTA POPUP" color="#6200ee" textColor="white" onClick={()=>run('alert', 'Aviso Admin: Pare.')} />
                      </View>
                  )}

                  {tab === 'MAIL' && (
                      <View>
                          {reports.length === 0 && <Text style={{color:'#666', textAlign:'center', marginTop:20}}>Sem denúncias.</Text>}
                          {reports.map(r => (
                              <View key={r.id} style={styles.mailCard}>
                                  <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                                      <Text style={{color:'red', fontWeight:'bold'}}>@{r.reporter?.username}</Text>
                                      <Text style={{color:'#666', fontSize:10}}>{new Date(r.created_at).toLocaleDateString()}</Text>
                                  </View>
                                  <Text style={{color:'white', marginVertical:5}}>{r.reason}</Text>
                                  <TouchableOpacity onPress={()=>closeReport(r.id)} style={{alignSelf:'flex-end'}}>
                                      <Text style={{color:'#00ff9d', fontSize:12, fontWeight:'bold'}}>RESOLVER</Text>
                                  </TouchableOpacity>
                              </View>
                          ))}
                      </View>
                  )}
              </ScrollView>

           </View>
        </View>
        <CustomPopup visible={popup.visible} title={popup.title} message={popup.msg} onClose={()=>setPopup({visible:false})} />
      </Modal>
    </>
  );
}

// Helpers
const { width, height } = Dimensions.get('window');
const Label = ({children}) => <Text style={{color:'#666', fontSize:10, fontWeight:'900', marginTop:15, marginBottom:5}}>{children}</Text>;
const Btn = ({label, color, textColor='black', onClick}) => (
    <TouchableOpacity style={{backgroundColor:color, padding:12, borderRadius:8, flexBasis:'48%', marginBottom:8, alignItems:'center'}} onPress={onClick}>
        <Text style={{fontWeight:'900', fontSize:11, color:textColor}}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
  fabBox: { position:'absolute', zIndex:9999 },
  fabBtn: { width:60, height:60, borderRadius:30, backgroundColor:'#00ff9d', justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:'black', elevation:10 },
  badge: { position:'absolute', top:-5, right:-5, backgroundColor:'red', borderRadius:10, width:20, height:20, justifyContent:'center', alignItems:'center' },
  badgeTxt: { color:'white', fontSize:10, fontWeight:'bold' },
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.9)', justifyContent:'center', alignItems:'center' },
  panel: { width: width*0.9, height: height*0.75, backgroundColor:'#111', borderRadius:20, padding:20, borderWidth:1, borderColor:'#333' },
  header: { flexDirection:'row', justifyContent:'space-between', marginBottom:20 },
  title: { color:'#00ff9d', fontSize:22, fontWeight:'900' },
  searchRow: { flexDirection:'row', gap:10, marginBottom:10 },
  input: { flex:1, backgroundColor:'#222', color:'white', padding:10, borderRadius:8 },
  searchBtn: { backgroundColor:'#eee', width:45, borderRadius:8, justifyContent:'center', alignItems:'center' },
  resBox: { backgroundColor:'#222', maxHeight:150, borderRadius:8, position:'absolute', top:50, left:0, right:0, zIndex:200, borderWidth:1, borderColor:'#444' },
  resItem: { padding:10, borderBottomWidth:1, borderBottomColor:'#333', flexDirection:'row', gap:10, alignItems:'center' },
  targetInfo: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:10, backgroundColor:'#1a1a1a', borderRadius:8, marginBottom:10, borderLeftWidth:3, borderLeftColor:'lime' },
  tabs: { flexDirection:'row', justifyContent:'space-between', marginBottom:15, backgroundColor:'#1a1a1a', borderRadius:10, padding:5 },
  tabBtn: { alignItems:'center', flex:1, padding:8, borderRadius:8 },
  activeTab: { backgroundColor:'#00ff9d' },
  tabTxt: { fontSize:10, marginTop:2, fontWeight:'bold', color:'#888' },
  grid: { flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between' },
  mailCard: { backgroundColor:'#220000', padding:10, borderRadius:8, marginBottom:10, borderLeftWidth:4, borderLeftColor:'red' }
});
