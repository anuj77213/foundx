import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getFirestore} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {getFunctions} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

const firebaseConfig = {
  apiKey: "AIzaSyCA0OygFrMTwLNHv1LAlGuzNzgtviwczGw",
  authDomain: "foundx-2a9aa.firebaseapp.com",
  projectId: "foundx-2a9aa",
  storageBucket: "foundx-2a9aa.firebasestorage.app",
  messagingSenderId: "1003170807823",
  appId: "1:1003170807823:web:46b33e2ed309519d16637a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const fn = getFunctions(app, 'asia-south1');
