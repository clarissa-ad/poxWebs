// Function to update the clock every second
function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    document.getElementById('hours').textContent = hours;
    document.getElementById('minutes').textContent = minutes;
    document.getElementById('seconds').textContent = seconds;
}

// Update clock immediately and set interval to update every second
updateClock();
setInterval(updateClock, 1000);

// Text changing functionality (multilingual greeting)
const words = ["Time", "L'heure", "Tiempo", "Zeit", "Tempo", "時間"];
let currentIndex = 0;

function updateText() {
    const textElement = document.getElementById("changing-text");

    // Fade-out effect
    textElement.style.opacity = 0;

    // Change the word after fade-out
    setTimeout(() => {
        textElement.textContent = words[currentIndex];
        textElement.style.opacity = 1; // Fade-in effect

        // Move to the next word, loop back to the start if at the end
        currentIndex = (currentIndex + 1) % words.length;
    }, 1000); // Match the fade-out duration
}

// Start the cycle and repeat every 4 seconds
updateText();
setInterval(updateText, 4000);

// Device detection for mobile devices
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Buttons and other elements
const uploadImageBtn = document.getElementById('uploadImageBtn');
const cameraBtn = document.getElementById('cameraBtn');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');
const cameraStream = document.getElementById('cameraStream');
const video = document.getElementById('video');
const captureBtn = document.getElementById('captureBtn');
const submitBtn = document.getElementById('submitBtn'); // The "Submit Image" button

// Initially hide the submit button
submitBtn.style.display = 'none';

// Event listener for uploading an image
uploadImageBtn.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*'; // Allow images only
    fileInput.click();

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                previewImage.src = e.target.result;
                imagePreview.style.display = 'block';

                // Show the submit button after image upload
                submitBtn.style.display = 'block'; // Show the submit button
            };
            reader.readAsDataURL(file);
        }
    });
});

// Event listener for the "Submit" button
submitBtn.addEventListener('click', () => {
    const fileInput = document.querySelector('input[type="file"]');
    const file = fileInput ? fileInput.files[0] : null;

    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        // Send the image to Flask for prediction
        fetch('/predict', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.class_id !== undefined) {
                // Save the prediction data to localStorage
                localStorage.setItem('predictionResult', JSON.stringify(data));

                // Redirect to results page (which is rendered by Flask)
                window.location.href = '/results';  // Flask will render results page
            } else {
                console.error('Error:', data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
});

// Event listener for the "Capture" button (for camera use)
captureBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');

    previewImage.src = imageData;
    imagePreview.style.display = 'block';

    // Stop the video stream after capture
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
    cameraStream.style.display = 'none';

    // Show the submit button after capture
    submitBtn.style.display = 'block'; // Show the submit button

    // Send the captured image to Flask for prediction
    const formData = new FormData();
    formData.append('file', dataURLtoBlob(imageData));

    fetch('/predict', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.class_id !== undefined) {
            // Save the prediction data to localStorage
            localStorage.setItem('predictionResult', JSON.stringify(data));

            // Redirect to results page (which is rendered by Flask)
            window.location.href = '/results';  // Flask will render results page
        } else {
            console.error('Error:', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// Helper function to convert Data URL to Blob
function dataURLtoBlob(dataURL) {
    const [metadata, base64Data] = dataURL.split(',');
    const byteString = atob(base64Data);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uintArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
        uintArray[i] = byteString.charCodeAt(i);
    }

    return new Blob([uintArray], { type: 'image/png' });
}
