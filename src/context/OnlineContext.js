import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AppState } from 'react-native';

export const OnlineContext = createContext();

export function OnlineProvider({ children }) {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    let channel;

    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setMyId(user.id);

      // Canal ÚNICO Global
      channel = supabase.channel('online_users_room')
        .on('presence', { event: 'sync' }, () => {
           const newState = channel.presenceState();
           const ids = new Set();
           // O Supabase retorna objetos complexos, precisamos extrair os IDs
           for(const key in newState){
               newState[key].forEach(u => ids.add(u.user_id));
           }
           setOnlineUsers(ids);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                newPresences.forEach(p => next.add(p.user_id));
                return next;
            });
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                leftPresences.forEach(p => next.delete(p.user_id));
                return next;
            });
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
          }
        });
    };

    setupPresence();

    // Lida com o App em Segundo Plano (Opcional, para economizar bateria e mostrar offline)
    const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active' && channel) {
             channel.track({ user_id: myId, online_at: new Date().toISOString() });
        } else if(channel) {
             channel.untrack(); // Sai da lista ao fechar app
        }
    });

    return () => {
        if(channel) supabase.removeChannel(channel);
        subscription.remove();
    };
  }, []);

  const isUserOnline = (userId) => {
      if(!userId) return false;
      return onlineUsers.has(userId);
  };

  return (
    <OnlineContext.Provider value={{ isUserOnline }}>
      {children}
    </OnlineContext.Provider>
  );
}
