// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js';
// Import the database module as a namespace
import * as databaseModule from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-database.js';

// Destructure necessary functions from the imported module
const {
    getDatabase,
    ref,
    push,
    set,
    onValue,
    off,
    update,
    remove,
    serverTimestamp,
    get,
    enableLogging // Keep for debugging if needed
} = databaseModule;

// Enable database logging for debugging (optional, remove in production)
// enableLogging(true);

// Firebase configuration - Replace with your config
const firebaseConfig = {
    apiKey: "AIzaSyDrF4N5j-PEwEou7kEmHo23z1W6VnfwsxE",
    authDomain: "qa-session-app.firebaseapp.com",
    databaseURL: "https://qa-session-app-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "qa-session-app",
    storageBucket: "qa-session-app.firebasestorage.app",
    messagingSenderId: "905746197414",
    appId: "1:905746197414:web:11b799085adc2c42a33d67"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

const database = getDatabase(app);

// Global variables
let currentSessionId = null;
let sessionExpired = false;
let questionsListener = null;
let sessionListener = null;

// DOM elements
const elements = {
    homeScreen: document.getElementById('homeScreen'),
    sessionScreen: document.getElementById('sessionScreen'),
    expiredScreen: document.getElementById('expiredScreen'),
    sessionId: document.getElementById('sessionId'),
    sessionStatus: document.getElementById('sessionStatus'),
    createSessionBtn: document.getElementById('createSessionBtn'),
    createSessionPasswordInput: document.getElementById('createSessionPasswordInput'),
    joinSessionInput: document.getElementById('joinSessionInput'),
    joinSessionBtn: document.getElementById('joinSessionBtn'),
    questionForm: document.getElementById('questionForm'),
    questionInput: document.getElementById('questionInput'),
    charCount: document.getElementById('charCount'),
    submitBtn: document.getElementById('submitBtn'),
    adminControls: document.getElementById('adminControls'),
    shareSessionBtn: document.getElementById('shareSessionBtn'),
    endSessionBtn: document.getElementById('endSessionBtn'),
    questionsList: document.getElementById('questionsList'),
    toast: document.getElementById('toast'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    createNewSessionBtn: document.getElementById('createNewSessionBtn'),
    // Custom modal elements
    confirmationModal: document.getElementById('confirmationModal'),
    modalMessage: document.getElementById('modalMessage'),
    confirmBtn: document.getElementById('confirmBtn'),
    cancelBtn: document.getElementById('cancelBtn')
};

// Utility functions
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

// Helper function to extract session ID from URL or return the input if it's already a session ID
function extractSessionId(input) {
    // Clean up the input
    input = input.trim();

    // If input looks like a URL, extract the session parameter
    if (input.includes('://') || input.includes('?session=')) {
        try {
            // Handle both full URLs and query strings
            let url;
            if (input.includes('://')) {
                url = new URL(input);
            } else {
                // If it's just a query string, create a dummy URL
                url = new URL('http://dummy.com' + (input.startsWith('?') ? input : '?' + input));
            }
            const sessionId = url.searchParams.get('session');

            // Validate the extracted session ID
            if (sessionId && sessionId.length > 0 && !sessionId.includes('/')) {
                return sessionId;
            } else {
                console.warn('⚠️ Invalid session ID extracted from URL:', sessionId);
                return input; // Return original input as fallback
            }
        } catch (error) {
            console.warn('❌ Failed to parse URL, using input as-is:', error);
            return input;
        }
    }

    // If it doesn't look like a URL, validate it as a session ID
    if (input.length > 0 && !input.includes('/') && !input.includes('?') && !input.includes('#')) {
        return input;
    }

    console.warn('⚠️ Input format not recognized, using as-is:', input);
    return input;
}

// Custom confirmation function
function showConfirmation(message, onConfirm) {
    elements.modalMessage.textContent = message;
    elements.confirmationModal.classList.remove('hidden'); // Ensure display is block for transition
    // Force reflow to allow transition to work
    void elements.confirmationModal.offsetWidth;
    elements.confirmationModal.classList.add('show');

    const handleConfirm = () => {
        elements.confirmationModal.classList.remove('show');
        // Use a timeout to hide completely after transition
        setTimeout(() => { elements.confirmationModal.classList.add('hidden'); }, 300);
        elements.confirmBtn.removeEventListener('click', handleConfirm);
        elements.cancelBtn.removeEventListener('click', handleCancel);
        onConfirm(true);
    };

    const handleCancel = () => {
        elements.confirmationModal.classList.remove('show');
        // Use a timeout to hide completely after transition
        setTimeout(() => { elements.confirmationModal.classList.add('hidden'); }, 300);
        elements.confirmBtn.removeEventListener('click', handleConfirm);
        elements.cancelBtn.removeEventListener('click', handleCancel);
        onConfirm(false);
    };

    elements.confirmBtn.addEventListener('click', handleConfirm);
    elements.cancelBtn.addEventListener('click', handleCancel);

    // Close modal if clicking outside modal content
    elements.confirmationModal.addEventListener('click', (e) => {
        if (e.target === elements.confirmationModal) {
            handleCancel(); // Treat click outside as cancel
        }
    });
}

function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

function showLoading(show = true) {
    if (show) {
        elements.loadingOverlay.classList.remove('hidden');
    } else {
        elements.loadingOverlay.classList.add('hidden');
    }
}

function showScreen(screenName) {
    elements.homeScreen.classList.add('hidden');
    elements.sessionScreen.classList.add('hidden');
    elements.expiredScreen.classList.add('hidden');

    switch (screenName) {
        case 'home':
            elements.homeScreen.classList.remove('hidden');
            break;
        case 'session':
            elements.sessionScreen.classList.remove('hidden');
            break;
        case 'expired':
            elements.expiredScreen.classList.remove('hidden');
            break;
    }
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
}

function isSessionExpired(createdAt) {
    const now = Date.now();
    const sessionAge = now - createdAt;
    const threeHours = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    return sessionAge > threeHours;
}

function hasUserVoted(questionId) {
    const votes = JSON.parse(localStorage.getItem('userVotes') || '{}');
    return votes[questionId] === true;
}

function markUserVoted(questionId) {
    const votes = JSON.parse(localStorage.getItem('userVotes') || '{}');
    votes[questionId] = true;
    localStorage.setItem('userVotes', JSON.stringify(votes));
}

function getUserVotes() {
    return JSON.parse(localStorage.getItem('userVotes') || '{}');
}

function saveUserVotes(votes) {
    localStorage.setItem('userVotes', JSON.stringify(votes));
}

// Admin authentication functions
function generateAdminHash(sessionId, password) {
    // Create a hash based on session ID and password
    const combined = `${sessionId}:${password}:admin`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to positive hex string
    return Math.abs(hash).toString(16).padStart(8, '0');
}

function generateQuestionerHash(sessionId, password) {
    // Create a different hash for question posting access
    const combined = `${sessionId}:${password}:questioner`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to positive hex string and add 'q' prefix
    return 'q' + Math.abs(hash).toString(16).padStart(7, '0');
}

function validateAdminHash(sessionId, password, hash) {
    const expectedHash = generateAdminHash(sessionId, password);
    return hash === expectedHash;
}

function validateQuestionerHash(sessionId, password, hash) {
    const expectedHash = generateQuestionerHash(sessionId, password);
    return hash === expectedHash;
}

function getUserAccessLevel() {
    const urlParams = new URLSearchParams(window.location.search);
    const adminHash = urlParams.get('ah'); // admin hash
    const questionerHash = urlParams.get('qh'); // questioner hash




    if (!currentSessionId) {

        return 'none';
    }

    const sessionPassword = getSessionPassword(currentSessionId);


    if (!sessionPassword) {

        return 'read';
    }

    // Check admin access first
    if (adminHash && validateAdminHash(currentSessionId, sessionPassword, adminHash)) {

        return 'admin';
    }

    // Check questioner access
    if (questionerHash && validateQuestionerHash(currentSessionId, sessionPassword, questionerHash)) {

        return 'questioner';
    }

    // Check if user has password for write access
    const userPassword = getStoredPassword();


    if (userPassword && userPassword === sessionPassword) {

        return 'questioner';
    }


    return 'read';
}

function isValidAdmin() {
    return getUserAccessLevel() === 'admin';
}

function canPostQuestions() {
    const accessLevel = getUserAccessLevel();
    return accessLevel === 'admin' || accessLevel === 'questioner';
}

// Password management functions
function storePassword(password) {
    localStorage.setItem('qaSessionPassword', password);
}

function getStoredPassword() {
    return localStorage.getItem('qaSessionPassword');
}

function storeSessionPassword(sessionId, password) {
    const sessionPasswords = JSON.parse(localStorage.getItem('sessionPasswords') || '{}');
    sessionPasswords[sessionId] = password;
    localStorage.setItem('sessionPasswords', JSON.stringify(sessionPasswords));
}

function getSessionPassword(sessionId) {
    const sessionPasswords = JSON.parse(localStorage.getItem('sessionPasswords') || '{}');
    return sessionPasswords[sessionId];
}

function hasValidPassword() {
    const password = getStoredPassword();
    const sessionPassword = getSessionPassword(currentSessionId);

    // Check if current password matches the session's password
    return password && sessionPassword && password === sessionPassword;
}

function checkPasswordFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPassword = urlParams.get('password');
    if (urlPassword) {
        storePassword(urlPassword);
        return true;
    }
    return false;
}

function disableInteractions() {
    // Disable question form
    if (elements.questionForm) {
        elements.questionForm.style.opacity = '0.5';
        elements.questionForm.style.pointerEvents = 'none';
    }

    // Disable all vote buttons
    const voteButtons = document.querySelectorAll('.vote-btn');
    voteButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    });

    // Disable admin controls
    if (elements.adminControls) {
        elements.adminControls.style.opacity = '0.5';
        elements.adminControls.style.pointerEvents = 'none';
    }
}

