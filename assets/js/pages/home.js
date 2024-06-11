import { provider, auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
const URL = "http://127.0.0.1:54889";

document.getElementById("sign-out").addEventListener("click", function () {
  signOut(auth)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert(error);
    });
});

document.getElementById("simpan-button").addEventListener("click", createRom);

async function createRom() {
  const judul = document.getElementById("judul");
  if (!judul) {
    alert("Silahkan isi judul meeting terlebih dahulu")
    return
  }
  
  const payload = { judul: judul.value }; // Payload containing the title
  console.log(payload)
  const response = await fetch(`${URL}/api/create-room`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  console.log(data);
  document.getElementById("roomID").innerText = `Room ID: ${data.roomID}`;
}

console.log("hello cah on home... 👋");

const localVideo = document.getElementById("localVideo");
const peerCamera = document.getElementById("peerCamera");
// Get user media (camera)
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
});
localVideo.srcObject = stream;
