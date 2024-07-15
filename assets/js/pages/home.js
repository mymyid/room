import { provider, auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const emptySpace = document.getElementById("empty-info");
const URL = "https://so.my.my.id";
var isloading = false;
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
document
  .getElementById("refresh-button")
  .addEventListener("click", getInitialRoom);

getInitialRoom();

async function getInitialRoom() {
  let data = await getRooms();
  await generateList(data);
}

async function generateList(rooms) {
  const dataRooms = Object.keys(rooms);
  if (dataRooms.length > 0) {
    emptySpace.classList.add("hidden");
    roomList.classList.remove("hidden");
    console.log(dataRooms.length);
    roomList.innerHTML = "";
    for (let index = 0; index < dataRooms.length; index++) {
      const element = rooms[dataRooms[index]];
      console.log(element);
      const li = document.createElement("li");
      li.className = "";
      const uid = localStorage.getItem("_userid");
      let span = ``;
      if (element.HostUid == uid) {
        span = `<span class="md:ml-3 font-bold text-2xs bg-green-500 rounded-full px-2 text-white">me<span>`;
      }
      li.innerHTML = `
        <div class="flex flex-row">
          <a href="room.html?id=${element.ID}&uid=${uid}" class="flex w-full bg-white rounded-xl p-3 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 mr-4 mt-1 text-green-600">
                <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <div class="flex flex-row w-full items-center">
                <div class="flex w-full flex-col">
                  <p class="font-bold">${element.Title}.</p>
                  <p class="font-thin text-xs">ID   : ${element.ID}.</p>
                  <p class="font-thin text-xs">Host : ${element.Host} ${span}.</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            </div>
          </a>
          <button onClick="window.deleteRoom('${element.ID}')">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 text-red-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      `;
      roomList.append(li);
    }
  } else {
    emptySpace.classList.remove("hidden");
    roomList.classList.add("hidden");
  }
}
async function createRom() {
  if (isloading) return;
  isloading = true;
  const judul = document.getElementById("judul");

  if (!judul.value) {
    isloading = false;
    alert("Silahkan isi judul meeting terlebih dahulu");
    return;
  }

  try {
    const uid = localStorage.getItem("_userid");
    const name = localStorage.getItem("_name");
    const host = localStorage.getItem("_email");
    const payload = {
      judul: judul.value,
      uid: uid,
      host: host,
      host_name: name,
    };

    const response = await fetch(`${URL}/api/create-room`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    judul.value = "";
    isloading = false;
    getInitialRoom();
  } catch (error) {
    isloading = false;
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

async function deleteRoom(id) {
  const response = await fetch(`${URL}/api/rooms/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    console.error("Failed to get answer from server:", response.statusText);
    if (response.status == 404) {
      alert(`Room ${response.statusText}, please create a new room`);
      window.location.href = "home.html";
    }
    return;
  }

  const data = await response.json();
  console.log("Success send offer to server:", data);
  getInitialRoom();
}

window.deleteRoom = deleteRoom;

console.log("hello cah on home... 👋");

const localVideo = document.getElementById("localVideo");
const peerCamera = document.getElementById("peerCamera");

try {
  // Request access to the camera and microphone
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localVideo.srcObject = stream;
} catch (error) {
  if (error.name === "NotAllowedError") {
    console.error("Permissions denied for camera and microphone.");
    alert(
      "Silahkan ijinkan aplikasi mengakses kamera dan microphone Anda untuk dapat menggunakan layanan ini."
    );
  } else if (error.name === "NotFoundError") {
    console.error("No camera or microphone found.");
    alert("Kamera atau mikrofon tidak dapat ditemukan di perangkat Anda");
  } else {
    console.error("Error accessing camera and microphone: ", error);
    alert(`Tidak dapat mengakses kamera atau mikrofon Anda,   ${error}`);
  }
}
