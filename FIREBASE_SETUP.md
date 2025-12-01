# Firebase Setup Instructions for Vrundavan Resort Website

## 🔥 Firebase Integration Complete!

This document explains how to configure Firebase for your Vrundavan Resort & Restaurant website.

---

## 📋 What's Included

### New Files Created:
1. **firebase-config.js** - Firebase configuration and initialization
2. **admin.html** - Admin login page
3. **admin.js** - Admin authentication logic
4. **dashboard.html** - Admin dashboard with booking tables
5. **dashboard.js** - Dashboard data fetching and display logic

### Modified Files:
1. **contact.html** - Added Firebase SDK scripts
2. **script.js** - Added Firebase booking form handlers

---

## ⚙️ Firebase Setup Steps

### Step 1: Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `vrundavan-resort-website`
3. Click the **gear icon** ⚙️ next to "Project Overview"
4. Select **"Project settings"**
5. Scroll down to **"Your apps"** section
6. If you haven't added a web app:
   - Click **"Add app"** button
   - Select **Web (</> icon)**
   - Register your app with a nickname (e.g., "Vrundavan Website")
   - Copy the `firebaseConfig` object

### Step 2: Update firebase-config.js

Open `firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                    // ← Replace with your actual API key
  authDomain: "vrundavan-resort-website.firebaseapp.com",
  projectId: "vrundavan-resort-website",
  storageBucket: "vrundavan-resort-website.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",       // ← Replace with your actual sender ID
  appId: "YOUR_APP_ID"                       // ← Replace with your actual app ID
};
```

### Step 3: Enable Firestore Database

1. In Firebase Console, go to **"Firestore Database"** (left sidebar)
2. Click **"Create database"**
3. Choose **"Start in production mode"** or **"Start in test mode"** (recommended for development)
4. Select your preferred Cloud Firestore location
5. Click **"Enable"**

### Step 4: Create Firestore Collections

The collections will be created automatically when the first booking is submitted. However, you can create them manually:

1. In Firestore Database, click **"Start collection"**
2. Create collection: `roomBookings`
3. Add a test document with these fields:
   ```
   fullName: "Test User"
   phone: "1234567890"
   email: "test@example.com"
   checkIn: "2025-01-15"
   checkOut: "2025-01-17"
   adults: 2
   children: 0
   roomType: "Deluxe AC Room"
   specialRequests: ""
   bookingStatus: "pending"
   createdAt: (timestamp)
   ```

4. Repeat for `eventBookings` collection:
   ```
   fullName: "Test User"
   phone: "1234567890"
   email: "test@example.com"
   eventType: "Wedding"
   guests: 100
   preferredArea: "Garden/Lawn"
   eventDate: "2025-02-01"
   timeSlot: "Evening (6 PM - 11 PM)"
   message: ""
   bookingStatus: "pending"
   createdAt: (timestamp)
   ```

### Step 5: Set Firestore Security Rules

1. Go to **"Firestore Database" → "Rules"** tab
2. Update the rules to allow read/write access:

**For Development (test mode):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to submit bookings
    match /roomBookings/{document=**} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    match /eventBookings/{document=**} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

