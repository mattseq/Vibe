import { React, useEffect, useState} from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { auth, db } from "./firebase";
import { motion, scale } from "framer-motion";

import './styles/Index.css';

export default function Index() {
  const [currentRoomId, setCurrentRoomId] = useState(null);

  return (
    <div className="index-container">
      <div className="chat-list">
        <h2>Chat Rooms</h2>
        <ChatroomList onSelect={setCurrentRoomId} />
        <LogoutButton />
      </div>
      <div className="chat-window">
          <ChatMessages roomId={currentRoomId} />
          
          <div>{/* For the GIF selector */}</div>
      </div>
    </div>
  );
}

function ChatroomList({ onSelect }) {
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

      // fetch each user’s displayName if not already loaded
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

  return (
    <div className="chatroom-list">
      {chatrooms.map(room => (
        <motion.div
          key={room.id}
          className="chatroom-card"
          onClick={() => onSelect(room.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, bounce: 0.2 }}
        >
          <h3>{room.chatName || "Unnamed Chat"}</h3>
          <p>{room.participants
            .filter(id => id !== auth.currentUser.uid)
            .map((id, i) => (
              <span key={id}>
                {usernames[id] || "Loading..."}
                {i < room.participants.length - 2 ? ", " : ""}
              </span>
          ))}</p>
        </motion.div>
      ))}
    </div>
  );
}

function ChatMessages({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [names, setNames] = useState({});

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

  if (!roomId) {
    return <div className="no-room-selected">Select a chat room to see messages</div>;
  }

  return (
    <ol className="message-list">
      {messages.map((msg) => (
        <li key={msg.id}>
          <strong>{names[msg.senderId] || "Unknown"} </strong> <img className="gif-message" src={msg.gifUrl} />
        </li>
      ))}
    </ol>
  );
}

function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      
      updateDoc(doc(db, "users", auth.currentUser.uid), {
        lastActive: serverTimestamp()
      });

    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return <button className="logout-button" onClick={handleLogout}>Log Out</button>;
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