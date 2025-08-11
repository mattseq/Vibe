import { React, useEffect, useRef, useState, useContext } from "react";
import { StyleSheet, Text, View, TextInput, Image, ScrollView, Button, Pressable, SafeAreaView, StatusBar, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot, orderBy, addDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import Constants from 'expo-constants';

import { ThemeContext } from '../context/ThemeContext';
import { LIGHT_COLORS, DARK_COLORS } from '../constants/colors.js';

import * as Animatable from 'react-native-animatable'

import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
  withSpring,
  useAnimatedReaction,
  runOnJS
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';

export default function ChatRoom({ route, navigation }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const COLORS = theme === 'light' ? LIGHT_COLORS : DARK_COLORS;
  const styles = createStyles(COLORS);

  const { chatroomId, chatroomName, chatroomParticipants } = route.params;

  const [contextMenu, setContextMenu] = useState({ visible: false, message: null, x: 0, y: 0 });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
      <Animatable.View style={styles.header} animation="fadeIn">
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{chatroomName}</Text>
      </Animatable.View>
      <Animatable.View style={styles.roomInfo} animation="fadeIn">
        <Text style={styles.roomIdText}><Text style={{fontWeight: 'bold'}}>Members: </Text>{chatroomParticipants}</Text>
      </Animatable.View>
      <Animatable.View style={styles.messagesContainer} animation="fadeIn">
        <ChatMessages COLORS={COLORS} styles={styles} roomId={chatroomId} onLongPressMessage={(message, x, y) => setContextMenu({ visible: true, message, x, y })} />
      </Animatable.View>
      <Animatable.View style={styles.gifsContainer} animation="fadeIn">
        <Gifs COLORS={COLORS} styles={styles} currentRoomId={chatroomId} />
      </Animatable.View>
      <ContextMenu
        COLORS={COLORS}
        styles={styles}
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu({ ...contextMenu, visible: false })}
        onViewSenderProfile={() => navigation.navigate('Profile', { userId: contextMenu.message.senderId })}
        onDelete={() => {
          if (contextMenu.message.senderId == auth.currentUser.uid) {
            deleteDoc(doc(db, "chatRooms", chatroomId, "messages", contextMenu.message.id))
            setContextMenu({ ...contextMenu, visible: false });
          } else {
            Alert.alert("... shall make no law ... abridging the freedom of speech ...")
            setContextMenu({ ...contextMenu, visible: false });
          }
        }}
      />
    </SafeAreaView>
  );
}

function ChatMessages({ COLORS, styles, roomId, onLongPressMessage }) {
  const [messages, setMessages] = useState([]);
  const [names, setNames] = useState({});
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    let unsubscribe;
    try {
      const q = query(
        collection(db, "chatRooms", roomId, "messages"),
        orderBy("timestamp")
      );

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const msgs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(msgs);

        // Get all unique senderIds
        const senderIds = [...new Set(msgs.map(m => m.senderId).filter(Boolean))];
        // Fetch display names
        getDisplayNames(senderIds).then(setNames);
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  if (!roomId) {
    return (
      <View style={styles.noRoomSelected}>
        <Text>Select a chat room to see messages</Text>
      </View>
    )
  }

  const currentUserId = auth.currentUser?.uid;

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 10 }}
      renderItem={({ item }) => (
        <Pressable style={[
          styles.messageItem,
          item.senderId === currentUserId ? styles.mine : styles.theirs
        ]}
          onLongPress={e => {
            const x = e.nativeEvent.pageX;
            const y = e.nativeEvent.pageY;
            onLongPressMessage({ ...item }, x, y);
          }}
        >
          <Text style={styles.senderName}>{names[item.senderId] || "Unknown User"}</Text>
          {item.gifUrl ? (
            <Image source={{ uri: item.gifUrl }} style={styles.gifMessage} />
          ) : null}
        </Pressable>
      )}
    />
  );
}

async function getDisplayNames(userIds) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  const results = {};

  await Promise.all(
    ids.map(async (userId) => {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        results[userId] = userSnap.exists()
          ? userSnap.data().displayName
          : "Unknown User";
      } catch {
        results[userId] = "Unknown User";
      }
    })
  );

  return results;
}

