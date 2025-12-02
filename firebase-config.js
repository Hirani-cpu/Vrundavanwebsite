// ===========================
// Firebase Configuration
// ===========================
// Replace these values with your actual Firebase project credentials
// You can find these in your Firebase Console under Project Settings

const firebaseConfig = {
  apiKey: "AIzaSyA8QlVCJtXAC_suph9bPRzaLZT3_-Fm7XE",
  authDomain: "vrundavan-resort-website.firebaseapp.com",
  projectId: "vrundavan-resort-website",
  storageBucket: "vrundavan-resort-website.firebasestorage.app",
  messagingSenderId: "12675033030",
  appId: "1:12675033030:web:4dd234c61f16944b7e34c7",
  measurementId: "G-GY4RP043Y3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Auth
const auth = firebase.auth();

// Initialize Storage
const storage = firebase.storage();

// Export for use in other files
window.db = db;
window.auth = auth;
window.storage = storage;
window.firebase = firebase;
