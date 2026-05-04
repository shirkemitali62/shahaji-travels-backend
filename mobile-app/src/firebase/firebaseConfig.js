import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  
  apiKey: "AIzaSyC1AUSGSJKXPrWAi__OHMqCSi2jNGfOJak",
  authDomain: "shahaji-travels.firebaseapp.com",
  projectId: "shahaji-travels",
  storageBucket: "shahaji-travels.firebasestorage.app",
  messagingSenderId: "841686490563",
  appId: "1:841686490563:web:6db47898b70df4d6163176",
  measurementId: "G-NGLB6HZ15Z"
};


const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

export { auth };
export default app;