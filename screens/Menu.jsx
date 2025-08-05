import { React, useEffect, useRef, useState} from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot, orderBy, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { StyleSheet, Text, View, TextInput, Image, ScrollView, Button, Pressable, SafeAreaView, StatusBar } from 'react-native';

export default function Menu({ navigation }) {

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundMain} />
      <View style={styles.mainLayout}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat Rooms</Text>
          <Pressable style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>
        <ChatroomList navigation={navigation} />
      </View>
    </SafeAreaView>
  );
}

function ChatroomList({ navigation }) {
  const [chatrooms, setChatrooms] = useState([]);
  const [usernames, setUsernames] = useState({});

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "chatRooms"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const rooms = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChatrooms(rooms);
      console.log("Fetched rooms:", rooms);
      
      // extract user IDs from all chatrooms
      const participantIds = new Set();
      rooms.forEach(room => {
        room.participants.forEach(id => participantIds.add(id));
      });

      // convert set to array
      const allUserIds = Array.from(participantIds);

      // fetch each user's displayName if not already loaded
      const newUsernames = { ...usernames };
      
      await Promise.all(
        allUserIds.map(async (userId) => {
          if (!newUsernames[userId]) {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            newUsernames[userId] = userSnap.exists()
              ? userSnap.data().displayName
              : "Unknown User";
          }
        })
      );

      setUsernames(newUsernames);
    });

    return () => unsubscribe();
  }, []);

  const handlePress = (chatroom) => {
    navigation.navigate('ChatRoom', {
      chatroomId: chatroom.id,
      chatroomName: chatroom.displayName,
    });
  };

  return (
    <ScrollView style={styles.chatroomList} showsVerticalScrollIndicator={false}>
      {chatrooms.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No chat rooms yet</Text>
          <Text style={styles.emptyStateSubtext}>Create a new chat room to get started</Text>
        </View>
      ) : (
        chatrooms.map(room => (
          <Pressable 
            key={room.id} 
            style={styles.chatroomCard}
            onPress={() => handlePress(room)}
          >
            <Text style={styles.chatName}>{room.chatName || "Unnamed Chat"}</Text>
            <Text style={styles.participants}>
              {room.participants
                .filter(id => id !== auth.currentUser.uid)
                .map((id, i, arr) => (
                  <Text key={id} style={styles.participantName}>
                    {usernames[id] || "Loading..."}
                    {i < arr.length - 1 ? ', ' : ''}
                  </Text>
                ))}
            </Text>
          </Pressable>
        ))
      )}
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
    flex: 1,
    backgroundColor: COLORS.backgroundMain,
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundAlt,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.backgroundMain,
  },
  chatWindow: {
    flex: 1,
    backgroundColor: COLORS.backgroundMain,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  chatroomList: {
    flex: 1,
    padding: 16,
  },
  chatroomCard: {
    padding: 16,
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 8,
  },
  participants: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  participantName: {
    color: COLORS.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  }
});