// Session management
async function createSession() {
    const passwordInput = elements.createSessionPasswordInput.value.trim();

    if (!passwordInput) {
        showToast('Please enter an admin password to create a session.', 'error');
        return;
    }

    // Store the password for this session
    storePassword(passwordInput);

    showLoading(true);

    try {
        const sessionId = generateSessionId();
        const sessionRef = ref(database, `sessions/${sessionId}`);

        // Store session password for future validation
        storeSessionPassword(sessionId, passwordInput);

        await set(sessionRef, {
            createdAt: serverTimestamp(),
            active: true,
            questionCount: 0,
            password: passwordInput // Include password in session data for Firebase rules
        });

        // Generate admin hash for secure admin authentication
        const adminHash = generateAdminHash(sessionId, passwordInput);

        // Redirect to session with admin privileges using secure hash
        window.location.href = `?session=${sessionId}&ah=${adminHash}&password=${passwordInput}`;

    } catch (error) {
        console.error('Error creating session:', error);
        showToast('Failed to create session. Please try again.', 'error');
        showLoading(false);
    }
}

async function joinSession(sessionId) {


    // Check for password in URL and store it
    checkPasswordFromUrl();

    showLoading(true);

    try {
        const sessionRef = ref(database, `sessions/${sessionId}`);

        const snapshot = await get(sessionRef);


        if (!snapshot.exists()) {
            showToast('Session not found. Please check the session ID.', 'error');

            showLoading(false);
            return false;
        }

        const sessionData = snapshot.val();


        // Store the session's password for validation
        if (sessionData.password) {
            storeSessionPassword(sessionId, sessionData.password);
        }

        if (sessionData.createdAt && isSessionExpired(sessionData.createdAt)) {

            sessionExpired = true;
            elements.sessionStatus.textContent = 'Expired';
            elements.sessionStatus.className = 'status-expired';
            showScreen('expired');
            disableInteractions();
            showLoading(false);
            return false;
        }

        // Check if session is inactive (ended by admin)
        if (sessionData.active === false) {
            showToast('Session has been ended by the admin.', 'info');

            showLoading(false);
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
            return false;
        }

        currentSessionId = sessionId;
        elements.sessionId.textContent = `Session: ${sessionId}`;


        // Get user access level
        const accessLevel = getUserAccessLevel();



        // Show admin controls based on access level
        if (accessLevel === 'admin') {
            // Full admin: show both share and end session buttons
            elements.adminControls.classList.remove('hidden');
            elements.shareSessionBtn.style.display = 'block';
            elements.endSessionBtn.style.display = 'block';

        } else if (accessLevel === 'questioner') {
            // Questioner: show only share session button
            elements.adminControls.classList.remove('hidden');
            elements.shareSessionBtn.style.display = 'block';
            elements.endSessionBtn.style.display = 'none';

        } else {
            // Read-only: hide all admin controls
            elements.adminControls.classList.add('hidden');

        }

        // Show access status based on access level
        switch (accessLevel) {
            case 'admin':
                break;
            case 'questioner':
                // showToast('✍️ Question access enabled! You can ask questions and vote.', 'success');
                break;
            case 'read':
                showToast('👀 Read-only access. Contact session admin for question access.', 'info');
                break;
            default:
                showToast('❌ No access. Please check your session link.', 'error');
        }

        showScreen('session');
        setupSessionListeners();
        showLoading(false);


        return true;

    } catch (error) {
        console.error('Error joining session:', error);
        showToast('Failed to join session. Please try again.', 'error');
        showLoading(false);
        return false;
    }
}

