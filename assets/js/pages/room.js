import { provider, auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

console.log("hello cah on room... 👋");
const URL = "https://so.my.my.id";
const localVideo = document.getElementById("localVideo");
const peerCamera = document.getElementById("peerCamera");
var peerConnection;
peerCamera.autoplay = true;
peerCamera.muted = false;
var loadingAnswer = false
var loadingOffer = false
var isconnected = false
initVideoCall();

async function initVideoCall() {
  const roomId = getQueryParameter("id");
  console.log("Room ID:", roomId);
  const uid = localStorage.getItem("_userid");
  console.log("UID:", uid);

  const localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });

  console.log("localStream >> ", localStream);
  localVideo.srcObject = localStream;

  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  localStream.getTracks().forEach((track) => {
    console.log('track >> ', track, localStream)
    return peerConnection.addTrack(track, localStream)
  });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      // TODO : send candidate ke api, dan get di lawan, lalu laukan addIceCandidate di peerconnection
      // ini digunakan tunuk memastikan routing video stream berjalan, sehingga antar peer tau sumber komunikasinya
    }
  };

  peerConnection.ontrack = (event) => {
    if (peerCamera.srcObject !== event.streams[0]) {
      console.log(event)
      peerCamera.autoplay = true
      // peerCamera.srcObject = event.streams[0];
      peerCamera.srcObject = event.streams[0];
      // peerCamera.srcObject = localStream
      console.log("Received remote stream", peerCamera, event.streams[0]);
    }
  };

  peerConnection.onconnectionstatechange = (event) => {
    console.log("Connection state changed:", peerConnection.connectionState);
  };

  let room
  const rooms = await getRooms()
  const dataRooms = Object.keys(rooms);
  for (let index = 0; index < dataRooms.length; index++) {
    const element = rooms[dataRooms[index]];
    if (element.ID == roomId) {
      room = element
    }
  }

  if (room.HostUid == uid) {
    console.log("Hanlde Host")
    return handleHost(roomId, uid)
  } else {
    console.log("Hanlde Client")
    return handleClient(roomId, uid)
  }
  
}

async function getOffer() {
  let offer = false;
  const roomId = getQueryParameter("id");
  const uid = localStorage.getItem("_userid");

  if (loadingOffer) return

  loadingOffer = true

  const response = await fetch(`${URL}/api/room/${roomId}/data/${uid}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    console.error("Failed to get offer from server:", response.statusText);
    return;
  }

  const res = await response.json();
  let offerData = null;

  if (res.room.HostUid == uid) {
    const clientData = res.room.ClientData.Offer;
    if (clientData.type != "offer") {
      console.log("No participant offer available");
    } else {
      console.log("Received offer from participant:", clientData);
      offer = true;
      offerData = clientData;
    }
  } else {
    const hostData = res.room.HostData.Offer;
    if (hostData.type != "offer") {
      console.log("No host offer available, waiting for host to join");
    } else {
      console.log("Received offer from host:", hostData);
      offer = true;
      offerData = hostData;
    }
  }

  if (offer) {
    try {
      console.log("Setting remote description with offer:", offerData);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offerData));
      console.log("Remote description set:", peerConnection.remoteDescription);
      const answer = await peerConnection.createAnswer();
      console.log("Created local answer:", answer);
      await peerConnection.setLocalDescription(answer);
      console.log("Local description set:", peerConnection.localDescription);
      sendAnswer(answer);
    } catch (error) {
      console.error("Failed to set remote description or create answer:", error);
    }
  }

  loadingOffer = false
  return offer;
}

async function sendAnswer(answer) {
  const roomId = getQueryParameter("id");
  const uid = localStorage.getItem("_userid");

  const response = await fetch(`${URL}/api/room/${roomId}/join/${uid}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "answer", data: answer }),
  });

  if (!response.ok) {
    console.error("Failed to send answer to server:", response.statusText);
    return;
  }

  document.getElementById("status-connection").innerHTML = "Connected";
  isconnected = true;

  // var intervalAnswer = setInterval(function () {
  //   let answerData = getAnswer();
  //   if (answerData) clearInterval(intervalAnswer);
  // }, 5000);
}

async function getAnswer() {
  let answer = false;
  const roomId = getQueryParameter("id");
  const uid = localStorage.getItem("_userid");

  console.log("loadingAnswer >> ", loadingAnswer, "isconnected >> ", isconnected)
  if (loadingAnswer == true && isconnected == false) return

  loadingAnswer = true

  const response = await fetch(`${URL}/api/room/${roomId}/data/${uid}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    console.error("Failed to get answer from server:", response.statusText);
    loadingAnswer = false
    return answer;
  }

  const res = await response.json();
  let answersData;

  if (res.room.HostUid == uid) {
    const clientData = res.room.ClientData.Answer;
    if (clientData.type == "unknown") {
      console.log("No participant answer available");
    } else {
      console.log("Received answer from participant:", clientData);
      answer = true;
      answersData = clientData;
    }
  } else {
    const hostData = res.room.HostData.Answer;
    if (hostData.type == "unknown") {
      console.log("No host answer available, waiting for host to join");
    } else {
      console.log("Received answer from host:", hostData);
      answer = true;
      answersData = hostData;
    }
  }

  if (answer && isconnected == false) {
    try {
      console.log("Setting remote description with answer:", answersData);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answersData));
      console.log("Remote description set:", peerConnection.remoteDescription);
      document.getElementById("status-connection").innerHTML = "Connected";
      isconnected = true;

      console.log('isconnected >> ', isconnected)
    } catch (error) {
      console.error("Failed to set remote description:", error);
    }
  }
  loadingAnswer = false
  return answer;
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

document.getElementById("peerCamera").addEventListener('click', () => {
  console.log(peerCamera.srcObject)
  if (peerCamera.srcObject) {
    console.log("Play!!")
      peerCamera.play().then(() => {
          console.log("Playback started after user interaction.");
      }).catch((error) => {
          console.error("Playback error:", error);
      });
  }
});

function getQueryParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
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

async function handleClient(roomId, uid) {
  // Get Offer
  var interval = setInterval(function () {
    getOffer().then((od) => {
      if (od) clearInterval(interval);
    });
  }, 5000);
  // Create Answer

  // Send Answer

  // Get Status Connection

  // Update Status connection
}

async function handleHost(roomId, uid) {
  // Send Offer
  const offer = await peerConnection.createOffer();
  console.log("Created local offer:", offer);
  await peerConnection.setLocalDescription(offer);
  console.log("Local description set:", peerConnection.localDescription);

  const response = await fetch(`${URL}/api/room/${roomId}/join/${uid}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "offer", data: offer }),
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
  console.log("Received answer from server:", data);

  console.log("Successfully joined room, periodically getting offer then sending answer");

  // Get Answer
  var intervalAnswer = setInterval(function () {
    getAnswer().then((od) => {
      if (od) clearInterval(intervalAnswer);
    });
  }, 5000);

  // Set Status Connection

  // Update Status Connection
}