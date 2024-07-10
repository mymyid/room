import { provider, auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

console.log("hello cah on room... 👋");
const URL = "http://127.0.0.1:8080";
const localVideo = document.getElementById("localVideo");
const peerCamera = document.getElementById("peerCamera");
var peerConnection;
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
  console.log("localStream >> ", localStream)
  localVideo.srcObject = localStream;

  // Create a new RTCPeerConnection
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // Add tracks from the local localStream to the peer connection
  localStream
    .getTracks()
    .forEach((track) => peerConnection.addTrack(track, localStream));

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
    console.log(event);
    if (peerCamera.srcObject !== event.streams[0]) {
      console.log("onTrack Stream >>", event.streams);
      console.log("onTrack First Stream Data >> ", event.streams[0]);
      console.log(peerCamera)
      peerCamera.srcObject = event.streams[0];
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
  console.log("offer >> ", { type: "offer", data: offer })
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
  console.log("Offer >> ", res, uid);
  let offerData = null;
  if (res.room.HostUid == uid) {
    const clientData = res.room.ClientData.Offer;
    if (clientData.type != "offer") {
      console.log("No participant");
    } else {
      console.log("Send Answer to participant", clientData);
      offer = true;
      offerData = clientData;
    }
    console.log("Offer Data Client >> ", offerData)
  } else {
    const hostData = res.room.HostData.Offer;
    if (hostData.type != "offer") {
      console.log("No Host, please wait host to join");
    } else {
      console.log("Send Answer to host");
      offer = true;
      offerData = hostData;
    }
    console.log("Offer Data Host >> ", offerData)
  }

  if (offer) {
    // const answer = new RTCSessionDescription(offerData);
    console.log('offerData >> ', offerData)
    const answer = await peerConnection.createAnswer()
            .then((answer) => {
              return peerConnection.setLocalDescription(answer);
            })
            .catch((err) => {
              console.log("ERROR >> ",err)
            });
    console.log("Sending Answer >> ", answer);
    offer = true;
    sendAnswer(answer);
  }
  // const offersData = res.room.Offers;
  // if (res.room.Offers.length > 0) {
  //   // Get Offer for me
  //   let offerToMe = offersData.filter((item) => item.Uid != uid);
  //   console.log("Offer to me >> ", offerToMe);
  //   if (offerToMe.length > 0) {
  //     const answer = new RTCSessionDescription(offerToMe[0].Offer);
  //     console.log("Sending Answer >> ", answer);
  //     offer = true;
  //     sendAnswer(answer);
  //   }
  // }
  return offer;
}

async function sendAnswer(answer) {
  const now = new Date();
  console.log("Send Answer >> ", now, answer);
  const roomId = getQueryParameter("id");
  const uid = localStorage.getItem("_userid");
  console.log("answer >> ", { type: "answer", data: answer })
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
  let answer = false
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
    return answer;
  }

  const res = await response.json();
  let answersData;
  console.log("data answer >>", res, res.room.Answer);
  if (res.room.HostUid == uid) {
    const clientData = res.room.ClientData.Answer;
    if (clientData.type == "unknown") {
      console.log("No participant");
    } else {
      console.log("Receive Answer from participant", clientData);
      answer = true
      answersData = clientData;
    }
    console.log("Offer Data Client >> ", answersData)
  } else {
    const hostData = res.room.HostData.Answer;
    if (hostData.type == "unknown") {
      console.log("No Host, please wait host to join");
    } else {
      console.log("Receive Answer from host");
      answer = true
      answersData = hostData;
    }
    console.log("Answer Data Host >> ", answersData)
  }
  if (answer) {
    // TODO
    // Set rtc client
    console.log("SUCCESS GETTING DATA, LET SET STRAEM DATA", answersData);
    // Set the remote description with the server's answer
    await peerConnection.setRemoteDescription(answersData);
    await peerConnection.createAnswer(answersData)
    document.getElementById("status-connection").innerHTML = "Connected";
  }
  return answer
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
