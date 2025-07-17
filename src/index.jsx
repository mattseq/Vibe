import { React, useEffect, useState} from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot  } from "firebase/firestore";
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
          <div className="messages">
            <ol className="message-list">
              <li>Message 1</li>
              <li>Message 2</li>
            </ol>
          </div>
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