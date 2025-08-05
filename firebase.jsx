import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import Constants from 'expo-constants';

const firebaseConfig = Constants.expoConfig.extra.firebase;

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);