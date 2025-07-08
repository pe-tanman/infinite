"use client";

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA0kA8EiI8GVZL1p0VzKScFBXcYHJ5qgic",
    authDomain: "infinite-4bc46.firebaseapp.com",
    projectId: "infinite-4bc46",
    storageBucket: "infinite-4bc46.firebasestorage.app",
    messagingSenderId: "87112514096",
    appId: "1:87112514096:web:f6ff69067c70e0bbfa8bf5",
    measurementId: "G-ZVCN3W87CK"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);