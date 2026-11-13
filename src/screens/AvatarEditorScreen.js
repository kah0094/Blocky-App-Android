import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '../services/supabase';
import BlockyAvatar from '../components/BlockyAvatar';
import { Ionicons } from '@expo/vector-icons';

const ITEMS = {
  skins: ['#f8d9bd', '#e0ac69', '#8d5524', '#ffdbac'],
  hairs: ['black', 'brown', 'blonde'],
  shirts: ['shirt_blue', 'shirt_red', 'shirt_green', 'shirt_black']
};

export default function AvatarEditorScreen({ navigation }) {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
        if(!user) return;
        const { data } = await supabase.from('avatars').select('*').eq('user_id', user.id).single();
        if(data) setConfig(data);
    });
  }, []);

  const save = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('avatars').update({
        skin_color: config.skin_color,
        hair: config.hair,
        shirt: config.shirt
    }).eq('user_id', user.id);
    setLoading(false);
    navigation.goBack();
  };

  const Option = ({ color, active, onPress, label }) => (
    <TouchableOpacity onPress={onPress} style={[styles.opt, active && styles.optActive, {backgroundColor: color}]}>
       {active && <Ionicons name="checkmark" color="white" size={16}/>}
       {label && <Text style={{fontSize:10, color:'#fff'}}>{label}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
       <View style={styles.previewArea}>
          <BlockyAvatar config={config} size={200} />
       </View>
       
       <ScrollView style={styles.controls}>
           <Text style={styles.label}>Pele</Text>
           <ScrollView horizontal>
               {ITEMS.skins.map(s => (
                   <Option key={s} color={s} active={config.skin_color===s} onPress={()=>setConfig({...config, skin_color:s})} />
               ))}
           </ScrollView>

           <Text style={styles.label}>Cabelo</Text>
           <ScrollView horizontal>
               {ITEMS.hairs.map(h => (
                   <Option key={h} color="#333" label={h} active={config.hair===h} onPress={()=>setConfig({...config, hair:h})} />
               ))}
           </ScrollView>

           <Text style={styles.label}>Roupa</Text>
           <ScrollView horizontal>
               {ITEMS.shirts.map(s => (
                   <Option key={s} color={s.includes('red')?'red':s.includes('green')?'green':s.includes('black')?'#333':'blue'} active={config.shirt===s} onPress={()=>setConfig({...config, shirt:s})} />
               ))}
           </ScrollView>
       </ScrollView>

       <TouchableOpacity style={styles.saveBtn} onPress={save}>
           <Text style={styles.saveTxt}>{loading ? 'Salvando...' : 'Salvar Avatar'}</Text>
       </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 40 },
  previewArea: { height: 250, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', margin: 20, borderRadius: 20 },
  controls: { paddingHorizontal: 20 },
  label: { color: 'white', marginTop: 15, marginBottom: 10, fontWeight: 'bold' },
  opt: { width: 50, height: 50, borderRadius: 25, marginRight: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#333' },
  optActive: { borderColor: '#00ff9d', borderWidth: 3 },
  saveBtn: { margin: 20, backgroundColor: '#00ff9d', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveTxt: { fontWeight: 'bold', fontSize: 16 }
});