function setupSessionListeners() {
    // Listen for session changes
    const sessionRef = ref(database, `sessions/${currentSessionId}`);
    sessionListener = onValue(sessionRef, (snapshot) => {
        if (snapshot.exists()) {
            const sessionData = snapshot.val();

            if (isSessionExpired(sessionData.createdAt)) {
                sessionExpired = true;
                elements.sessionStatus.textContent = 'Expired';
                elements.sessionStatus.className = 'status-expired';
                disableInteractions();
            }

            if (!sessionData.active) {
                showToast('Session has been ended by the admin.', 'info');
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            }
        }
    });

    // Listen for questions
    const questionsRef = ref(database, `sessions/${currentSessionId}/questions`);
    questionsListener = onValue(questionsRef, (snapshot) => {
        renderQuestions(snapshot.val() || {});
    });
}

// function disableInteractions() {
//     elements.submitBtn.disabled = true;
//     elements.questionInput.disabled = true;
//     elements.submitBtn.textContent = '⏰ Session Expired';

//     // Disable all vote buttons
//     document.querySelectorAll('.vote-btn').forEach(btn => {
//         btn.disabled = true;
//     });
// }

// Question management
async function submitQuestion(questionText) {
    if (sessionExpired) {
        showToast('Session has expired. Cannot submit questions.', 'error');
        return;
    }

    if (!canPostQuestions()) {
        showToast('❌ Question access required to submit questions.', 'error');
        return;
    }

    try {
        const questionsRef = ref(database, `sessions/${currentSessionId}/questions`);
        const newQuestionRef = push(questionsRef);

        await set(newQuestionRef, {
            text: questionText,
            votes: 0,
            answered: false,
            timestamp: serverTimestamp(),
            voters: {},
            password: getStoredPassword() // Include password for validation
        });

        // Update question count
        const sessionRef = ref(database, `sessions/${currentSessionId}`);
        const snapshot = await get(sessionRef);
        const sessionData = snapshot.val();

        await update(sessionRef, {
            questionCount: (sessionData.questionCount || 0) + 1,
            password: getStoredPassword() // Include password for validation
        });

        elements.questionInput.value = '';
        updateCharCount();
        showToast('✅ Question submitted successfully!', 'success');

    } catch (error) {
        console.error('Error submitting question:', error);
        showToast('Failed to submit question. Please try again.', 'error');
    }
}

