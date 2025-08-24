import { React, useEffect, useRef, useState, useContext} from "react";
import { account, databases } from "../appwrite";
import { Query, Permission, Role } from "appwrite";
import { StyleSheet, Text, View, TextInput, Image, ScrollView, Button, Pressable, SafeAreaView, StatusBar, Modal, FlatList, TouchableOpacity } from 'react-native';
import { FontAwesome } from "@expo/vector-icons";
import { ThemeContext } from '../context/ThemeContext';
import { LIGHT_COLORS, DARK_COLORS } from '../constants/colors.js';
import * as Animatable from 'react-native-animatable'

const AnimatablePressable = Animatable.createAnimatableComponent(Pressable)

Animatable.initializeRegistryWithDefinitions({
  strongPulse: {
    0: { scale: 1 },
    0.5: { scale: 1.3 },
    1: { scale: 1 }
  },
});

export default function Menu({ navigation, route }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const COLORS = theme === 'light' ? LIGHT_COLORS : DARK_COLORS;
  const styles = createStyles(COLORS);

  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editChatroom, setEditChatroom] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, chatroom: null, x: 0, y: 0 });

  const openCreateModal = () => {
    setEditMode(false);
    setEditChatroom(null);
    setModalVisible(true);
  };

  const openEditModal = (chatroom) => {
    setEditMode(true);
    setEditChatroom(chatroom);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditMode(false);
    setEditChatroom(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={COLORS.backgroundMain} />
      <Animatable.View style={styles.mainLayout} animation="fadeIn">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat Rooms</Text>
          <AnimatedButton style={styles.addButton} onPressAfterAnimation={openCreateModal}>
            <Text style={styles.addButtonText}>+</Text>
          </AnimatedButton>
        </View>
        <ChatroomList
          COLORS={COLORS}
          styles={styles}
          navigation={navigation}
          onLongPressChatroom={(chatroom, x, y) => setContextMenu({ visible: true, chatroom, x, y })}
        />
        <View style={styles.footer}>
          <View style={{display: 'flex', flexDirection: 'row', gap: 10}}>
            <AnimatedButton style={styles.footerButtonAccent} onPressAfterAnimation={() => navigation.navigate('Settings')}>
              <Text style={styles.footerTextAccent}><FontAwesome name="gear" size={24} color={COLORS.textOnAccentBlue} /></Text>
            </AnimatedButton>
            <AnimatedButton style={styles.footerButtonAccent} onPressAfterAnimation={async () => {
              const user = await account.get();
              navigation.navigate('Profile', { userId: user.$id });
            }}>
              <Text style={styles.footerTextAccent}><FontAwesome name="user" size={24} color={COLORS.textOnAccentBlue} /></Text>
            </AnimatedButton>
          </View>
          
          <LogoutButton COLORS={COLORS} styles={styles} checkSession={route.params.checkSession} />
        </View>
      </Animatable.View>
      <CreateChatModal
        COLORS={COLORS}
        styles={styles}
        visible={modalVisible}
        onClose={closeModal}
        editMode={editMode}
        chatroom={editChatroom}
        navigation={navigation}
      />
      <ContextMenu
        COLORS={COLORS}
        styles={styles}
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu({ ...contextMenu, visible: false })}
        onSettings={() => {
          setContextMenu({ ...contextMenu, visible: false });
          openEditModal(contextMenu.chatroom);
        }}
        onDelete={async () => {
          try {
            await databases.deleteDocument(
              "main",
              "chatrooms",
              contextMenu.chatroom.$id
            );
            setContextMenu({ ...contextMenu, visible: false });
          } catch (error) {
            console.error("Error deleting chatroom:", error);
            setContextMenu({ ...contextMenu, visible: false });
          }
        }}
      />
    </SafeAreaView>
  );
}

function AnimatedButton({ animationType='strongPulse', duration=300, onPressAfterAnimation, children, style }) {
  const ref = useRef(null);

  const handlePress = () => {
    if (ref.current) {
      ref.current.animate(animationType, duration).then(() => {
        if (onPressAfterAnimation) onPressAfterAnimation();
      });
    }
  };

  return (
    <AnimatablePressable ref={ref} style={style} onPress={handlePress}>
      {children}
    </AnimatablePressable>
  );
}

