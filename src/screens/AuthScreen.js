import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import CustomPopup from '../components/CustomPopup';
import { LinearGradient } from 'expo-linear-gradient';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  
  // Estado do Popup
  const [alert, setAlert] = useState({ visible: false, title: '', msg: '', type: 'info' });

  // TRADUTOR DE ERROS
  const handleError = (error) => {
    let msg = error.message;
    if (msg.includes("Invalid login credentials")) msg = "Email ou senha incorretos.";
    if (msg.includes("User already registered")) msg = "Este email já está em uso.";
    if (msg.includes("Password should be at least 6 characters")) msg = "A senha deve ter no mínimo 6 dígitos.";
    if (msg.includes("weak_password")) msg = "Senha muito fraca. Tente uma melhor.";
    
    setAlert({ visible: true, title: 'Ops!', msg: msg, type: 'error' });
  };

  const handleAuth = async () => {
    if (!email || !password) return handleError({message: "Preencha todos os campos."});
    if (!isLogin && !username) return handleError({message: "Digite seu nome de usuário."});

    setLoading(true);
    
    try {
      if (isLogin) {
        // Tentar Logar
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Verificar se foi banido
        const { data: profile } = await supabase.from('profiles').select('banned_until').eq('id', data.user.id).single();
        if (profile?.banned_until) {
            const banTime = new Date(profile.banned_until);
            if (banTime > new Date()) {
                await supabase.auth.signOut();
                throw new Error(`Conta banida até ${banTime.toLocaleString()}.`);
            }
        }
      } else {
        // Criar Conta
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // Salvar Username
        if (data?.user) {
            await supabase.from('profiles').update({ username: username }).eq('id', data.user.id);
        }
        setAlert({ visible: true, title: 'Sucesso!', msg: 'Conta criada. Bem-vindo!', type: 'info' });
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#000000', '#1a0033']} style={styles.container}>
      <View style={styles.card}>
        {/* LOGO */}
        <View style={styles.logoBox}>
            <Ionicons name="cube" size={50} color="#00ff9d" />
            <Text style={styles.brand}>BLOCKY</Text>
        </View>

        <Text style={styles.title}>{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</Text>

        {!isLogin && (
          <View style={styles.inputGroup}>
             <Ionicons name="person" size={20} color="#666" style={{marginRight:10}} />
             <TextInput 
                style={styles.input} 
                placeholder="Nome de Usuário" 
                placeholderTextColor="#666" 
                value={username} onChangeText={setUsername} autoCapitalize="none"
             />
          </View>
        )}

        <View style={styles.inputGroup}>
             <Ionicons name="mail" size={20} color="#666" style={{marginRight:10}} />
             <TextInput 
                style={styles.input} 
                placeholder="Email" 
                placeholderTextColor="#666" 
                value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
             />
        </View>

        <View style={styles.inputGroup}>
             <Ionicons name="lock-closed" size={20} color="#666" style={{marginRight:10}} />
             <TextInput 
                style={styles.input} 
                placeholder="Senha" 
                placeholderTextColor="#666" 
                secureTextEntry
                value={password} onChangeText={setPassword}
             />
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
            {loading ? <ActivityIndicator color="#000"/> : <Text style={styles.btnText}>{isLogin ? 'ENTRAR' : 'CADASTRAR'}</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
            <Text style={styles.textFoot}>{isLogin ? 'Não tem conta?' : 'Já possui conta?'}</Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                <Text style={styles.linkFoot}>{isLogin ? 'Criar nova' : 'Fazer login'}</Text>
            </TouchableOpacity>
        </View>
      </View>

      <CustomPopup 
        visible={alert.visible} 
        title={alert.title} 
        message={alert.msg} 
        type={alert.type}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#111', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: '#333', shadowColor:'#000', shadowOffset:{width:0, height:10}, shadowOpacity:0.5, shadowRadius:20 },
  logoBox: { alignItems:'center', marginBottom:20 },
  brand: { color:'#00ff9d', fontSize:22, fontWeight:'bold', letterSpacing:4, marginTop:5 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  
  inputGroup: { flexDirection:'row', alignItems:'center', backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, height: 50, borderWidth:1, borderColor:'#222' },
  input: { flex:1, color:'white', height:'100%' },
  
  btn: { backgroundColor: '#00ff9d', borderRadius: 10, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  btnText: { color: 'black', fontWeight: 'bold', fontSize: 16 },
  
  footer: { flexDirection:'row', justifyContent:'center', marginTop: 25, gap: 5 },
  textFoot: { color:'#888' },
  linkFoot: { color:'#00ff9d', fontWeight:'bold' }
});
