// params for video and captions
const parameters = new URLSearchParams(document.location.href);
const videoURL = parameters.get("video") || false;
const captionsURL = parameters.get("captions") || false;

//for debug
const debug = false;
const preVidValue = "https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM.m3u8";

// element variabs
const videoArea = document.getElementById("videoArea");
const video = document.getElementById("video");
const videoSource = document.getElementById("videoSource");
const warningBody = document.getElementById("warningBody");
const controlsBody = document.getElementById("controlsBody");
const playButton = document.getElementById("playButton");

let paused = true;
let pauseAllowed = false;

// for hiding
let controlsHovered = false;
controlsBody.addEventListener("mouseenter", () => {
    controlsHovered = true;
});
controlsBody.addEventListener("mouseleave", () => {
    controlsHovered = false;
});

// hiding
let hideControlsTimer;
let mouseInsideVideo = false;

function hideControls() {
    if (!paused) {
        controlsBody.classList.add("hidden");
        if (!videoArea.classList.contains("hiddenCursor")) {
            videoArea.classList.add("hiddenCursor");
        }
    }
}

function resetHideControlsTimer() {
    clearTimeout(hideControlsTimer);
    hideControlsTimer = setTimeout(() => {
        if (!controlsHovered) {
            hideControls();
        }
    }, 3000);
}

function showControls() {
    controlsBody.classList.remove("hidden");
    if (videoArea.classList.contains("hiddenCursor")) {
        videoArea.classList.remove("hiddenCursor");
    }
    resetHideControlsTimer();
}

// formatting i stole from good ole gpt
function formatTime(seconds) {
  seconds = Math.floor(seconds);

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n) => String(n).padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }

  return `${mins}:${pad(secs)}`;
}

//mouse position
let mouse = {
    x: 0,
    y: 0
};

// basic debug video for now
if (videoURL) {
    videoSource.src = videoURL;
    video.load();
} else if (!debug) {
    videoSource.src = preVidValue;
    video.load();
} else {
    warningBody.style.display = "flex";
    videoArea.style.display = "none";
}

// aspect ratio changing
function changePlayerRatio(pxWidth, pxHeight) {
    const aspect = pxHeight/pxHeight;
    const width = `min(100vw, calc(100vh * ${pxWidth} / ${pxHeight}))`;
    const height = `min(100vh, calc(100vw * ${pxHeight} / ${pxWidth}))`;
    
    videoArea.style.aspectRatio = aspect;
    videoArea.style.width = width;
    videoArea.style.height = height;
}

const totalTimeCount = document.getElementById("totalTimeVisual");
const currentTimeCount = document.getElementById("currentTimeVisual");

// loading, buffering, res editing, ect...
video.addEventListener("loadedmetadata", (event) => {
    // set video ratio
    changePlayerRatio(video.videoWidth, video.videoHeight);
    
    //set time
    totalTimeCount.textContent = formatTime(video.duration);
    
    // allow pausing
    pauseAllowed = true;
});

// pause function for easy access (:
function pause() {
    if (video.paused) {
        video.play();
        resetHideControlsTimer();
        paused = false;

        playButton.style.backgroundImage = "url(images/playButton.svg)";
    } else {
        video.pause();
        showControls();
        paused = true;
        playButton.style.backgroundImage = "url(images/pauseButton.svg)";
    }
}

// play pause button
playButton.addEventListener("click", function() {
    if (pauseAllowed) {
        pause();
    }
});

// pausing with space
document.addEventListener("keydown", (event) => {
    if (document.activeElement === playButton) return;
    event.preventDefault();
    
    if (event.keyCode === 32 && pauseAllowed) {
        pause();
    }
});

// controls disapearing when hovering off
let hideTimer = null;
videoArea.addEventListener("mouseleave", () => {
    if (!debug) {
        mouseInsideVideo = false;
        hideControls();
    }
});
videoArea.addEventListener("mouseenter", () => {
    mouseInsideVideo = true;
    showControls();
});