// Voting system
async function voteQuestion(questionId, increment = true) {
    if (sessionExpired) {
        showToast('Session has expired. Cannot vote.', 'error');
        return;
    }

    if (!canPostQuestions()) {
        showToast('❌ Question access required to vote.', 'error');
        return;
    }

    const userVotes = getUserVotes();
    const hasVoted = userVotes[questionId];

    if (increment && hasVoted) {
        showToast('You have already voted for this question.', 'warning');
        return;
    }

    if (!increment && !hasVoted) {
        showToast('You have not voted for this question.', 'warning');
        return;
    }

    try {
        const questionRef = ref(database, `sessions/${currentSessionId}/questions/${questionId}`);
        const snapshot = await get(questionRef);
        const questionData = snapshot.val();

        const newVoteCount = Math.max(0, (questionData.votes || 0) + (increment ? 1 : -1));
        const voterKey = `voter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const updates = {
            votes: newVoteCount,
            password: getStoredPassword() // Include password for validation
        };

        if (increment) {
            updates[`voters/${voterKey}`] = true;
        }

        await update(questionRef, updates);

        // Update local vote tracking
        if (increment) {
            userVotes[questionId] = true;
        } else {
            delete userVotes[questionId];
        }
        saveUserVotes(userVotes);

        showToast(increment ? '👍 Vote added!' : '👎 Vote removed!', 'success');

    } catch (error) {
        console.error('Error voting:', error);
        showToast('Failed to vote. Please try again.', 'error');
    }
}

// Admin functions
async function markAnswered(questionId) {
    if (!isValidAdmin()) {
        showToast('❌ Full admin access required to mark questions as answered.', 'error');
        return;
    }

    try {
        const questionRef = ref(database, `sessions/${currentSessionId}/questions/${questionId}`);
        await update(questionRef, {
            answered: true,
            password: getStoredPassword() // Include password for validation
        });
        showToast('✅ Question marked as answered!', 'success');
    } catch (error) {
        console.error('Error marking question as answered:', error);
        showToast('Failed to mark question as answered.', 'error');
    }
}

async function deleteQuestion(questionId) {
    if (!isValidAdmin()) {
        showToast('❌ Full admin access required to delete questions.', 'error');
        return;
    }

    // Use custom confirmation modal
    showConfirmation('Are you sure you want to delete this question?', (confirmed) => {
        if (confirmed) {
            try {
                const questionRef = ref(database, `sessions/${currentSessionId}/questions/${questionId}`);
                remove(questionRef);
                showToast('🗑️ Question deleted!', 'success');
            } catch (error) {
                console.error('Error deleting question:', error);
                showToast('Failed to delete question.', 'error');
            }
        }
    });
}

async function endSession() {
    if (!isValidAdmin()) {
        showToast('❌ Full admin access required to end sessions.', 'error');
        return;
    }

    // Use custom confirmation modal
    showConfirmation('Are you sure you want to end this session? This action cannot be undone.', (confirmed) => {
        if (confirmed) {
            try {
                const sessionRef = ref(database, `sessions/${currentSessionId}`);
                update(sessionRef, {
                    active: false,
                    endedAt: serverTimestamp(),
                    password: getStoredPassword() // Include password for validation
                });
                showToast('🛑 Session ended successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } catch (error) {
                console.error('Error ending session:', error);
                showToast('Failed to end session.', 'error');
            }
        }
    });
}

function renderQuestions(questionsData) {
    const questionsList = elements.questionsList;

    if (!questionsData || Object.keys(questionsData).length === 0) {
        questionsList.innerHTML = `
            <div class="no-questions">
                <p>🤔 No questions yet. Be the first to ask!</p>
            </div>
        `;
        return;
    }

    // Convert to array and sort by votes (descending)
    const questionsArray = Object.entries(questionsData)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));

    questionsList.innerHTML = questionsArray.map(question => {
        const hasVoted = hasUserVoted(question.id);
        const isExpired = sessionExpired;

        return `
            <div class="question-card ${question.answered ? 'answered' : ''}">
                <div class="question-timestamp">
                    ${question.timestamp ? formatTimestamp(question.timestamp) : 'Just now'}
                </div>
                
                <div class="question-text">
                    ${escapeHtml(question.text)}
                </div>
                
                <div class="question-footer">
                    <div class="vote-section">
                        <button 
                            class="vote-btn ${hasVoted ? 'voted' : ''}" 
                            onclick="voteQuestion('${question.id}', true)"
                            ${hasVoted || isExpired ? 'disabled' : ''}
                        >
                            👍 ${hasVoted ? 'Voted' : 'Vote'}
                        </button>
                        <span class="vote-count">${question.votes || 0} votes</span>
                    </div>
                    
                    <div class="question-actions">
                        ${isValidAdmin() ? `
                            <div class="admin-actions">
                                <button 
                                    class="admin-btn ${question.answered ? 'answered' : ''}" 
                                    onclick="markAnswered('${question.id}')"
                                    title="${question.answered ? 'Already answered' : 'Mark as answered'}"
                                >
                                    ${question.answered ? '✓ Answered' : 'Mark Answered'}
                                </button>
                                <button 
                                    class="admin-btn delete-btn" 
                                    onclick="deleteQuestion('${question.id}')"
                                    title="Delete question"
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateCharCount() {
    const count = elements.questionInput.value.length;
    elements.charCount.textContent = `${count}/500`;

    if (count > 450) {
        elements.charCount.style.color = '#f56565';
    } else if (count > 400) {
        elements.charCount.style.color = '#ed8936';
    } else {
        elements.charCount.style.color = '#718096';
    }
}

function shareSession() {
    const baseUrl = window.location.origin + window.location.pathname;
    const password = getStoredPassword();

    if (!password) {
        showToast('❌ No password available to share.', 'error');
        return;
    }

    // Always share question-posting access (not admin, not read-only)
    const questionerHash = generateQuestionerHash(currentSessionId, password);
    const shareUrl = `${baseUrl}?session=${currentSessionId}&qh=${questionerHash}&password=${password}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('✍️ Question access link copied! Recipients can ask questions and vote.', 'success');
    }).catch(() => {
        showToast('Failed to copy link. Please copy manually: ' + shareUrl, 'error');
    });
}

