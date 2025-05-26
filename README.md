# 🔮 Real-time Q&A Session App

A modern, real-time Q&A web application built with Firebase Realtime Database that can be hosted on GitHub Pages. Perfect for live events, presentations, meetings, or any scenario where you need to collect and manage questions from an audience.

## ✨ Features

- **Real-time Q&A**: Questions appear instantly for all participants.
- **Voting System**: Upvote questions to prioritize them.
- **Secure Access Control**: Three-tier system (Admin, Questioner, Read-Only) using cryptographic hashes for authentication.
- **Admin Controls**: Session creators can mark questions as answered, delete questions, and end the session.
- **Auto-expiration**: Sessions automatically expire after 3 hours, becoming read-only.
- **Mobile-friendly**: Responsive design works seamlessly on all devices.
- **Modern UI**: Advanced glassmorphism design, animations, and accessibility features.
- **Simplified Sharing**: One-click sharing generates a questioner-level access link.

## 🔒 Access Control System

This application implements a three-tier access control system using URL parameters containing cryptographic hashes, generated based on the session ID. These hashes provide a way to grant different levels of access by enabling or disabling client-side UI elements and functions.

### 1. 👀 Read-Only Access (Default)
- **How to get it**: Accessing the session URL without any hash parameters (`?session=YOUR_SESSION_ID`).
- **Capabilities**: Can view sessions, questions, and vote counts.
- **Limitations**: Cannot post questions, vote, or access any admin controls.

### 2. ✍️ Question Access
- **How to get it**: Using a session URL with a valid questioner hash (`?session=YOUR_SESSION_ID&qh=YOUR_QUESTIONER_HASH`).
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
2. Click the "✨ Create New Session" button.
3. You will be redirected to your new session with full admin access. The URL will contain your admin hash.
4. **Important**: Copy this URL and save it securely. This is your unique admin link for this session.
5. Share the session link with participants (using the "📋 Share Session" button gives them Question Access).

### Joining a Session
1. **With Full Admin Access**: Use the unique admin URL you saved from session creation.
2. **With Question Access**: Use the link shared by the admin (generated via the "Share Session" button).
3. **With Read-Only Access**: Simply use the base session URL (e.g., `https://your-app.github.io/?session=YOUR_SESSION_ID`).
4. Depending on your access level, you can view, ask questions, vote, or manage the session.

### Admin Actions (Available only with Full Admin Access)
- **📋 Share Session**: Copies a Question Access link to your clipboard.
- **✅ Mark as Answered**: Click the button on a question card to mark it as answered.
- **🗑️ Delete**: Click the button on a question card to permanently remove it.
- **🛑 End Session**: Click the button in the admin controls area to make the session inactive for all users. After ending the session, users will be redirected to the `/QnA-Session/` path.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Firebase Realtime Database
- **Hosting**: GitHub Pages (static hosting)
- **Styling**: Advanced custom CSS with glassmorphism effects, animations, and responsiveness.

## 🚀 Quick Start

### 1. Firebase Setup

1. **Create a Firebase Project**: Go to [Firebase Console](https://console.firebase.google.com/), click "Create a project", and follow the steps.

2. **Enable Realtime Database**: In your Firebase project dashboard, navigate to "Realtime Database" and click "Create Database". Choose a location and start in test mode for now.

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

**Implementing robust security rules is CRUCIAL for this application.** The current `app.js` code performs client-side validation using URL hashes (`ah` and `qh`) to enable or disable UI elements and features based on the user's perceived access level. **However, this client-side validation is NOT sufficient to prevent unauthorized write operations directly to your Firebase Realtime Database if someone bypasses the client-side JavaScript.**

You MUST configure Firebase Security Rules in your Firebase Console (Realtime Database → Rules) to validate all write operations (creating/voting questions, updating session status, deleting questions) and ensure that only authorized requests are allowed to modify your database. Relying solely on the client-side hash validation in `app.js` for security is insecure.

**Strong Recommendation**: Implement robust server-side validation using Firebase Security Rules. Consider integrating Firebase Authentication to manage user identities for more fine-grained and secure access control instead of relying solely on URL parameters.

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
- **CRITICAL:** Implement robust Firebase Security Rules to protect your data. The client-side validation in `app.js` is not sufficient.
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