**For Production (recommended):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow authenticated admins to read/write
    match /roomBookings/{document=**} {
      allow create: if true;  // Anyone can submit bookings
      allow read, update, delete: if request.auth != null && request.auth.token.admin == true;
    }

    match /eventBookings/{document=**} {
      allow create: if true;  // Anyone can submit bookings
      allow read, update, delete: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

3. Click **"Publish"**

### Step 6: Enable Firebase Authentication

1. Go to **"Authentication"** (left sidebar)
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. **Enable** Email/Password sign-in
6. Click **"Save"**

### Step 7: Create Admin User

1. In **"Authentication" → "Users"** tab
2. Click **"Add user"**
3. Enter admin credentials:
   - **Email**: admin@vrundavanresort.com (or your preferred email)
   - **Password**: Create a strong password
4. Click **"Add user"**
5. **IMPORTANT**: Save these credentials securely!

---

## 🚀 Testing Your Setup

### Test Booking Forms:
1. Open `contact.html` in your browser
2. Fill out the Room Booking or Event Booking form
3. Submit the form
4. Check Firebase Console → Firestore Database to see if the booking was saved

### Test Admin Login:
1. Open `admin.html` in your browser
2. Enter your admin credentials
3. You should be redirected to `dashboard.html`

### Test Dashboard:
1. After logging in, you should see the dashboard
2. Click on "Room Bookings" and "Event Bookings" tabs
3. You should see the bookings you submitted earlier

---

## 📊 Database Structure

### roomBookings Collection:
```
{
  fullName: string,
  phone: string,
  email: string,
  checkIn: string (YYYY-MM-DD),
  checkOut: string (YYYY-MM-DD),
  adults: number,
  children: number,
  roomType: string,
  specialRequests: string,
  bookingStatus: string (pending/confirmed/cancelled),
  createdAt: timestamp
}
```

### eventBookings Collection:
```
{
  fullName: string,
  phone: string,
  email: string,
  eventType: string,
  guests: number,
  preferredArea: string,
  eventDate: string (YYYY-MM-DD),
  timeSlot: string,
  message: string,
  bookingStatus: string (pending/confirmed/cancelled),
  createdAt: timestamp
}
```

---

## 🔐 Admin Access

- **Login Page**: `admin.html`
- **Dashboard**: `dashboard.html`
- **Login URL**: `https://yourdomain.com/admin.html`

---

## 📝 Features

### ✅ Room & Event Booking Forms
- Form validation
- Save to Firestore automatically
- Automatic timestamp (createdAt)
- Success message with booking summary
- Unique booking ID displayed

### ✅ Admin Dashboard
- Secure login with Firebase Authentication
- View all room bookings
- View all event bookings
- Real-time data from Firestore
- Statistics cards (total bookings count)
- Tab switching between booking types
- Refresh button to reload data
- Logout functionality

---

## 🛠️ Troubleshooting

### Bookings not saving?
- Check browser console for errors
- Verify Firebase config is correct in `firebase-config.js`
- Check Firestore security rules allow `create` operations
- Ensure Firebase SDK scripts are loaded before `firebase-config.js`

### Can't login to admin?
- Verify admin user exists in Firebase Authentication
- Check email and password are correct
- Check browser console for auth errors
- Verify Firebase Auth is enabled in Firebase Console

### Dashboard not showing bookings?
- Check if you're logged in (should redirect to admin.html if not)
- Verify Firestore security rules allow `read` for authenticated users
- Check browser console for Firestore errors
- Try clicking the "Refresh" button

---

## 🎯 Next Steps (Optional)

1. **Email Notifications**: Set up Cloud Functions to send email notifications when bookings are received
2. **Custom Admin Claims**: Add admin role claims for better security
3. **Booking Status Updates**: Add ability to change booking status (pending/confirmed/cancelled) from dashboard
4. **Export Data**: Add CSV export functionality for bookings
5. **Search & Filter**: Add search and date filtering in dashboard
6. **Booking Details Modal**: Add ability to view full booking details in a modal

---

## 💡 Important Notes

- **Never commit `firebase-config.js` with real credentials to public repositories**
- Use environment variables for production
- Regularly backup your Firestore data
- Monitor Firebase usage in Firebase Console
- Update security rules for production environment
- Use strong passwords for admin accounts

---

## 🆘 Support

If you encounter issues:
1. Check Firebase Console logs
2. Check browser developer console
3. Verify all setup steps were completed
4. Check Firebase documentation: https://firebase.google.com/docs

---

**Firebase Integration Complete! 🎉**

You now have a fully functional booking system with admin dashboard powered by Firebase!
