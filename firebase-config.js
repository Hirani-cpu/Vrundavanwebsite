// ===========================
// Firebase Configuration
// ===========================
// Replace these values with your actual Firebase project credentials
// You can find these in your Firebase Console under Project Settings

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "vrundavan-resort-website.firebaseapp.com",
  projectId: "vrundavan-resort-website",
  storageBucket: "vrundavan-resort-website.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Auth
const auth = firebase.auth();

// Export for use in other files
window.db = db;
window.auth = auth;
window.firebase = firebase;
