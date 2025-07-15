import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

import './styles/Login.css'

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

  return (
    <>
        
        <div className="login-container">
            <div className="login-header">
                <h2>V!be</h2>
                <p>V!be is a chat app where every message is a GIF — no text allowed. 
                  It turns conversations into a creative game of wit and timing, where picking the perfect animation is the key to getting your message across. 
                  Ready to speak a whole new language? V!be is your playground.</p>
                <img className="login-gif" src="https://tenor.com/view/talk-with-gifs-gif-20291278.gif" alt="only GIFs" />
            </div>
            <h2></h2>
            <form onSubmit={handleLogin}>
                <input className="login-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input className="login-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button className="login-button" type="submit">Log In</button>
                <button className="create-account-button" type="createAccount">Create new account</button>
                {error && <p style={{ color: "red" }}>{error}</p>}
            </form>
        </div>
    </>
  )
}