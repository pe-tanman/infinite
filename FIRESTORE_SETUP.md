# Firestore Security Rules for Infinite Learning App

## Current Issue
If you're not seeing saved pages in the Cloud Pages section, it's likely due to Firestore security rules being too restrictive.

## Recommended Firestore Rules

Go to your Firebase Console > Firestore Database > Rules and replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to pages collection for all users
    match /pages/{pageId} {
      allow read: if true; // Anyone can read public pages
      allow write: if request.auth != null; // Only authenticated users can create pages
    }
    
    // Allow users to read/write their own progress
    match /userProgress/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // For development/testing - remove in production
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## For Development/Testing Only

If you want to allow all reads and writes temporarily for testing:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Warning:** The above rules allow anyone to read and write to your database. Only use for testing!

## Production Rules

For production, use more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Pages collection
    match /pages/{pageId} {
      allow read: if resource.data.public == true || 
                     (request.auth != null && request.auth.uid == resource.data.createdBy);
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.createdBy;
      allow update: if request.auth != null && 
                       request.auth.uid == resource.data.createdBy;
      allow delete: if request.auth != null && 
                       request.auth.uid == resource.data.createdBy;
    }
    
    // User progress collection
    match /userProgress/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Steps to Update Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Firestore Database
4. Click on the "Rules" tab
5. Replace the existing rules with the recommended ones above
6. Click "Publish"

## Testing

After updating the rules:

1. Go to `/cloud` page in your app
2. Click "Test Firebase" button to verify connection
3. Click "Create Test Page" to create a sample page
4. Refresh the page to see if it appears in the list

## Common Issues

- **"Missing or insufficient permissions"**: Update Firestore rules
- **"Network error"**: Check Firebase configuration
- **"Project not found"**: Verify project ID in Firebase config
