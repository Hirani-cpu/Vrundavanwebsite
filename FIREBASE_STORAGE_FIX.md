# 🔥 UPDATED Firebase Storage Rules

## ADD THIS to your existing rules:

Just add the **menu** section between gallery and siteSettings:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload/read their own images
    match /rooms/{imageId} {
      allow read: if true; // Anyone can read room images
      allow write: if request.auth != null; // Only logged-in users can upload
    }

    match /gallery/{imageId} {
      allow read: if true; // Anyone can read gallery images
      allow write: if request.auth != null; // Only logged-in users can upload
    }

    match /menu/{imageId} {
      allow read: if true; // Anyone can read menu images
      allow write: if request.auth != null; // Only logged-in users can upload
    }

    match /cards/{imageId} {
      allow read: if true; // Anyone can read card images
      allow write: if request.auth != null; // Only logged-in users can upload
    }

    match /images/{imageId} {
      allow read: if true; // Anyone can read images
      allow write: if request.auth != null; // Only logged-in users can upload
    }

    match /logos/{imageId} {
      allow read: if true; // Anyone can read logos
      allow write: if request.auth != null; // Only logged-in users can upload
    }
  }
}
```

### Step 4: Publish Rules
1. Click **"Publish"** button
2. Wait for confirmation (green checkmark)

### Step 5: Test
1. Go back to your admin panel
2. Try uploading a room image again
3. Should work now! ✅

## What This Does
- ✅ **Anyone can VIEW** images (public website needs this)
- ✅ **Only LOGGED-IN users can UPLOAD** images (security)
- ✅ **No more permission errors!**

---

## Login Persistence Fixed! 🔒
I've also fixed the login issue - you will now **STAY LOGGED IN** even after closing the browser!

The fix adds `setPersistence(LOCAL)` to the authentication code.
