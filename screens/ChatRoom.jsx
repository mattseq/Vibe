import { React, useEffect, useRef, useState} from "react";
import { StyleSheet, Text, View, TextInput, Image, ScrollView, Button, Pressable, SafeAreaView, StatusBar } from 'react-native';

export default function ChatRoom({ route }) {
  const { chatroomId, chatroomName } = route.params;

  return (
    <View>
      <Text>Welcome to {chatroomName}</Text>
      <Text>Chatroom ID: {chatroomId}</Text>
    </View>
  );
}