// time bar stuff
const timeBar = document.getElementById("timeBarBG");
const timeBarPrev = document.getElementById("timeBarPrev");
const timeBarThumb = document.getElementById("timeBarThumb");
let percent = 0;

timeBarThumb.addEventListener("dragstart", (e) => e.preventDefault());
timeBar.addEventListener("dragstart", (e) => e.preventDefault());

// basic helpful functions
function valueToPercent(min, max, val) {
    return ((val-min)/(max-min))*100;
}

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

// handle movement if bar changes
function updateTimeBar() {
    const timeBarRect = timeBar.getBoundingClientRect();
    const perc = clamp(valueToPercent(timeBarRect.left, timeBarRect.right, mouse.x), 0, 100);
    percent = perc;
    currentTimeCount.textContent = formatTime(video.duration * perc/100);
    timeBarThumb.style.marginLeft = `calc(${perc}% - 0.2rem)`;
    timeBarPrev.style.width = `${perc}%`;
    if (!timeBarHeld) {
        video.currentTime = (perc/100)*video.duration;
    }
}

// mouse movement
videoArea.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;

    if (timeBarHeld) {
        updateTimeBar();
    }

    showControls();
    resetHideControlsTimer();
});
document.addEventListener("mouseleave", () => {
    if (!debug) {
        hideControls();
    }
});

// detection for dragging bar
let timeBarHeld = false;
timeBar.addEventListener("mousedown", (event) => {
    event.preventDefault();
    timeBarHeld = true;
    updateTimeBar();
});
document.addEventListener("mouseup", (event) => {
    if (timeBarHeld) {
        timeBarHeld = false;
        resetHideControlsTimer();
        video.currentTime = (percent/100)*video.duration;
    }
});

//video time update
video.addEventListener("timeupdate", (event) => {
    if (!timeBarHeld) {
        percent = valueToPercent(0, video.duration, video.currentTime);
        
        // update bar
        const timeBarRect = timeBar.getBoundingClientRect();
        currentTimeCount.textContent = formatTime(video.currentTime);
        timeBarThumb.style.marginLeft = `calc(${percent}% - 0.2rem)`;
        timeBarPrev.style.width = `${percent}%`;
    }
});

//video ends auto pause
video.addEventListener("ended", () => {
    playButton.style.backgroundImage = "url(images/pauseButton.svg)";
    paused = true;
    showControls();
});

// fullscreen
const fullscreenButton = document.getElementById("fullscreenButton");
fullscreenButton.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.getElementById("area").requestFullscreen();
        fullscreenButton.style.backgroundImage = "url(images/unfullscreen.svg)";
    } else {
        document.exitFullscreen();
        fullscreenButton.style.backgroundImage = "url(images/fullscreen.svg)";
    }
});
document.addEventListener("fullscreenchange", (event) => {
    if (!document.fullscreenElement) {
        fullscreenButton.style.backgroundImage = "url(images/fullscreen.svg)";
    } else {
        fullscreenButton.style.backgroundImage = "url(images/unfullscreen.svg)";
    }
});

// volume controls
const volumeDetect = document.getElementById("volumeHoverDetect");
const volumeBody = document.getElementById("volumeBody");
const volumeButton = document.getElementById("volumeButton");

volumeDetect.addEventListener("mouseenter", () => {
    volumeDetect.classList.add("shown");
    volumeBody.classList.add("shown");
    volumeButton.classList.add("open");
});

volumeDetect.addEventListener("mouseleave", () => {
    volumeDetect.classList.remove("shown");
    volumeBody.classList.remove("shown");
    volumeButton.classList.remove("open");
});

// settings
const settingsButton = document.getElementById("settingsButton");
const settingsBody = document.getElementById("settingsBody");

settingsButton.addEventListener("click", () => {
    if (settingsBody.classList.contains("shown")) {
        settingsBody.classList.remove("shown");
        settingsButton.classList.add("open");
    } else {
        settingsBody.classList.add("shown");
        settingsButton.classList.remove("open");
    }
});