function ContextMenu({ COLORS, styles, visible, x, y, onClose, onViewSenderProfile, onDelete }) {
  if (!visible) return null;
  return (
    <Pressable style={styles.contextMenuOverlay} onPress={onClose}>
      <View style={[styles.contextMenu, { top: y, left: x }]}>
        <Pressable style={styles.contextMenuItem} onPress={onViewSenderProfile}>
          <Text style={styles.contextMenuText}>View Sender Profile</Text>
        </Pressable>
        <Pressable style={styles.contextMenuItem} onPress={onDelete}>
          <Text style={[styles.contextMenuText, { color: COLORS.error }]}>Delete</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function Gifs({ COLORS, styles, currentRoomId }) {
  const [gifs, setGifs] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const API_KEY = Constants.expoConfig.extra.klipy.apiKey;
  const BASE = 'https://api.klipy.com/api/v1';
  const customer_id = auth.currentUser?.uid;

  async function fetchGifs(searchQuery = '', nextPage = 1, append = false) {
    const user = auth.currentUser;
    if (!user) return;

    userDocRef = doc(db, "users", user.uid);
    let contentFilter = 'off';

    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        contentFilter = data.contentFilter || 'off';
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
    }

    setLoading(true);
    const endpoint = searchQuery
      ? `${BASE}/${API_KEY}/gifs/search?q=${encodeURIComponent(searchQuery)}&customer_id=${customer_id}&content_filter=${contentFilter}&per_page=50&page=${nextPage}`
      : `${BASE}/${API_KEY}/gifs/trending?per_page=50`;

    try {
      const response = await fetch(endpoint);
      console.log("Fetching GIFs from:", endpoint);
      const result = await response.json();

      if(result.result && result.data?.data){
        if (searchQuery) {
          setGifs(prev => append ? [...prev, ...result.data.data] : result.data.data);
          setHasMore(result.data.data.length > 0);
        } else {
          setGifs(result.data.data);
          setHasMore(false);
        }
      } else {
        if (!append) setGifs([]);
        setHasMore(false);
      }
    } catch (error) {
      if (!append) setGifs([]);
      setHasMore(false);
      console.error('Error fetching gifs:', error);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchGifs();
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchGifs(query, 1, false);
  };

  const handleLoadMore = () => {
    if (query && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchGifs(query, nextPage, true);
    }
  };

  async function handleSendGif(gif) {
    const gifUrl = gif.file.sm.gif.url;
    const user = auth.currentUser;

    if (!user) {
      console.error("User not authenticated")
      return;
    }

    try {
      await addDoc(collection(db, 'chatRooms', currentRoomId, 'messages'), {
        senderId: user.uid,
        gifUrl: gifUrl,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending GIF message")
    }
  }

  // y value for swipe detection
  const translateY = useSharedValue(0);

  // gesture to detect swipe
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // clamp translation so it never goes positive or below -200
      translateY.value = Math.max(-200, Math.min(0, event.translationY + translateY.value));
    })
    .onEnd(() => {
      if (translateY.value < -100) {
        translateY.value = withSpring(-200, { stiffness: 150, damping: 20 });
      }
      if (translateY.value > 100) {
        translateY.value = withTiming(0, { duration: 350 });
      }
    }
  );

  // animated style for height expansion based on translateY
  const animatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      translateY.value,
      [-200, 0],
      [400, 200],
      Extrapolate.CLAMP
    );
    return { height };
  });

  const [expanded, setExpanded] = useState(false);

  useAnimatedReaction(
    () => translateY.value,
    (value) => {
      const isNowExpanded = value <= -180;
      runOnJS(setExpanded)(isNowExpanded);
    },
    [translateY]
  );

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.gifSection, animatedStyle]}>
        <Text style={styles.gifSectionTitle}>Klipy GIFs</Text>
        <View style={styles.gifSearchRow}>
          <TextInput
            style={styles.gifSearchInput}
            value={query}
            placeholder="Search GIFs..."
            placeholderTextColor={COLORS.textMuted}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.gifSearchButton} onPress={handleSearch}>
            <Text style={styles.gifSearchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 10 }} />
        ) : (
          <FlatList
            data={gifs}
            key={expanded ? 'expanded' : 'collapsed'}
            keyExtractor={item => item.id}
            numColumns={expanded ? 4 : 1}
            horizontal={!expanded}
            showsVerticalScrollIndicator={expanded}
            showsHorizontalScrollIndicator={!expanded}
            contentContainerStyle={expanded ? styles.gifGridExpanded : styles.gifGrid}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gifItem}
                onPress={() => handleSendGif(item)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: item.file.sm.gif.url }}
                  style={styles.gifImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          />
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundMain,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundAlt,
  },
  backButtonText: {
    color: COLORS.accentBlue,
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerTitle: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  roomInfo: {
    backgroundColor: COLORS.backgroundAlt,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  roomIdText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  gifsContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.backgroundCard,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  noRoomSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageItem: {
    marginVertical: 8,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.accent,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentBlue,
  },
  senderName: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: COLORS.textMain,
  },
  gifMessage: {
    width: 180,
    height: 180,
    resizeMode: 'cover',
    borderRadius: 10,
    marginTop: 2,
  },
  gifSection: {
    marginTop: 0,
    paddingHorizontal: 10,
  },
  gifSectionTitle: {
    color: COLORS.textMain,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
  },
  gifSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gifSearchInput: {
    flex: 1,
    backgroundColor: COLORS.backgroundAlt,
    color: COLORS.textMain,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  gifSearchButton: {
    backgroundColor: COLORS.accentBlue,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  gifSearchButtonText: {
    color: COLORS.textOnAccentBlue,
    fontWeight: 'bold',
    fontSize: 15,
  },
  gifGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  gifItem: {
    marginRight: 10,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundAlt,
  },
  gifImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  contextMenuOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 100,
  },
  contextMenu: {
    position: 'absolute',
    left: 40,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 10,
    paddingVertical: 4,
    width: 140,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  contextMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  contextMenuText: {
    color: COLORS.textMain,
    fontSize: 16,
  },
});
