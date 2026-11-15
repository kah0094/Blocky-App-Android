import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../services/supabase';
import { colors, radii, shadows, spacing } from '../theme';

WebBrowser.maybeCompleteAuthSession();

const translateError = (error) => {
  const message = error?.message || 'Não foi possível concluir a operação.';
  if (message.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
  if (message.includes('User already registered')) return 'Este email já está cadastrado.';
  if (message.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (message.includes('Email not confirmed')) return 'Confirme seu email antes de entrar.';
  return message;
};

export default function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const isLogin = mode === 'login';

  const submit = async () => {
    setNotice(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password || (!isLogin && !username.trim())) {
      setNotice({ type: 'error', text: 'Preencha todos os campos para continuar.' });
      return;
    }

    setBusy(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
        const { data: profile } = await supabase.from('profiles').select('banned_until').eq('id', data.user.id).maybeSingle();
        if (profile?.banned_until && new Date(profile.banned_until) > new Date()) {
          await supabase.auth.signOut();
          throw new Error('Esta conta está temporariamente suspensa.');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password });
        if (error) throw error;
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').update({ username: username.trim() }).eq('id', data.user.id);
          if (profileError) throw profileError;
        }
        setNotice({ type: 'success', text: 'Conta criada. Confira seu email se a confirmação estiver ativada.' });
      }
    } catch (error) {
      setNotice({ type: 'error', text: translateError(error) });
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    setNotice(null);
    setBusy(true);
    try {
      const redirectTo = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('O login Google não retornou uma URL.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) return;

      const code = result.url.match(/[?&]code=([^&]+)/)?.[1];
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(decodeURIComponent(code));
        if (exchangeError) throw exchangeError;
      }
    } catch (error) {
      setNotice({ type: 'error', text: `${translateError(error)} Configure Google OAuth no Supabase se o provedor ainda estiver desligado.` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}><Ionicons name="sparkles" size={24} color={colors.white} /></View>
        <Text style={styles.kicker}>OPENBUILDER</Text>
        <Text style={styles.title}>{isLogin ? 'Seu espaço criativo.' : 'Crie seu espaço.'}</Text>
        <Text style={styles.subtitle}>{isLogin ? 'Entre para continuar criando e descobrindo.' : 'Junte-se à comunidade de criadores.'}</Text>

        <View style={styles.card}>
          {!isLogin && <Field icon="person-outline" placeholder="Nome de usuário" value={username} onChangeText={setUsername} />}
          <Field icon="mail-outline" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field icon="lock-closed-outline" placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />

          {!!notice && <Text style={[styles.notice, notice.type === 'success' ? styles.success : styles.error]}>{notice.text}</Text>}

          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color={colors.black} /> : <Text style={styles.primaryText}>{isLogin ? 'Entrar' : 'Criar conta'}</Text>}
          </Pressable>

          <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>ou</Text><View style={styles.line} /></View>

          <Pressable style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]} onPress={signInWithGoogle} disabled={busy}>
            <Text style={styles.googleG}>G</Text><Text style={styles.googleText}>Continuar com Google</Text>
          </Pressable>
        </View>

        <Pressable style={styles.switch} onPress={() => { setMode(isLogin ? 'signup' : 'login'); setNotice(null); }}>
          <Text style={styles.switchMuted}>{isLogin ? 'Ainda não tem conta? ' : 'Já tem uma conta? '}</Text>
          <Text style={styles.switchLink}>{isLogin ? 'Criar agora' : 'Entrar'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ icon, ...props }) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={19} color={colors.textDim} />
      <TextInput {...props} style={styles.input} placeholderTextColor={colors.textDim} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  brandMark: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  kicker: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 3 },
  title: { color: colors.text, fontSize: 34, lineHeight: 40, fontWeight: '800', marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  field: { flexDirection: 'row', alignItems: 'center', height: 54, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  input: { flex: 1, color: colors.text, fontSize: 15, marginLeft: spacing.sm },
  notice: { fontSize: 13, lineHeight: 19, marginVertical: spacing.sm },
  error: { color: colors.danger },
  success: { color: colors.success },
  primaryButton: { height: 54, borderRadius: radii.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.75 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { color: colors.textDim, fontSize: 12 },
  googleButton: { height: 52, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  googleG: { color: colors.white, fontSize: 20, fontWeight: '900' },
  googleText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  switch: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  switchMuted: { color: colors.textMuted },
  switchLink: { color: colors.accent, fontWeight: '800' },
});
