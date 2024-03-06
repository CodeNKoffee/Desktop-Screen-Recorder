// Buttons
const videoElement = document.getElementById("video");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stoptBtn");
const videoSelectBtn = document.getElementById("videoSelectBtn");

videoSelectBtn.addEventListener("click", getVideoSources);
startBtn.addEventListener("click", handleStartRecording);
stopBtn.addEventListener("click", handleStop);

const { desktopCapturer, remote } = require("electron");
const { Menu } = remote;

// Get the available video sources
const getVideoSources = async () => {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => selectSource(source),
      };
    }),
  );

  videoOptionsMenu.popup();
};

// Media recorder instance to capture footage
let mediaRecorder;
const recordedChunks = [];

// Change the video source window to record
const selectSource = async (source) => {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromedMediaSource: "desktop",
        chromedMediaSourceId: source.id,
      },
    },
  };

  // Choose a stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();

  // Create the media recorder
  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
};

// Captures all recorded chunks
const handleDataAvailable = (e) => {
  console.log("Video data available.");
  recordedChunks.push(e.data);
};

const { dialog } = remote;

const { writeFile } = require("fs");

// Saves the video file on the stop
const handleStop = async (e) => {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.webm`,
  });

  console.log(filePath);

  writeFile(filePath, buffer, () => console.log("Video saved successfully!"));
};
