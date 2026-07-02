import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAftFJc8SIcTCwsf9sxp83ixRC_IsHU5d0",
  authDomain: "musicflow-99b96.firebaseapp.com",
  projectId: "musicflow-99b96",
  storageBucket: "musicflow-99b96.firebasestorage.app",
  messagingSenderId: "110408672644",
  appId: "1:110408672644:web:70e7b956dc40459a07e9d1",
  measurementId: "G-1SN96W28SN",
  databaseURL:
    "https://musicflow-99b96-default-rtdb.firebaseio.com",
};

const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

export const auth = getAuth(app);
export const database = getDatabase(app);

export default app;