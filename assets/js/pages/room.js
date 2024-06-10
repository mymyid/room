import { provider, auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

console.log("hello cah on room... 👋");

const localVideo = document.getElementById("localVideo");
const peerCamera = document.getElementById("peerCamera");
// Get user media (camera)
try {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localVideo.srcObject = stream;
  peerCamera.srcObject = stream;
} catch (error) {
  console.error("Error accessing media devices:", error);
}

document.getElementById("sign-out").addEventListener("click", function () {
  signOut(auth)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert(error);
    });
});
