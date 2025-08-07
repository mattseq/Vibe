import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { StyleSheet, Text, View, TextInput, Image, ScrollView, Button, Pressable } from 'react-native';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignUp = async () => {
  setError("");

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create Firestore user document
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName: "Noob",
      bio: "",
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp()
    });

    console.log("Account created and Firestore profile added.");
  } catch (err) {
    setError(err.message);
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>V!be</Text>
      <Text style={styles.description}>
        V!be is a chat app where every message is a GIF — no text allowed.
        It turns conversations into a creative game of wit and timing.
      </Text>
      <Image
        source={{ uri: "https://tenor.com/view/talk-with-gifs-gif-20291278.gif" }}
        style={styles.image}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Create new account</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const COLORS = {
  backgroundMain: '#0F1419',
  backgroundCard: '#1A1F2E',
  backgroundAlt: '#252B3D',
  accent: '#FFD700',
  accentHover: '#FFED4E',
  accentBlue: '#4A9EFF',
  accentBlueHover: '#6BB3FF',
  accentLight: '#FFE55C',
  accentDark: '#E6C200',
  error: '#FF6B6B',
  textMain: '#FFFFFF',
  textMuted: '#B8C5D6',
  textLight: '#E8F4FD',
  border: '#2A3142',
  borderAccent: '#FFD700',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowHover: 'rgba(0, 0, 0, 0.5)',
  glow: 'rgba(255, 215, 0, 0.2)',
  glowBlue: 'rgba(74, 158, 255, 0.2)'
};

const styles = StyleSheet.create({

  container: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    backgroundColor: COLORS.backgroundMain,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
    color: COLORS.accent
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    color: COLORS.accentLight
  },
  image: {
    width: 300,
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
  },
  input: {
    width: "100%",
    padding: 12,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    color: COLORS.textMain
  },
  error: {
    color: "red",
    marginTop: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: COLORS.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10
  },
  buttonText: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: 'bold'
  }
});