// Event listeners
elements.createSessionBtn.addEventListener('click', createSession);

elements.joinSessionBtn.addEventListener('click', () => {
    const input = elements.joinSessionInput.value.trim();
    if (input) {
        const sessionId = extractSessionId(input);
        joinSession(sessionId);
    } else {
        showToast('Please enter a session ID or session URL.', 'error');
    }
});

elements.joinSessionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        elements.joinSessionBtn.click();
    }
});

elements.questionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const questionText = elements.questionInput.value.trim();
    if (questionText) {
        submitQuestion(questionText);
    }
});

elements.questionInput.addEventListener('input', updateCharCount);

elements.shareSessionBtn.addEventListener('click', shareSession);
elements.endSessionBtn.addEventListener('click', endSession);
elements.createNewSessionBtn.addEventListener('click', createSession);

// Make functions globally available for onclick handlers
window.voteQuestion = voteQuestion;
window.markAnswered = markAnswered;
window.deleteQuestion = deleteQuestion;

// Initialize app
function initApp() {

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');

    if (sessionId) {

        joinSession(sessionId);
    } else {

        showScreen('home');
        showLoading(false);
    }

    updateCharCount();

}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (questionsListener) {
        off(ref(database, `sessions/${currentSessionId}/questions`), 'value', questionsListener);
    }
    if (sessionListener) {
        off(ref(database, `sessions/${currentSessionId}`), 'value', sessionListener);
    }
});

// Start the app
initApp();