// ─── Firebase Configuration ───────────────────────────────────────────────
// Replace these values with your actual Firebase project credentials.
// Get them from: https://console.firebase.google.com → Project Settings → Your apps

// ─── Firebase Configuration ───────────────────────────────────────────────
// Replace these values with your actual Firebase project credentials.
// Get them from: https://console.firebase.google.com → Project Settings → Your apps

const firebaseConfig = {
  apiKey:            "AIzaSyBarpAeaj3vtN7tCqCCYfTUe6I-6y71LHQ",
  authDomain:        "sip-smart-5468f.firebaseapp.com",
  projectId:         "sip-smart-5468f",
  storageBucket:     "sip-smart-5468f.appspot.com",
  messagingSenderId: "61586361348",
  appId:             "1:61586361348:web:203b6046bb7dd8bda8f951",
   measurementId: "G-KQ8BVQQ8EZ"
};

// Initialize Firebase (compat build expected by HTML pages)
if (location.protocol === 'file:') {
  console.error('Serving files via file:// prevents Firebase from working correctly. Run a local HTTP server (e.g. `python -m http.server 8000`).');
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      const warn = document.createElement('div');
      warn.style = 'background:#ffe9e9;border:1px solid #ffbcbc;color:#800; padding:12px;font-size:14px;text-align:center;position:fixed;top:0;left:0;right:0;z-index:9999;';
      warn.innerHTML = 'Warning: You are opening files via <strong>file://</strong>. Firebase Auth requires serving pages over <strong>http://</strong>. Run <code>python -m http.server 8000</code> from the project root and open <a href="http://localhost:8000/login.html">http://localhost:8000/login.html</a>.';
      document.body.prepend(warn);
    });
  }
  // Expose a null auth so other scripts don't throw reference errors
  window.auth = null;
  var auth = window.auth;
} else {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase initialized:', firebase.app && firebase.app().name);

  // Firestore instance (compat)
  try {
    window.db = firebase.firestore();
    console.log('Firebase Firestore ready:', !!window.db);
  } catch (err) {
    console.warn('Firestore not available:', err);
    window.db = null;
  }

  // Auth instance (compat) — attach to window for other scripts
  window.auth = firebase.auth();
  var auth = window.auth;
  console.log('Firebase Auth ready:', !!window.auth);
}