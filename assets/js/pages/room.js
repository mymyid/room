import { provider, auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

console.log("hello cah on room... 👋");

const URL = "https://so.my.my.id";
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
let localStream = null;
let remoteStream = null;

let peerConnection = null;

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

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

async function init() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localStream = stream;
  localVideo.srcObject = localStream;
  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;

  console.log("Stream:", localVideo.srcObject);

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
    return handleHost();
  } else {
    console.log("Hanlde Client");
    return handleClient();
  }
}

async function handleHost() {
  console.log("Create PeerConnection with configuration: ", configuration);
  peerConnection = new RTCPeerConnection(configuration);

  registerPeerConnectionListeners();

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.onicecandidate = async (event) => {
    if (!event.candidate) {
      console.log("Got final candidate!");
      return;
    }
    console.log("Got candidate: ", event.candidate);
    const response = await fetch(`${URL}/api/room/${roomId}/candidate/${uid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "candidate",
        data: event.candidate,
      }),
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
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  console.log("Created offer:", offer);

  const response = await fetch(`${URL}/api/room/${roomId}/join/${uid}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "offer",
      data: offer,
    }),
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

  peerConnection.ontrack = (event) => {
    console.log("Got remote track:", event.streams[0]);
    event.streams[0].getTracks().forEach((track) => {
      console.log("Add a track to the remoteStream:", track);
      remoteStream.addTrack(track);
    });
  };

  // Get Answer
  var intervalAnswer = setInterval(function () {
    getAnswer().then((od) => {
      if (od) clearInterval(intervalAnswer);
    });
  }, 5000);

  //   // Get IceCandidate
  //   var intervalAnswer = setInterval(function () {
  //     getAnswer().then((od) => {
  //       if (od) clearInterval(intervalAnswer);
  //     });
  //   }, 5000);
}

async function handleClient() {
  peerConnection = new RTCPeerConnection(configuration);
  registerPeerConnectionListeners();
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.onicecandidate = async (event) => {
    if (!event.candidate) {
      console.log("Got final candidate!");
      return;
    }
    console.log("Got candidate: ", event.candidate);
    const response = await fetch(`${URL}/api/room/${roomId}/candidate/${uid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "candidate",
        data: event.candidate,
      }),
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
    console.log("Success send candidate to server:", data);
  };

  peerConnection.ontrack = (event) => {
    console.log("Got remote track:", event.streams[0]);
    event.streams[0].getTracks().forEach((track) => {
      console.log("Add a track to the remoteStream:", track);
      remoteStream.addTrack(track);
    });
  };

  var interval = setInterval(function () {
    getOffer().then((od) => {
      if (od) clearInterval(interval);
    });
  }, 5000);
}

async function getOffer() {
  let offer = false;

  const response = await fetch(`${URL}/api/room/${roomId}/data/${uid}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    console.error("Failed to get offer from server:", response.statusText);
    return;
  }

  const res = await response.json();
  console.log("Get Offer", res);
  if (res.room.Offer.type != "unknown") {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(res.room.Offer)
    );
    const answer = await peerConnection.createAnswer();
    console.log("Created answer:", answer);
    await peerConnection.setLocalDescription(answer);
    sendAnswer(answer);
    offer = true;
    getIceCandidate();
  }
  return offer;
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

  const res = await response.json();
  console.log("Res Answer", res);
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

async function getAnswer() {
  let answer = false;

  const response = await fetch(`${URL}/api/room/${roomId}/data/${uid}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    console.error("Failed to get answer from server:", response.statusText);
    return answer;
  }

  const res = await response.json();
  console.log("Get Answer", res);

  if (res.room.Answer.type != "unknown") {
    const rtcSessionDescription = new RTCSessionDescription(res.room.Answer);
    await peerConnection.setRemoteDescription(rtcSessionDescription);
    answer = true;
    getIceCandidate();
  }
  return answer;
}

async function getIceCandidate() {
  try {
    const response = await fetch(`${URL}/api/room/${roomId}/candidate/${uid}`);
    const data = await response.json();
    console.log(data.room.HostIceCandidate);
    if (data.room.ClientIceCandidate) {
      data.room.ClientIceCandidate.forEach(async (data) => {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data));
      });
    }
  } catch (error) {
    alert(error);
  }
}

function getQueryParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function registerPeerConnectionListeners() {
  peerConnection.addEventListener("icegatheringstatechange", () => {
    console.log(
      `ICE gathering state changed: ${peerConnection.iceGatheringState}`
    );
  });

  peerConnection.addEventListener("connectionstatechange", () => {
    console.log(`Connection state change: ${peerConnection.connectionState}`);
    document.getElementById("status-connection").innerHTML = peerConnection.signalingState
  });

  peerConnection.addEventListener("signalingstatechange", () => {
    console.log(`Signaling state change: ${peerConnection.signalingState}`);
  });

  peerConnection.addEventListener("iceconnectionstatechange ", () => {
    console.log(
      `ICE connection state change: ${peerConnection.iceConnectionState}`
    );
  });
}

init();
