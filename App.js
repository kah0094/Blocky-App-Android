import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/services/supabase';
import { RealtimeProvider } from './src/context/RealtimeContext';
import { OnlineProvider } from './src/context/OnlineContext';

// Importando telas
import HomeScreen from './src/screens/HomeScreen';
import PostsScreen from './src/screens/PostsScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import CreateSelectionScreen from './src/screens/CreateSelectionScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import AuthScreen from './src/screens/AuthScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import ShopScreen from './src/screens/ShopScreen';
import Avatar3D from './src/screens/Avatar3D'; // <--- AQUI

import DebugFab from './src/components/DebugFab';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Empty = () => <View style={{flex:1, backgroundColor:'#000'}} />;

const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity style={{ top: -20, justifyContent: 'center', alignItems: 'center' }} onPress={onPress}>
    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#00ff9d', borderWidth: 4, borderColor: '#000', elevation: 5 }}>
      {children}
    </View>
  </TouchableOpacity>
);

function MobileTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#111', borderTopWidth: 0, height: 60, paddingBottom: 10 }, tabBarActiveTintColor: '#00ff9d', tabBarShowLabel: false }}>
      <Tab.Screen name="Início" component={HomeScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="game-controller" size={24} color={color} /> }} />
      <Tab.Screen name="Posts" component={PostsScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="images" size={24} color={color} /> }} />
      <Tab.Screen name="Criar" component={Empty} options={{ tabBarIcon: () => <Ionicons name="add" size={32} color="#000" />, tabBarButton: (props) => <CustomTabBarButton {...props} /> }} listeners={({ navigation }) => ({ tabPress: (e) => { e.preventDefault(); navigation.navigate('CreateSelection'); }, })} />
      <Tab.Screen name="Busca" component={SearchScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="search" size={24} color={color} /> }} />
      <Tab.Screen name="MeuPerfil" component={ProfileScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="person" size={24} color={color} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <View style={{flex:1, backgroundColor:'#000', justifyContent:'center'}}><ActivityIndicator size="large" color="#00ff9d"/></View>;

  return (
    <SafeAreaProvider>
      <OnlineProvider> 
        <RealtimeProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <Stack.Navigator screenOptions={{ headerShown: false, ...TransitionPresets.DefaultTransition }}>
              {!session ? ( <Stack.Screen name="Auth" component={AuthScreen} /> ) : (
                <Stack.Group>
                  <Stack.Screen name="Main" component={MobileTabs} />
                  <Stack.Screen name="PostDetail" component={PostDetailScreen} />
                  <Stack.Screen name="CreateSelection" component={CreateSelectionScreen} options={{ presentation: 'transparentModal' }} />
                  <Stack.Screen name="CreatePost" component={CreatePostScreen} />
                  <Stack.Screen name="Settings" component={SettingsScreen} />
                  <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                  <Stack.Screen name="Profile" component={ProfileScreen} />
                  <Stack.Screen name="Avatar3D" component={Avatar3D} /> {/* <--- NOVA ROTA */}
                  <Stack.Screen name="Notifications" component={NotificationsScreen} />
                  <Stack.Screen name="ChatList" component={ChatListScreen} />
                  <Stack.Screen name="Chat" component={ChatScreen} />
                  <Stack.Screen name="Loja" component={ShopScreen} />
                </Stack.Group>
              )}
            </Stack.Navigator>
            {session && <DebugFab />}
          </NavigationContainer>
        </RealtimeProvider>
      </OnlineProvider>
    </SafeAreaProvider>
  );
}
