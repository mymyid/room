import { provider, auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

console.log("hello cah on room... 👋");
const URL = "http://127.0.0.1:8080";
const localVideo = document.getElementById("localVideo");
const peerCamera = document.getElementById("peerCamera");
var localIceCandidate = []
var remoteIceCandidate = []

peerCamera.autoplay = true;
peerCamera.muted = false;
var loadingAnswer = false;
var loadingOffer = false;
var isconnected = false;

const roomId = getQueryParameter("id");
const uid = localStorage.getItem("_userid");

document.getElementById("sign-out").addEventListener("click", function () {
  signOut(auth)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert(error);
    });
});

// document.getElementById("peerCamera").addEventListener("click", () => {
//   console.log(peerCamera.srcObject);
//   if (peerCamera.srcObject) {
//     console.log("Play!!");
//     peerCamera
//       .play()
//       .then(() => {
//         console.log("Playback started after user interaction.");
//       })
//       .catch((error) => {
//         console.error("Playback error:", error);
//       });
//   }
// });

const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});

peerConnection.onicecandidate = (event) => {
  // Handle multiple icecandidte
  console.log("ICECandidate", event, event.candidate)
  if (event.candidate) {
    localIceCandidate.push(event.candidate)
    document.getElementById("localIceCandidate").innerHTML = "localIceCandidate >> " + JSON.stringify(event.candidate);
    console.log("Get Local IceCandidate", localIceCandidate)

    fetch(`${URL}/api/room/${roomId}/candidate/${uid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "candidate", data: event.candidate }),
    })
      .then((res) => {
        if (!res.ok) {
        }
        return res.json();
      })
      .then((res) => {
        console.log("success send candidate >> ", res)
        var interval = setInterval(function () {
          getIceCandidate().then((od) => {
            if (od) clearInterval(interval);
          });
        }, 5000);
      })
      .catch((err) => {
        alert(err);
      });
  }
};

peerConnection.ontrack = (event) => {
  if (peerCamera.srcObject !== event.streams[0]) {
    console.log(event);
    peerCamera.autoplay = true;
    // peerCamera.srcObject = event.streams[0];
    peerCamera.srcObject = event.streams[0];
    document.getElementById("remoteStream").innerHTML = "remoteStream >> " + event.streams[0].id;
    // peerCamera.srcObject = localStream
    console.log("Received remote stream", peerCamera, event.streams[0]);
  }
};

peerConnection.onconnectionstatechange = (event) => {
  console.log("Connection state changed:", peerConnection.connectionState);
};

initVideoCall();

async function initVideoCall() {

  const localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });

  console.log("localStream >> ", localStream);
  localVideo.srcObject = localStream;
  document.getElementById("localStream").innerHTML = "localStream >> " + localStream.id;

  localStream.getTracks().forEach((track) => {
    return peerConnection.addTrack(track, localStream);
  });

  let room;
  const rooms = await getRooms();
  const dataRooms = Object.keys(rooms);
  if (dataRooms.length == 0) {
    alert(`Room tidak tersedia`);
    window.location.href = "home.html";
    return;
  }
  for (let index = 0; index < dataRooms.length; index++) {
    const element = rooms[dataRooms[index]];
    if (element.ID == roomId) {
      room = element;
    }
  }

  if (room.HostUid == uid) {
    console.log("Hanlde Host");
    return handleHost(roomId, uid);
  } else {
    console.log("Hanlde Client");
    return handleClient(roomId, uid);
  }
}

async function getOffer() {
  let offer = false;

  if (loadingOffer) return;

  loadingOffer = true;

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

  console.log('getOffer',res.room.HostUid, uid, res.room.HostUid == uid)
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
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offerData)
      );
      console.log("Remote description set:", peerConnection.remoteDescription);
      const answer = await peerConnection.createAnswer();
      console.log("Created local answer:", answer);
      await peerConnection.setLocalDescription(answer);
      console.log("Local description set:", peerConnection.localDescription);
      sendAnswer(answer);
    } catch (error) {
      console.error(
        "Failed to set remote description or create answer:",
        error
      );
    }
  }

  loadingOffer = false;
  return offer;
}

async function getIceCandidate() {
  let candidate = false;

  const response = await fetch(`${URL}/api/room/${roomId}/data/${uid}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    console.error("Failed to get offer from server:", response.statusText);
    return;
  }

  const res = await response.json();
  let candidateData = null;

  console.log('getIceCandidate',res.room.HostUid, uid, res.room.HostUid == uid)
  if (res.room.HostUid == uid) {
    const clientData = res.room.ClientData.Candidate;
    if (clientData.candidate == "") {
      console.log("No participant offer available");
    } else {
      console.log("Received offer from participant:", clientData);
      candidate = true;
      candidateData = clientData;
    }
  } else {
    const hostData = res.room.HostData.Candidate;
    if (hostData.candidate == "") {
      console.log("No host offer available, waiting for host to join");
    } else {
      console.log("Received offer from host:", hostData);
      candidate = true;
      candidateData = hostData;
    }
  }

  if (candidate) {
    try {
      console.log("Setting remote description with candidate:", candidateData);
      peerConnection.addIceCandidate(candidateData);
      remoteIceCandidate.push(candidateData)
      document.getElementById("remoteIceCandidate").innerHTML = "remoteIceCandidate >> " + JSON.stringify(remoteIceCandidate);
    } catch (error) {
      console.error(
        "Failed to set remote description for candidate:",
        error
      );
    }
  }

  return candidate;
}

async function sendAnswer(answer) {

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

  if (loadingAnswer == true && isconnected == false) return;

  loadingAnswer = true;

  const response = await fetch(`${URL}/api/room/${roomId}/data/${uid}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    console.error("Failed to get answer from server:", response.statusText);
    loadingAnswer = false;
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
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answersData)
      );
      console.log("Remote description set:", peerConnection.remoteDescription);
      document.getElementById("status-connection").innerHTML = "Connected";
      isconnected = true;

      console.log("isconnected >> ", isconnected);
    } catch (error) {
      console.error("Failed to set remote description:", error);
    }
  }
  loadingAnswer = false;
  return answer;
}

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
  console.log("Create offer:");
  const offer = await peerConnection.createOffer();
  console.log("Offer reated:", offer);
  console.log("peerConnection.setLocalDescription:", offer);
  await peerConnection.setLocalDescription(offer);
  console.log("Local description set:", peerConnection.localDescription);

  const response = await fetch(`${URL}/api/room/${roomId}/join/${uid}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "offer", data: peerConnection.localDescription }),
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

  console.log(
    "Successfully joined room, periodically getting offer then sending answer"
  );

  // Get Answer
  var intervalAnswer = setInterval(function () {
    getAnswer().then((od) => {
      if (od) clearInterval(intervalAnswer);
    });
  }, 5000);

  // Set Status Connection

  // Update Status Connection
}
