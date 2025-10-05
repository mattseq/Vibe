import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { account } from './appwrite';
import Login from './screens/Login';
import Menu from './screens/Menu';
import ChatRoom from './screens/ChatRoom';
import Profile from './screens/Profile';
import Settings from './screens/Settings';
import { ThemeProvider } from './context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const user = await account.get();
      setUser(user && user.$id ? user : null);
    } catch (error) {
      console.log('No active session:', error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribed = false;
    checkSession();
    const interval = setInterval(() => {
      if (!unsubscribed) checkSession();
    }, 60000);
    return () => {
      unsubscribed = true;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator>
            {user ? (
              <>
                <Stack.Screen
                  name="Menu"
                  component={Menu}
                  initialParams={{ checkSession }}
                  options={{ title: 'Menu', headerShown: false }}
                />
                <Stack.Screen
                  name="Profile"
                  component={Profile}
                  options={({ route }) => ({ title: `Profile: ${route.params.userId}`, headerShown: false })}
                />
                <Stack.Screen
                  name="Settings"
                  component={Settings}
                  options={{ title: 'Settings', headerShown: false }}
                />
                <Stack.Screen
                  name="ChatRoom"
                  component={ChatRoom}
                  options={({ route }) => ({ title: `Chat: ${route.params.chatroomName}`, headerShown: false })}
                />
              </>
            ) : (
              <Stack.Screen
                name="Login"
                component={Login}
                initialParams={{ checkSession }}
                options={{ headerShown: false }}
              />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}