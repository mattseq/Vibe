import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";

import './styles/Index.css';

export default function Index() {
  return (
    <div className="index-container">
      {/* <h1>Welcome to V!be — Main Page</h1> */}
      <div className="chat-list">
        <h2>Chat List</h2>
        {/* Here you can map through your chat list and display them */}
        <ul>
          <li>Chat 1</li>
          <li>Chat 2</li>
          <li>Chat 3</li>
        </ul>
        <LogoutButton />
      </div>
      <div className="chat-window">
        <h2>Chat Window</h2>
        {/* This is where the chat messages will be displayed */}
        <div className="messages">
          <p>Message 1</p>
          <p>Message 2</p>
          <p>Message 3</p>
        </div>
        {/* Input for sending new messages */}
        <input type="text" placeholder="Type a message..." />
      </div>
    </div>
  );
}

function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // You can also redirect to login page here if you want
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return <button className="logout-button" onClick={handleLogout}>Log Out</button>;
}