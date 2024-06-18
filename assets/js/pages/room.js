import { provider, auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

console.log("hello cah on room... 👋");
const URL = "http://127.0.0.1:8080";
const localVideo = document.getElementById("localVideo");
const peerCamera = document.getElementById("peerCamera");
var peerConnection
initVideoCall();

async function initVideoCall() {
  // Example usage: Get the 'id' query parameter
  const roomId = getQueryParameter("id");
  console.log("Room ID:", roomId);

  // Get user media (camera)
  const localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  localVideo.srcObject = localStream;

  // Create a new RTCPeerConnection
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // Add tracks from the local localStream to the peer connection
  localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

  // Handle ICE candidates from the peer connection
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      // fetch(`${URL}/api/room/${roomId}/join`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ type: "candidate", data: event.candidate }),
      // });
    }
  };

  // Handle incoming remote tracks
  peerConnection.ontrack = (event) => {
    console.log(event)
    if (peerCamera.srcObject !== event.streams[0]) {
      console.log("onTrack Stream >>", event.streams);
      console.log("onTrack First Stream Data >> ", event.streams[0]);
      // peerCamera.srcObject = event.streams[0];
      console.log("Received remote stream");
    }
  };

  // Handle errors
  peerConnection.onerror = (error) => {
    console.error("PeerConnection error:", error);
  };

  peerConnection.onconnectionstatechange = (event) => {
    console.log("Connection state changed:", peerConnection.connectionState);
  };

  // Create an SDP offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  const uid = localStorage.getItem("_userid");
  // Send the offer to the server and get the answer
  const response = await fetch(`${URL}/api/room/${roomId}/join/${uid}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "offer", data: offer }),
  });

  if (!response.ok) {
    console.error("Failed to get answer from server:", response.statusText);
    if (response.status == 404) {
      alert(`Room ${response.statusText}, Silahkan buat room baru`);
      window.location.href = "home.html";
    }
    return;
  }

  const data = await response.json();
  console.log("data >> ", data);
  console.log("Success Join Room, periodicaly get offer then send onswer");

  var interval = setInterval(function () {
    // Get Offer
    
    getOffer().then((od) => {
      console.log("offer Data >> ", od);
      if (od) clearInterval(interval);
    });
  }, 2000);
  // const answer = new RTCSessionDescription(data.data);

  // // Set the remote description with the server's answer
  // await peerConnection.setRemoteDescription(answer);

  // console.log("WebRTC connection established successfully!");
}

async function getOffer() {
  let offer = false;
  const roomId = getQueryParameter("id");
  const now = new Date();
  console.log("Getting Offer >> ", now);
  const uid = localStorage.getItem("_userid");
  // Send the offer to the server and get the answer
  const response = await fetch(`${URL}/api/room/${roomId}/data/${uid}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    console.error("Failed to get answer from server:", response.statusText);
    return;
  }

  const res = await response.json();
  console.log("Offer >> ", res);
  const offersData = res.room.Offers;
  if (res.room.Offers.length > 0) {
    // Get Offer for me
    let offerToMe = offersData.filter((item) => item.Uid != uid);
    console.log("Offer to me >> ", offerToMe);
    if (offerToMe.length > 0) {
      const answer = new RTCSessionDescription(offerToMe[0].Offer);
      console.log("Sending Answer >> ", answer);
      offer = true;
      sendAnswer(answer);
    }
  }
  return offer;
}

async function sendAnswer(answer) {
  const now = new Date();
  console.log("Send Answer >> ", now);
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

  var intervalAnswer = setInterval(function () {
    let answerData = getAnswer();
    if (answerData) clearInterval(intervalAnswer);
  }, 2000);
}

async function getAnswer() {
  const roomId = getQueryParameter("id");
  const now = new Date();
  console.log("Getting Offer >> ", now);
  const uid = localStorage.getItem("_userid");
  // Send the offer to the server and get the answer
  const response = await fetch(`${URL}/api/room/${roomId}/data/${uid}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    console.error("Failed to get answer from server:", response.statusText);
    return;
  }

  const res = await response.json();
  const answersData = res.room.Answer;
  console.log("data answer >>", answersData);
  if (res.room.Answer.length > 0) {
    // Get Offer for me
    const answerData = res.room.Answer;
    let answerForMe = answerData.filter((item) => item.Uid != uid);
    if (answerForMe.length > 0) {
      // TODO
      // Set rtc client
      const remoteAnswer = answerForMe[0];
      console.log("SUCCESS GETTING DATA, LET SET STRAEM DATA", answerForMe);
      // Set the remote description with the server's answer
      await peerConnection.setRemoteDescription(remoteAnswer.Answer);
      document.getElementById('status-connection').innerHTML = "Connected"
    }
  }
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

function getQueryParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}
