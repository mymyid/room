import { provider, auth } from "../firebase.js";
import {
  signInWithPopup,
  browserSessionPersistence,
  setPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.getElementById("sign-in").addEventListener("click", googleSignin);

function googleSignin() {
  setPersistence(auth, browserSessionPersistence)
    .then(() => {
      return signInWithPopup(auth, provider)
        .then((result) => {
          const user = result.user;
          localStorage.setItem("_userid", user.uid);
          localStorage.setItem("_name", user.displayName);
          localStorage.setItem("_email", user.email);
        //   window.location.href = "home.html";
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          alert(`[${errorCode}] - ${errorMessage}`);
        });
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      alert(`[${errorCode}] - ${errorMessage}`);
    });
}
