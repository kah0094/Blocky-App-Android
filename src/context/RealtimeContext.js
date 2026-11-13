import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import CustomPopup from '../components/CustomPopup';
import { Vibration } from 'react-native';

export const RealtimeContext = createContext();

export function RealtimeProvider({ children }) {
  const [session, setSession] = useState(null);
  
  // Estado Global do Popup de Sistema
  const [alert, setAlert] = useState({ visible: false, title: '', msg: '', type: 'info' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
        if(data.session) setupRealtime(data.session.user.id);
        setSession(data.session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if(session) setupRealtime(session.user.id);
    });
  }, []);

  const setupRealtime = (userId) => {
      const channel = supabase.channel('system-global')
        // 1. OUVINTE DE SEGURANÇA (BAN/KICK)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, 
        async (payload) => {
            if (payload.new.banned_until && new Date(payload.new.banned_until) > new Date()) {
                setAlert({ visible: true, title: "BANIDO", msg: "Você foi desconectado pelo Administrador.", type: 'error' });
                await supabase.auth.signOut();
            }
            if (payload.new.current_session_token && payload.new.current_session_token.startsWith('kick')) {
                setAlert({ visible: true, title: "EXPULSO", msg: "Sua sessão foi derrubada.", type: 'error' });
                await supabase.auth.signOut();
            }
        })
        // 2. OUVINTE DE ALERTA (POPUP DO ADM)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` }, 
        (payload) => {
            const notif = payload.new;
            if (notif.type === 'system_alert') {
                Vibration.vibrate(); // Vibra o celular
                setAlert({ visible: true, title: "MENSAGEM DO SISTEMA", msg: notif.content, type: 'info' });
                
                // Marca como lida para não aparecer no histórico depois se quiser
                supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
            }
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
  };

  return (
    <RealtimeContext.Provider value={{ session }}>
      {children}
      
      {/* POPUP GLOBAL DO SISTEMA (Aparece em cima de tudo) */}
      <CustomPopup 
         visible={alert.visible}
         title={alert.title}
         message={alert.msg}
         type={alert.type}
         onClose={() => setAlert({...alert, visible: false})}
      />
    </RealtimeContext.Provider>
  );
}
