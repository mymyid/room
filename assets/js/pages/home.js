import { provider, auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const emptySpace = document.getElementById("empty-info");
const roomList = document.getElementById("room-list");
const URL = "https://so.my.my.id";
var isloading = false
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

getInitialRoom();

async function getInitialRoom() {
  let data = await getRooms();
  await generateList(data);
}

async function generateList(rooms) {
  const dataRooms = Object.keys(rooms);
  if (dataRooms.length > 0) {
    emptySpace.classList.add("hidden");
    roomList.classList.remove('hidden');
    console.log(dataRooms.length)
    roomList.innerHTML = ""
    for (let index = 0; index < dataRooms.length; index++) {
      const element = rooms[dataRooms[index]];
      console.log(element)
      const li = document.createElement("li");
      li.className = "bg-white rounded-xl p-3 mb-3";
      const uid = localStorage.getItem("_userid")
      li.innerHTML = `
        <a href="room.html?id=${element.ID}&uid=${uid}" class="flex">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 mx-3 text-green-600">
                <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <div class="flex flex-row w-full">
                <p class="font-bold flex w-full">${element.Title}.</p>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            </div>
        </a>
      `;
      roomList.append(li);
    }
  } else {
    emptySpace.classList.remove("hidden");
    roomList.classList.add('hidden');
  }

}
async function createRom() {
  if (isloading) return
  isloading = true
  const judul = document.getElementById("judul");

  if (!judul.value) {
    isloading = false
    alert("Silahkan isi judul meeting terlebih dahulu");
    return;
  }

  try {
    const uid = localStorage.getItem("_userid")
    const payload = { judul: judul.value, uid: uid }; // Payload containing the title
    
    const response = await fetch(`${URL}/api/create-room`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    judul.value = "";
    isloading = false
    getInitialRoom()
  } catch (error) {
    isloading = false
    alert(error);
  }
}

async function getRooms() {
  try {
    const response = await fetch(`${URL}/api/rooms`);
    const data = await response.json();
    return data;
  } catch (error) {
    alert(error);
  }
}

console.log("hello cah on home... 👋");

const localVideo = document.getElementById("localVideo");
const peerCamera = document.getElementById("peerCamera");
// Get user media (camera)
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: false,
});
localVideo.srcObject = stream;