function LogoutButton({ COLORS, styles, navigation, checkSession }) {
  const handleLogout = async () => {
    try {
      const user = await account.get();
      // await databases.updateDocument(
      //   "main",
      //   "users",
      //   user.$id,
      //   { lastActive: new Date().toISOString() }
      // );
      await account.deleteSession("current");
      // navigation.navigate('Login');
      checkSession();
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  return <AnimatedButton style={styles.footerButton} onPressAfterAnimation={handleLogout}>
    <Text style={styles.footerText}>Log out</Text>
  </AnimatedButton>;
}

function ChatroomList({ COLORS, styles, navigation, onLongPressChatroom }) {
  const [chatrooms, setChatrooms] = useState([]);
  const [usernames, setUsernames] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchRooms() {
      try {
        const user = await account.get();
        setCurrentUserId(user.$id);
        const response = await databases.listDocuments(
          "main",
          "chatrooms",
          [
            Query.contains("participants", user.$id)
          ]
        );
        if (!isMounted) return;
        const rooms = response.documents;
        setChatrooms(rooms);
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
              try {
                const userDoc = await databases.getDocument(
                  "main",
                  "users",
                  userId
                );
                newUsernames[userId] = userDoc.displayName || "Unknown User";
              } catch {
                newUsernames[userId] = "Unknown User";
              }
            }
          })
        );
        setUsernames(newUsernames);
      } catch (error) {
        console.error("Error fetching chatrooms:", error);
      }
    }
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handlePress = (chatroom) => {
    navigation.navigate('ChatRoom', {
      chatroomId: chatroom.$id,
      chatroomName: chatroom.chatName,
      chatroomParticipants: chatroom.participants.filter(id => id !== currentUserId)
        .map(id => usernames[id] || "Loading...").join(', ')
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
            key={room.$id} 
            style={styles.chatroomCard}
            onPress={() => handlePress(room)}
            onLongPress={e => {
              const x = e.nativeEvent.pageX;
              const y = e.nativeEvent.pageY;
              onLongPressChatroom({ ...room, usernames }, x, y);
            }}
          >
            <Text style={styles.chatName}>{room.chatName || "Unnamed Chat"}</Text>
            <Text style={styles.participants}>
              {room.participants
                .filter(id => id !== currentUserId)
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

function ContextMenu({ COLORS, styles, visible, x, y, onClose, onSettings, onDelete }) {
  if (!visible) return null;
  return (
    <Pressable style={styles.contextMenuOverlay} onPress={onClose}>
      <View style={[styles.contextMenu, { top: y, left: x }]}>
        <Pressable style={styles.contextMenuItem} onPress={onSettings}>
          <Text style={styles.contextMenuText}>Settings</Text>
        </Pressable>
        <Pressable style={styles.contextMenuItem} onPress={onDelete}>
          <Text style={[styles.contextMenuText, { color: COLORS.error }]}>Delete</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}


function CreateChatModal({ COLORS, styles, visible, onClose, editMode, chatroom, navigation }) {
  const [chatName, setChatName] = useState('');
  const [participantQuery, setParticipantQuery] = useState('');
  const [possibleParticipants, setPossibleParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  // Pre-fill for edit mode
  useEffect(() => {
    if (editMode && chatroom) {
      setChatName(chatroom.chatName || '');
      setSelectedParticipants(
        chatroom.participants
          .filter(id => id !== chatroom.createdBy)
          .map(id => ({ id, displayName: chatroom.usernames?.[id] || "Unknown User" }))
      );
    } else if (!visible) {
      setChatName('');
      setSelectedParticipants([]);
    }
  }, [editMode, chatroom, visible]);

  useEffect(() => {
    let isMounted = true;
    async function fetchUsers() {
      try {
        const currentUser = await account.get();
        const response = await databases.listDocuments(
          "main",
          "users",
          [
            Query.startsWith("displayName", participantQuery)
          ]
        );
        if (!isMounted) return;
        const displayNames = response.documents
          .filter(doc => doc.$id !== currentUser.$id)
          .map(doc => ({
            id: doc.$id,
            ...doc
          }));
        setPossibleParticipants(displayNames);
        console.log("Fetched participants:", participantQuery, displayNames);
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    }
    fetchUsers();
    return () => { isMounted = false; };
  }, [participantQuery]);

  // Filter participants by query
  const filteredParticipants = possibleParticipants.filter(
    user =>
      user.displayName.toLowerCase().includes(participantQuery.toLowerCase()) &&
      !selectedParticipants.some(sel => sel.id === user.id)
  );

  const handleSelectParticipant = (user) => {
    if (!selectedParticipants.some(u => u.id === user.id)) {
      setSelectedParticipants([...selectedParticipants, user]);
    }
  };

  const handleRemoveParticipant = (user) => {
    setSelectedParticipants(selectedParticipants.filter(u => u.id !== user.id));
  };

  async function handleCreateOrUpdate() {
    try {
      const user = await account.get();
      const userIds = [user.$id, ...selectedParticipants.map(u => u.id)];
      const permissions = [
        ...userIds.map(id => Permission.read(Role.user(id))),
        ...userIds.map(id => Permission.write(Role.user(id))),
        ...userIds.map(id => Permission.update(Role.user(id))),
        ...userIds.map(id => Permission.delete(Role.user(id)))
      ];
      console.log("participants:", userIds);
      if (editMode && chatroom) {
        // Update chatroom
        const chatRoomData = {
          chatName: chatName || "Unnamed Chat",
          participants: userIds
        };
        await databases.updateDocument(
          "main",
          "chatrooms",
          chatroom.$id,
          chatRoomData,
          permissions
        );
        console.log("Chat room updated successfully");
      } else {
        // Create chatroom
        const chatRoomData = {
          chatName: chatName || "Unnamed Chat",
          participants: userIds,
          createdAt: new Date().toISOString(),
          createdBy: user.$id
        };
        await databases.createDocument(
          "main",
          "chatrooms",
          "unique()",
          chatRoomData,
          // permissions
        );
        console.log("Chat room created successfully");
      }
    } catch (error) {
      console.error("Error creating/updating chat room:", error);
    }
    onClose();
    setChatName('');
    setParticipantQuery('');
    setSelectedParticipants([]);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{editMode ? "Edit Chat Room" : "Create New Chat Room"}</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Chat Room Name"
            placeholderTextColor={COLORS.textMuted}
            value={chatName}
            onChangeText={setChatName}
          />
          <Text style={styles.modalLabel}>Participants</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Search users..."
            placeholderTextColor={COLORS.textMuted}
            value={participantQuery}
            onChangeText={setParticipantQuery}
          />
          <View style={styles.selectedParticipantsRow}>
            {selectedParticipants.map(user => (
              <TouchableOpacity
                key={user.id}
                style={styles.selectedParticipant}
                onPress={() => handleRemoveParticipant(user)}
                onLongPress={ () => {navigation.navigate('Profile', {userId: user.id}); onClose()} }
              >
                <Text style={styles.selectedParticipantText}>{user.displayName} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={filteredParticipants}
            keyExtractor={item => item.id}
            style={styles.participantList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.participantItem}
                onPress={() => handleSelectParticipant(item)}
                onLongPress={ () => {navigation.navigate('Profile', {userId: item.id}); onClose()} }
              >
                <Text style={styles.participantNameModal}>{item.displayName}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.noParticipantsText}>No users found</Text>
            }
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.modalButtonCancel} onPress={onClose}>
              <Text style={styles.modalButtonTextCancel}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.modalButtonCreate,
                (!chatName || selectedParticipants.length === 0) && { opacity: 0.5 }
              ]}
              onPress={handleCreateOrUpdate}
              disabled={!chatName || selectedParticipants.length === 0}
            >
              <Text style={styles.modalButtonTextCreate}>{editMode ? "Update" : "Create"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
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
    color: COLORS.textOnAccent,
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
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.border,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textMain,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: COLORS.backgroundAlt,
    color: COLORS.textMain,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  modalLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 4,
    marginTop: 4,
  },
  selectedParticipantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6,
  },
  selectedParticipant: {
    backgroundColor: COLORS.accentBlue,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  selectedParticipantText: {
    color: COLORS.textMain,
    fontWeight: 'bold',
    fontSize: 14,
  },
  participantList: {
    maxHeight: 120,
    marginBottom: 12,
  },
  participantItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  participantNameModal: {
    color: COLORS.textMain,
    fontSize: 16,
  },
  noParticipantsText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButtonCancel: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundAlt,
    marginRight: 8,
  },
  modalButtonTextCancel: {
    color: COLORS.textMuted,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalButtonCreate: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: COLORS.accentBlue,
  },
  modalButtonTextCreate: {
    color: COLORS.textMain,
    fontWeight: 'bold',
    fontSize: 16,
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
  footer: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundAlt,
  },
  footerText: {
    color: COLORS.textOnAccent,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  footerTextAccent: {
    color: COLORS.textOnAccentBlue,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  footerButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerButtonAccent: {
    backgroundColor: COLORS.accentBlue,
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
});