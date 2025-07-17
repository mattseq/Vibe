import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { motion, spring } from "framer-motion";

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
  

  const handleSignUp = async () => {
  setError("");

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create Firestore user document
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName: "",          // Optional: ask for this later
      bio: "",
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp()
    });

    console.log("✅ Account created and Firestore profile added.");
  } catch (err) {
    setError(err.message);
  }
};

  return (
    <>
        
        <div className="login-container">
            <div className="login-header" >
                <motion.h2
                  initial={{ y: -100 }}
                  animate={{ y: 0 }}
                  transition={{ type: spring, stiffness: 100, bounce: 0.2, duration: 0.5 }}
                >V!be</motion.h2>
                <motion.p
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >V!be is a chat app where every message is a GIF — no text allowed. 
                  It turns conversations into a creative game of wit and timing, where picking the perfect animation is the key to getting your message across. 
                  Ready to speak a whole new language? V!be is your playground.</motion.p>
                <motion.img className="login-gif" src="https://tenor.com/view/talk-with-gifs-gif-20291278.gif" alt="only GIFs" 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                />
            </div>
            <motion.form 
              onSubmit={handleLogin}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{type: spring, stiffness: 200, bounce: 0.1, duration: 0.5, delay: 3.75 }}
            >
                <input className="login-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input className="login-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button className="login-button" type="submit">Log In</button>
                <button className="create-account-button" type="button" onClick={handleSignUp}>Create new account</button>
                {error && <p style={{ color: "red" }}>{error}</p>}
            </motion.form>
        </div>
    </>
  )
}