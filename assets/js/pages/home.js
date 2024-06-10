import { provider, auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.getElementById("sign-out").addEventListener("click", function () {
  signOut(auth)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert(error)
    });
});


console.log("hello cah on home... 👋");

const localVideo = document.getElementById("localVideo");
const peerCamera = document.getElementById("peerCamera")
// Get user media (camera)
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
});
localVideo.srcObject = stream;
