# 🔮 Real-time Q&A Session App

A modern, real-time Q&A web application built with Firebase Realtime Database that can be hosted on GitHub Pages. Perfect for live events, presentations, meetings, or any scenario where you need to collect and manage questions from an audience.

## ✨ Features

- **Real-time Q&A**: Questions appear instantly for all participants.
- **Voting System**: Upvote questions to prioritize them.
- **Secure Access Control**: Three-tier system (Admin, Questioner, Read-Only) using cryptographic hashes for authentication.
- **Dynamic Passwords**: Session creators set their own password.
- **Admin Controls**: Session creators can mark questions as answered, delete questions, and end the session.
- **Auto-expiration**: Sessions automatically expire after 3 hours, becoming read-only.
- **Mobile-friendly**: Responsive design works seamlessly on all devices.
- **Modern UI**: Advanced glassmorphism design, animations, and accessibility features.
- **Simplified Sharing**: One-click sharing generates a questioner-level access link.

## 🔒 Access Control System

This application implements a three-tier access control system using URL parameters containing cryptographic hashes, generated based on the session ID and the session's password. This provides a secure way to grant different levels of access without exposing the password directly in the URL for non-admin users.

### 1. 👀 Read-Only Access (Default)
- **How to get it**: Accessing the session URL without any hash parameters (`?session=YOUR_SESSION_ID`).
- **Capabilities**: Can view sessions, questions, and vote counts.
- **Limitations**: Cannot post questions, vote, or access any admin controls.

### 2. ✍️ Question Access
- **How to get it**: Using a session URL with a valid questioner hash (`?session=YOUR_SESSION_ID&qh=YOUR_QUESTIONER_HASH`) or by having the session password stored locally (e.g., from creating the session).
- **Capabilities**: Can post new questions and vote on existing questions.
- **Limitations**: Cannot see or use admin controls (Mark Answered, Delete, End Session).

### 3. 👑 Full Admin Access
- **How to get it**: Using the session URL with a valid admin hash (`?session=YOUR_SESSION_ID&ah=YOUR_ADMIN_HASH`). This link is provided when a new session is created.
- **Capabilities**: Has full control over the session:
    - Can see and use all admin controls (Share Session, End Session).
    - Can mark questions as answered.
    - Can delete any question.
    - Can post questions and vote.

## 📱 How to Use

### Creating a Session
1. Visit the app homepage.
2. Enter your desired admin password in the input field.
3. Click the "✨ Create New Session" button.
4. You will be redirected to your new session with full admin access. The URL will contain your admin hash.
5. **Important**: Copy this URL and save it securely. This is your unique admin link for this session.
6. Share the session link with participants (using the "📋 Share Session" button gives them Question Access).

### Joining a Session
1. **With Full Admin Access**: Use the unique admin URL you saved from session creation.
2. **With Question Access**: Use the link shared by the admin (generated via the "Share Session" button or manually constructed with the `qh` hash or password in URL).
3. **With Read-Only Access**: Simply use the base session URL (e.g., `https://your-app.github.io/?session=YOUR_SESSION_ID`).
4. Depending on your access level, you can view, ask questions, vote, or manage the session.

### Admin Actions (Available only with Full Admin Access)
- **📋 Share Session**: Copies a Question Access link to your clipboard.
- **✅ Mark as Answered**: Click the button on a question card to mark it as answered.
- **🗑️ Delete**: Click the button on a question card to permanently remove it.
- **🛑 End Session**: Click the button in the admin controls area to make the session inactive for all users.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Firebase Realtime Database
- **Hosting**: GitHub Pages (static hosting)
- **Styling**: Advanced custom CSS with glassmorphism effects, animations, and responsiveness.

## 🚀 Quick Start

### 1. Firebase Setup

1. **Create a Firebase Project**: Go to [Firebase Console](https://console.firebase.google.com/), click "Create a project", and follow the steps.

2. **Enable Realtime Database**: In your Firebase project dashboard, navigate to "Realtime Database" and click "Create Database". Choose a location and start in test mode for now (we will discuss rules next).

3. **Get Firebase Configuration**: Go to Project Settings (gear icon), scroll down to "Your apps", click "Add app" (Web), and register your app. Copy the Firebase configuration object.

4. **Update Configuration in `app.js`**:
   - Open the `app.js` file.
   - Replace the placeholder `firebaseConfig` object (around line 40) with your copied configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.YOUR_REGION.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```
   - **Note**: While the API key is used client-side, sensitive operations are protected by Firebase Security Rules, not by keeping the API key secret.

### 2. Firebase Security Rules

**Implementing robust security rules is CRUCIAL for this application.** The application relies on dynamic session passwords and hash validation done client-side and implicitly through Firebase rules. You need to set up rules in your Firebase Console (Realtime Database → Rules) that validate write operations.

**Concept for Rules:**

Your rules should allow read access for everyone but restrict write access (creating/voting questions, updating session status) based on validating the password included in the data write against the `password` stored for that specific session ID in the database. This prevents unauthorized writes even if someone guesses a session ID.

**Example (Conceptual - adapt to your security needs!):**

```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        // Read access for everyone
        ".read": true,
        // Write access requires the provided password to match the stored password
        // IMPORTANT: Implement more granular validation based on data structure (questions, active, etc.)
        // and consider Firebase Authentication for stronger security in production.
        ".write": "data.child('password').val() == newData.child('password').val()"
      }
    }
  }
}
```

- **Strong Recommendation**: For a production application, integrate Firebase Authentication to manage user identities and use those identities in your security rules for more fine-grained and secure access control instead of relying solely on a shared session password.

### 3. GitHub Pages Deployment

1. **Create a GitHub Repository**: If you haven't already, create a new public GitHub repository.
2. **Upload Files**: Upload `index.html`, `style.css`, `app.js`, and `README.md` to the root of your repository.
3. **Enable GitHub Pages**: Go to your repository's "Settings" tab. Scroll down to the "Pages" section. Select "Deploy from a branch", choose your main branch (`main` or `master`), and select the `/ (root)` folder. Click "Save".
4. **Access Your App**: Your application will be live shortly at `https://yourusername.github.io/repository-name/`.

## 🏗️ Project Structure

```
├── index.html          # Main application layout
├── style.css           # Global styles, UI theme, and responsiveness
├── app.js              # Application logic, Firebase integration, and access control
└── README.md           # Project documentation
```

## 🔧 Customization

### Styling
- All styling is in `style.css`. Feel free to modify colors, fonts, spacing, and visual effects using the defined CSS custom properties.
- The glassmorphism effect is controlled by the `backdrop-filter` CSS property.

### Firebase
- Adjust Firebase Security Rules to match your security requirements. Consider implementing Firebase Authentication for user management.
- You can extend the Firebase Realtime Database schema in `app.js` to add more features (e.g., user names for questions).

## ❤️ Contributing

This project is open source! Feel free to fork the repository, suggest features, or submit pull requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details (License file not included in this example).

## 🙋‍♂️ Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review Firebase documentation
3. Check browser console for error messages
4. Create an issue in the GitHub repository

## 🎯 Future Enhancements

- [ ] User authentication system
- [ ] Question categories/tags
- [ ] Export session data
- [ ] Advanced admin dashboard
- [ ] Push notifications
- [ ] Question search functionality
- [ ] Session analytics
- [ ] Custom session themes

---

**Happy Q&A Sessions! 🎉** 