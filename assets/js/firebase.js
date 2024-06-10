// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDKnfbFoXxdvOGTFe4t21UyhamLONrOMx0",
  authDomain: "mymyid-room.firebaseapp.com",
  projectId: "mymyid-room",
  storageBucket: "mymyid-room.appspot.com",
  messagingSenderId: "735785364186",
  appId: "1:735785364186:web:1cdec9cebe61ceee8493e3",
  measurementId: "G-SCL0KQ8QB4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider();
const auth = getAuth(app);
auth.languageCode = "id";

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    localStorage.setItem("_userid", user.uid);
    localStorage.setItem("_name", user.displayName);
    localStorage.setItem("_email", user.email);
    if (
      window.location.pathname == "/" ||
      window.location.pathname == "/index.html"
    ) {
      window.location.href = "home.html";
    }
  } else {
    if (
      window.location.pathname != "/" &&
      window.location.pathname != "/index.html"
    ) {
      window.location.href = "index.html";
    }
  }
});

export { analytics, provider, auth };
