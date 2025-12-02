# Firebase Storage Setup Instructions

## Issue: Upload Stuck at "Saving..."

If image uploads get stuck, it's likely due to Firebase Storage not being properly configured. Follow these steps:

## Step 1: Enable Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **vrundavan-resort-website**
3. Click on **"Storage"** in the left sidebar
4. If not enabled, click **"Get Started"**
5. Click **"Next"** and then **"Done"**

## Step 2: Update Storage Security Rules

1. In Firebase Console, go to **Storage**
2. Click on the **"Rules"** tab at the top
3. Replace the existing rules with the content from `storage.rules` file:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to rooms and gallery folders
    match /rooms/{allPaths=**} {
      allow read: if true; // Anyone can read/view images
      allow write: if request.auth != null; // Only authenticated users can upload
    }

    match /gallery/{allPaths=**} {
      allow read: if true; // Anyone can read/view images
      allow write: if request.auth != null; // Only authenticated users can upload
    }

    // Deny access to all other paths
    match /{allPaths=**} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

4. Click **"Publish"**

## Step 3: Verify Storage Bucket

Your storage bucket should be: `vrundavan-resort-website.firebasestorage.app`

This is already configured in `firebase-config.js`:
```javascript
storageBucket: "vrundavan-resort-website.firebasestorage.app"
```

## Step 4: Test Upload

1. Login to admin panel at `dashboard.html`
2. Go to **"Manage Rooms"** tab
3. Click **"+ Add New Room"**
4. Fill in the details
5. Click **"Choose File"** and select an image
6. You should see a preview of the image
7. Click **"Save Room"**
8. Button should show "Saving..." then "Save Room"
9. You should get a success message

## Troubleshooting

### Check Browser Console

Open browser console (F12) and look for:

**✅ Success Messages:**
```
Starting upload... {file: "image.jpg", size: 123456, type: "image/jpeg"}
Uploading to: rooms/1234567890_image.jpg
Storage reference created, starting upload...
Upload progress: 50%
Upload progress: 100%
Upload complete, getting download URL...
File uploaded successfully: https://firebasestorage.googleapis.com/...
```

**❌ Error Messages:**

1. **"Firebase Storage not initialized"**
   - Solution: Reload the page, make sure `firebase-config.js` loads first

2. **"Permission denied" or "storage/unauthorized"**
   - Solution: Update Storage Rules (see Step 2 above)
   - Make sure you're logged in via admin.html first

3. **"Network error" or timeout**
   - Solution: Check your internet connection
   - Try a smaller image file

4. **"Invalid file type"**
   - Solution: Only JPG, PNG, WebP, GIF images are allowed
   - File must have proper MIME type

### Check Firebase Authentication

Upload requires you to be logged in:

1. Go to `admin.html`
2. Login with your admin credentials
3. Then go to `dashboard.html`
4. Now try uploading

### Storage Rules Not Working?

If rules are published but still getting errors:

1. Wait 1-2 minutes for rules to propagate
2. Clear browser cache and reload
3. Check Firebase Console > Storage > Rules
4. Verify rules are exactly as shown above
5. Check that user is authenticated (look for user email in dashboard header)

### File Size Issues

- Maximum file size: **5MB**
- Recommended size: **< 2MB** for faster uploads
- Compress images before uploading if needed

## Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `storage/unauthorized` | Not logged in or no permission | Login via admin.html first |
| `storage/unauthenticated` | No authentication token | Login and refresh page |
| `storage/object-not-found` | File doesn't exist | Check filename and path |
| `storage/quota-exceeded` | Storage quota exceeded | Upgrade Firebase plan |
| `storage/invalid-checksum` | Upload corrupted | Try uploading again |
| `storage/canceled` | Upload cancelled | Don't close window during upload |

## Verify Setup is Working

### Check in Firebase Console:

1. Go to **Storage** in Firebase Console
2. After successful upload, you should see folders:
   - `rooms/`
   - `gallery/`
3. Inside folders, you'll see uploaded files:
   - `1234567890_image_name.jpg`

### Check in Website:

1. After uploading a room image, go to `rooms.html`
2. You should see the uploaded image displayed
3. Image loads from Firebase CDN URL

## Security Notes

**Current Rules Allow:**
- ✅ Anyone can VIEW images (public read)
- ✅ Only authenticated admins can UPLOAD images
- ✅ Only authenticated admins can DELETE images
- ❌ Anonymous users CANNOT upload

**Folders Protected:**
- `rooms/` - Room images only
- `gallery/` - Gallery images only
- All other paths denied

## Next Steps After Setup

1. **Test Upload**: Try uploading a test image
2. **Check Console**: Verify no errors in browser console
3. **View Image**: Check that image displays on website
4. **Test Gallery**: Upload a gallery image too
5. **Delete Test**: Clean up test images in Firebase Console

## Files Modified

- `firebase-config.js` - Added storage initialization
- `admin-manage.js` - Added upload function with logging
- `storage.rules` - Storage security rules (copy to Firebase)
- This file - Setup documentation

## Need Help?

If still stuck:
1. Check browser console for exact error message
2. Verify Firebase Storage is enabled in console
3. Verify storage rules are published
4. Verify you're logged in as admin
5. Try with a different, smaller image file
