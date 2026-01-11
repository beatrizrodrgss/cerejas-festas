import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyB8Ec2SDLyaEUoylhTw5JfOrvFgf_gX9O8",
    authDomain: "cerejas-festas.firebaseapp.com",
    projectId: "cerejas-festas",
    storageBucket: "cerejas-festas.firebasestorage.app",
    messagingSenderId: "964373452476",
    appId: "1:964373452476:web:b643e567597729e3bb62b9",
    measurementId: "G-STY7D94ZP4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app); // Prepared if we want to add Auth later
