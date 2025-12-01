# 🔧 Fix: Approve/Reject Buttons Stuck at "Updating..."

## Problem
When you click "Approve" or "Reject" in the admin dashboard modal, the buttons get stuck showing "Updating..." and nothing happens.

## Cause
Firestore security rules don't allow **update** operations. The rules might only allow `create` and `read`, but not `update`.

---

## ✅ Solution: Update Firestore Security Rules

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com/
2. Select your project: **vrundavan-resort-website**
3. Click **"Firestore Database"** in the left sidebar
4. Click the **"Rules"** tab at the top

### Step 2: Update the Rules
Replace your current rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /roomBookings/{document=**} {
      allow create: if true;              // Anyone can create bookings
      allow read: if true;                // Anyone can read bookings
      allow update: if true;              // Allow updates (for admin)
      allow delete: if true;              // Allow deletes (for admin)
    }

    match /eventBookings/{document=**} {
      allow create: if true;              // Anyone can create bookings
      allow read: if true;                // Anyone can read bookings
      allow update: if true;              // Allow updates (for admin)
      allow delete: if true;              // Allow deletes (for admin)
    }
  }
}
```

**OR simpler version:**

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

> **Note:** `write` includes `create`, `update`, and `delete` operations.

### Step 3: Publish the Rules
1. Click the **"Publish"** button
2. Wait for "Rules published successfully" message
3. Wait 30 seconds for rules to propagate

### Step 4: Test Again
1. Go back to your admin dashboard
2. Refresh the page (Ctrl + F5)
3. Click on a booking
4. Click "Approve" or "Reject"
5. Should work now! ✅

---

## 🔍 How to Check if This is the Issue

### Open Browser Console (F12):
When you click "Approve" or "Reject", check the console for errors:

**If you see:**
```
Error code: permission-denied
Error message: Missing or insufficient permissions
```

**Then:** You need to update Firestore security rules (follow steps above)

---

## 🎯 Expected Behavior After Fix:

### ✅ When Approve Button Works:
1. Click "✓ Approve Booking"
2. See confirmation: "Are you sure you want to APPROVE this booking?"
3. Click "OK"
4. See alert: "Booking APPROVED successfully!"
5. Modal closes
6. Table refreshes automatically
7. Status badge changes to green "CONFIRMED"

### ✅ When Reject Button Works:
1. Click "✗ Reject Booking"
2. See confirmation: "Are you sure you want to REJECT this booking?"
3. Click "OK"
4. See alert: "Booking REJECTED successfully!"
5. Modal closes
6. Table refreshes automatically
7. Status badge changes to red "REJECTED"

---

## 📝 What Gets Updated in Firestore:

When you approve/reject, these fields are updated:

```javascript
{
  bookingStatus: "confirmed",        // or "rejected"
  adminNotes: "Your notes here",     // if you typed any
  updatedAt: Timestamp               // automatically added
}
```

---

## 🔐 Security Recommendation

### For Testing (Current):
```javascript
allow read, write: if true;  // Anyone can do anything
```

### For Production (More Secure):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /roomBookings/{document=**} {
      allow create: if true;                          // Anyone can submit bookings
      allow read: if true;                            // Anyone can read (for now)
      allow update, delete: if request.auth != null;  // Only logged-in users
    }

    match /eventBookings/{document=**} {
      allow create: if true;
      allow read: if true;
      allow update, delete: if request.auth != null;
    }
  }
}
```

This ensures only authenticated users (admins) can update/delete bookings.

---

## 🆘 Still Not Working?

### Check These:

1. **Browser Console (F12)**
   - Look for any error messages
   - Check what error code appears

2. **Network Tab**
   - Open Dev Tools (F12)
   - Go to "Network" tab
   - Click approve/reject
   - Look for failed requests (red)
   - Click on the failed request to see details

3. **Firestore Rules Applied?**
   - Sometimes takes 30-60 seconds to propagate
   - Try waiting a bit and refreshing

4. **Firebase SDK Loaded?**
   - Check console for: "Firebase is initialized"
   - If not, there's a different issue

---

## 📞 Quick Debug Commands

Open browser console (F12) and run:

```javascript
// Test if Firebase is loaded
console.log(typeof firebase !== 'undefined' ? 'Firebase loaded ✓' : 'Firebase NOT loaded ✗');

// Test if Firestore is initialized
console.log(typeof db !== 'undefined' ? 'Firestore loaded ✓' : 'Firestore NOT loaded ✗');

// Try a test update (replace BOOKING_ID with actual ID)
db.collection('roomBookings').doc('BOOKING_ID').update({
  bookingStatus: 'confirmed'
}).then(() => console.log('Update works! ✓'))
  .catch(err => console.error('Update failed:', err));
```

---

**Most likely, you just need to update the Firestore security rules!** 🚀
