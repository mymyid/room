console.log("hello cah... 👋");

const localVideo = document.getElementById("localVideo");
const peerCamera = document.getElementById("peerCamera")
// Get user media (camera)
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
});
localVideo.srcObject = stream;

// TODO : Ubah value dengan media stream dari peer nantinya
peerCamera.srcObject = stream