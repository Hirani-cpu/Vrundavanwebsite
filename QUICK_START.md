# 🚀 Quick Start Guide

## Can't See Bookings in Dashboard? Start Here!

### Step 1: Run Diagnostic Tool
1. Open `firestore-test.html` in your browser
2. Click **"Run All Tests"**
3. Follow the error messages

### Step 2: Most Common Fix
**If you see "permission-denied" error:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click your project: `vrundavan-resort-website`
3. Go to **Firestore Database** → **Rules**
4. Paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /roomBookings/{document=**} {
      allow read, write: if true;
    }
    match /eventBookings/{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Click **"Publish"**
6. Wait 30 seconds
7. Try dashboard again ✅

---

## How to Login as Admin

### Step 1: Register
- Go to `login.html`
- Click "Sign Up"
- Use email: `admin@vrundavanresort.com` or `vishal@vrundavanresort.com`
- Create a password (min 6 characters)

### Step 2: Login
- Login with your admin email/password
- You'll be redirected to account page

### Step 3: Access Dashboard
- Click **"Settings"** tab
- Scroll down to "🔐 Admin Access"
- Click **"Open Admin Dashboard"**

---

## How to Test Bookings

### Option 1: Create Test Booking (Fastest)
1. Open `firestore-test.html`
2. Click **"Create Test Room Booking"**
3. Check dashboard

### Option 2: Submit Real Booking
1. Go to `contact.html`
2. Fill out Room Booking form
3. Submit
4. Check dashboard

---

## File Structure

```
📁 Vrundavan Resort/
├── 🔥 firebase-config.js         (Your Firebase credentials)
├── 🔧 firestore-test.html        (DIAGNOSTIC TOOL - Start here!)
├── 📊 dashboard.html             (Admin dashboard)
├── 📊 dashboard.js               (Dashboard logic)
├── 👤 account.html               (User account with admin link)
├── 🔐 login.html                 (Login/Register page)
├── 📝 contact.html               (Booking forms)
├── 💻 script.js                  (Main JavaScript)
├── 📖 FIREBASE_SETUP.md          (Full setup guide)
├── ✅ ADMIN_INTEGRATION_COMPLETE.md  (What changed)
└── 🚀 QUICK_START.md             (This file)
```

---

## Admin Emails

Default admin emails (can login and access dashboard):
- `admin@vrundavanresort.com`
- `vishal@vrundavanresort.com`

To add more: Edit `script.js` → Find `ADMIN_EMAILS` array

---

## Important Links

- **Firebase Console**: https://console.firebase.google.com/
- **Your Project**: vrundavan-resort-website
- **Firestore Rules**: Console → Firestore Database → Rules
- **Firestore Data**: Console → Firestore Database → Data

---

## Browser Console Commands (for debugging)

Open browser console (F12) and run:

```javascript
// Check if Firebase is loaded
console.log(typeof firebase !== 'undefined' ? 'Firebase loaded ✓' : 'Firebase not loaded ✗');

// Check if Firestore is initialized
console.log(typeof db !== 'undefined' ? 'Firestore loaded ✓' : 'Firestore not loaded ✗');

// Count room bookings
db.collection('roomBookings').get().then(snap => console.log('Room bookings:', snap.size));

// Count event bookings
db.collection('eventBookings').get().then(snap => console.log('Event bookings:', snap.size));

// Check current user
console.log('Current user:', JSON.parse(localStorage.getItem('currentUser')));
```

---

## ⚡ Quick Fixes

| Problem | Solution |
|---------|----------|
| Permission denied | Update Firestore rules (see Step 2 above) |
| No bookings showing | Run `firestore-test.html` to diagnose |
| Can't see admin panel | Make sure you're logged in with admin email |
| Admin panel not showing | Check if email is in ADMIN_EMAILS array in script.js |
| Collections empty | Create test booking with `firestore-test.html` |
| Can't submit bookings | Check Firestore rules allow `create: if true` |

---

**Need more help?** Check `ADMIN_INTEGRATION_COMPLETE.md` for detailed guide.
