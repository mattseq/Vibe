import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './firebase';
import Login from './screens/Login';
import Menu from './screens/Menu';
import ChatRoom from './screens/ChatRoom';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          // User is signed in
          <>
          <Stack.Screen
            name="Menu"
            component={Menu}
            options={{ title: 'Chat Rooms', headerShown: false }}
          />
          <Stack.Screen
            name="ChatRoom"
            component={ChatRoom}
            options={({ route }) => ({ title: `Chat: ${route.params.chatroomName}`, headerShown: false })}
          />
        </>
        ) : (
          // User is not signed in
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}