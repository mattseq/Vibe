import { React, useEffect, useRef, useState} from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot, orderBy, addDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { motion, scale } from "framer-motion";

import './styles/Index.css';

export default function Index() {
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [gifs, setGifs] = useState(false);

  return (
    <div className="index-container">
      <div className="sidebar">
        <div className="header" >
          <h2>Chat Rooms</h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >+</motion.button>
        </div>
        <ChatroomList onSelect={setCurrentRoomId} />
        <LogoutButton />
      </div>
      <div className="chat-window">
          <ChatMessages roomId={currentRoomId} />
          {currentRoomId && <Gifs currentRoomId={currentRoomId} />}
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
  const endOfMessagesRef = useRef(null);

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
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" })
  });

  if (!roomId) {
    return <div className="no-room-selected">Select a chat room to see messages</div>;
  }

  const currentUserId = auth.currentUser?.uid;

  return (
    <ol className="message-list">
      {messages.map((msg) => (
        <li key={msg.id} className={`message-item ${msg.senderId === currentUserId ? "mine" : "theirs"}`}>
          <strong>{names[msg.senderId] || "Unknown User"} </strong> <img className="gif-message" src={msg.gifUrl} />
        </li>
      ))}
      <div ref={endOfMessagesRef} />
    </ol>
  );
}

function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      
      updateDoc(doc(db, "users"), {
        lastActive: serverTimestamp()
      });

    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return <motion.button className="logout-button" onClick={handleLogout}
    initial={{ y: 0, scale: 1 }}
    whileHover={{ y: -5, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, bounce: 0.2 }}
  >
    Log Out
  </motion.button>;
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


function Gifs({ currentRoomId }) {
  const [gifs, setGifs] = useState([]);
  const [query, setQuery] = useState("");

  const API_KEY = import.meta.env.VITE_KLIPY_API_KEY;
  const BASE = 'https://api.klipy.com/api/v1';

  const customer_id = auth.currentUser?.uid;

  async function fetchGifs(searchQuery = '') {
    const endpoint = searchQuery
      ? `${BASE}/${API_KEY}/gifs/search?q=${encodeURIComponent(searchQuery)}&customer_id=${customer_id}`
      : `${BASE}/${API_KEY}/gifs/trending`;

    try {
      const response = await fetch(endpoint);
      const result = await response.json();

      if(result.result && result.data?.data){
        setGifs(result.data.data);
        console.log(result.data.data)
      } else {
        setGifs([]);
      }
    } catch (error) {
      console.error('Error fetching gifs:', error);
    }
  }

  useEffect(() => {
    fetchGifs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchGifs(query);
  };

  async function handleSendGif(gif) {
    const gifUrl = gif.file.md.gif.url;

    const user = auth.currentUser;

    if (!user) {
      console.error("User not authenticated")
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

  return (
    <motion.div
      className="gif-section"
      initial={{ y: 0 }}
      whileHover={{ y: -5 }}
    >
      <h1>Klipy GIFs</h1>
      <form onSubmit={handleSearch} className="gif-search-form">
        <input
          type="text"
          value={query}
          placeholder="Search GIFs..."
          onChange={(e) => setQuery(e.target.value)}
          className="gif-search-input"
        />
      </form>
      <div className="gif-grid">
        {gifs.map(gif => (
          <div key={gif.id} className="gif-item" onClick={() => handleSendGif(gif)}>
            <img
              src={gif.file.md.gif.url}
              alt={gif.title || 'GIF'}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
