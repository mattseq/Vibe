import { React, useEffect, useState} from "react";
import { signOut } from "firebase/auth";
import { doc, updateDoc, serverTimestamp, collection, query, where, onSnapshot  } from "firebase/firestore";
import { auth, db } from "./firebase";
import { motion, scale } from "framer-motion";

import './styles/Index.css';

export default function Index() {
  const [currentRoomId, setCurrentRoomId] = useState(null);

  return (
    <div className="index-container">
      {/* <h1>Welcome to V!be — Main Page</h1> */}
      <div className="chat-list">
        <h2>Chat Rooms</h2>
        {/* Here you can map through your chat list and display them */}
        <ChatroomList onSelect={setCurrentRoomId} />
        <LogoutButton />
      </div>
      <div className="chat-window">
        {/* This is where the chat messages will be displayed */}
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

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "chatRooms"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const rooms = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChatrooms(rooms);
      console.log("Fetched rooms:", rooms);
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
          <p>Participants: {room.participants?.length || 0}</p>
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

      // You can also redirect to login page here if you want
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return <button className="logout-button" onClick={handleLogout}>Log Out</button>;
}