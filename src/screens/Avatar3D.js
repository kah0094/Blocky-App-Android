import React, { useState, useRef, useEffect, Suspense } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

// PEÇAS DO CORPO (ESTILO ROBLOX CLASSICO)
const BodyPart = ({ position, args, color }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// O PERSONAGEM
const BlockyCharacter = ({ config, rotationY }) => {
  const group = useRef();
  
  // Animação de respiração leve
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = rotationY; // Gira com o dedo
    group.current.position.y = Math.sin(t * 1) * 0.1 - 1; // Flutua/Respira
  });

  const skin = config?.skin || '#f1c40f'; // Amarelo clássico
  const shirt = config?.shirt || '#3498db'; // Azul
  const pants = config?.pants || '#2ecc71'; // Verde

  return (
    <group ref={group}>
      {/* CABEÇA (1x1x1) */}
      <BodyPart position={[0, 2.5, 0]} args={[1, 1, 1]} color={skin} />
      
      {/* TRONCO (2x2x1) */}
      <BodyPart position={[0, 1, 0]} args={[2, 2, 1]} color={shirt} />

      {/* BRAÇO ESQ (1x2x1) */}
      <BodyPart position={[-1.5, 1, 0]} args={[1, 2, 1]} color={shirt} />
      
      {/* BRAÇO DIR (1x2x1) */}
      <BodyPart position={[1.5, 1, 0]} args={[1, 2, 1]} color={shirt} />
      
      {/* PERNA ESQ (1x2x1) */}
      <BodyPart position={[-0.5, -1, 0]} args={[1, 2, 1]} color={pants} />
      
      {/* PERNA DIR (1x2x1) */}
      <BodyPart position={[0.5, -1, 0]} args={[1, 2, 1]} color={pants} />
    </group>
  );
};

export default function Avatar3D({ navigation }) {
  const [config, setConfig] = useState({ skin: '#f1c40f', shirt: '#3498db', pants: '#2ecc71' });
  const [tab, setTab] = useState('skin'); // skin, shirt, pants
  const [rotation, setRotation] = useState(0);

  // Carregar do Banco
  useEffect(() => {
    supabase.auth.getUser().then(async ({data:{user}}) => {
        if(!user) return;
        const { data } = await supabase.from('avatars').select('*').eq('user_id', user.id).single();
        if(data) setConfig({ skin: data.skin_color || '#f1c40f', shirt: data.shirt || '#3498db', pants: data.hair || '#2ecc71' });
        // (Nota: Usamos 'hair' no banco para pernas aqui pra não mudar SQL agora)
    });
  }, []);

  const save = async () => {
     const { data: { user } } = await supabase.auth.getUser();
     await supabase.from('avatars').upsert({ 
         user_id: user.id, 
         skin_color: config.skin,
         shirt: config.shirt, 
         hair: config.pants // Salvando cor da calça no campo 'hair'
     });
     navigation.goBack();
  };

  const changeColor = (c) => {
      if(tab === 'skin') setConfig({...config, skin: c});
      if(tab === 'shirt') setConfig({...config, shirt: c});
      if(tab === 'pants') setConfig({...config, pants: c});
  };

  const COLORS = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#34495e', '#ecf0f1', '#111'];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* CANVAS 3D */}
      <View style={{ flex: 2, backgroundColor: 'radial-gradient(circle, #222 0%, #000 100%)' }}>
          <Canvas camera={{ position: [0, 1, 6] }}>
             <ambientLight intensity={0.5} />
             <directionalLight position={[10, 10, 5]} intensity={1} />
             <BlockyCharacter config={config} rotationY={rotation} />
          </Canvas>
          
          {/* Botões de Rotação Manual */}
          <View style={{position:'absolute', top: 50, left:20, right:20, flexDirection:'row', justifyContent:'space-between'}}>
             <TouchableOpacity onPress={()=>navigation.goBack()}><Ionicons name="close" size={30} color="white"/></TouchableOpacity>
             <TouchableOpacity onPress={()=>setRotation(r => r + 0.5)}><Ionicons name="refresh" size={30} color="white"/></TouchableOpacity>
          </View>
      </View>

      {/* CONTROLES */}
      <View style={styles.controls}>
         <View style={styles.tabs}>
             <TouchableOpacity onPress={()=>setTab('skin')} style={[styles.tab, tab==='skin' && styles.active]}><Text style={styles.txt}>PELE</Text></TouchableOpacity>
             <TouchableOpacity onPress={()=>setTab('shirt')} style={[styles.tab, tab==='shirt' && styles.active]}><Text style={styles.txt}>CAMISA</Text></TouchableOpacity>
             <TouchableOpacity onPress={()=>setTab('pants')} style={[styles.tab, tab==='pants' && styles.active]}><Text style={styles.txt}>CALÇA</Text></TouchableOpacity>
         </View>
         
         <View style={styles.colors}>
             {COLORS.map(c => (
                 <TouchableOpacity key={c} onPress={()=>changeColor(c)} style={[styles.colorBall, {backgroundColor:c}, (config[tab]===c) && {borderColor:'white', borderWidth:2}]} />
             ))}
         </View>

         <TouchableOpacity style={styles.saveBtn} onPress={save}>
             <Text style={styles.saveText}>SALVAR AVATAR</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { flex: 1, backgroundColor: '#111', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  tab: { paddingBottom: 5, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  active: { borderBottomColor: '#00ff9d' },
  txt: { color: 'white', fontWeight: 'bold' },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'center' },
  colorBall: { width: 50, height: 50, borderRadius: 25 },
  saveBtn: { backgroundColor: '#00ff9d', padding: 15, borderRadius: 10, marginTop: 'auto', alignItems: 'center' },
  saveText: { color: 'black', fontWeight: 'bold', fontSize: 16 }
});
