# 🔥 CRITICAL: Update Your Firestore Security Rules

## ⚠️ You're getting "Missing or insufficient permissions" error!

This means your Firestore security rules are blocking the admin from adding/editing rooms, menu, and gallery.

---

## 🚀 Quick Fix (Follow These Steps):

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **vrundavan-resort-website**

### Step 2: Update Firestore Rules
1. Click **"Firestore Database"** in the left sidebar
2. Click the **"Rules"** tab at the top
3. **DELETE ALL** the existing rules
4. **COPY AND PASTE** the rules below:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Room Bookings - Anyone can create, only authenticated users can read/update/delete
    match /roomBookings/{document=**} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    // Event Bookings - Anyone can create, only authenticated users can read/update/delete
    match /eventBookings/{document=**} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    // Rooms Management - Only authenticated users can manage
    match /rooms/{document=**} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }

    // Menu Categories - Only authenticated users can manage
    match /menuCategories/{document=**} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }

    // Menu Items - Only authenticated users can manage
    match /menuItems/{document=**} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }

    // Gallery - Only authenticated users can manage
    match /gallery/{document=**} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
  }
}
```

### Step 3: Publish the Rules
1. Click the **"Publish"** button (top right)
2. Wait for the confirmation message
3. **Wait 30-60 seconds** for the rules to propagate

### Step 4: Test Again
1. Go back to your admin dashboard
2. **Hard refresh** the page (Ctrl + Shift + R)
3. Click on **"Manage Rooms"** tab
4. Click **"+ Add New Room"**
5. Fill in the form and click **"Save Room"**
6. ✅ **It should work now!**

---

## 📋 What These Rules Do:

### For Public Website Visitors:
- ✅ Can submit room bookings
- ✅ Can submit event bookings
- ✅ Can view rooms on rooms.html
- ✅ Can view menu on restaurant.html
- ✅ Can view gallery on gallery.html

### For Authenticated Admins:
- ✅ Can view/edit/delete room bookings
- ✅ Can view/edit/delete event bookings
- ✅ Can add/edit/delete rooms
- ✅ Can add/edit/delete menu categories
- ✅ Can add/edit/delete menu items
- ✅ Can add/edit/delete gallery images

---

## 🔒 Important Security Notes:

1. **Authentication Required**: These rules require you to be logged in via Firebase Authentication
2. **Your Current Login**: You should be logged in as `admin@vrundavanresort.com` or `vishal@vrundavanresort.com`
3. **If Still Not Working**: Make sure you're logged in through `admin.html` with Firebase Auth (not just the website login)

---

## 🆘 Still Getting Errors?

### Check if you're authenticated:
1. Open browser console (F12)
2. Type: `firebase.auth().currentUser`
3. Press Enter
4. You should see a user object with your email
5. If you see `null`, you need to login via `admin.html` first

### Alternative: Test Mode (Temporary)
If you just want to test quickly, use these rules (⚠️ NOT SECURE for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // ⚠️ ANYONE CAN READ/WRITE - USE ONLY FOR TESTING
    }
  }
}
```

**WARNING**: The test mode rules above allow ANYONE to read/write your database. Only use this temporarily for testing, then switch back to the secure rules above!

---

## ✅ After Updating Rules:

Your admin panel will have full functionality:
- ✅ Add/Edit/Delete Rooms with images
- ✅ Add/Edit/Delete Menu Categories
- ✅ Add/Edit/Delete Menu Items
- ✅ Add/Edit/Delete Gallery Images
- ✅ View/Approve/Reject Bookings

---

**Need Help?** Make sure you followed ALL steps above, especially waiting 30-60 seconds after publishing the rules!
