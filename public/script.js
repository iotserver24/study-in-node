// Timer functionality
let timer;
let timeLeft = 1500; // 25 minutes in seconds
let isStudySession = true;
let isTimerRunning = false;
let totalTime = 1500;
const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimer');
const pauseTimerBtn = document.getElementById('pauseTimer');
const studyTimeInput = document.getElementById('studyTime');
const breakTimeInput = document.getElementById('breakTime');
const timerProgress = document.querySelector('.timer-progress');

// Add this variable at the top of your script
const focusDisplay = document.getElementById('focusDisplay');

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const progress = ((totalTime - timeLeft) / totalTime) * 565.48; // 565.48 is the circumference of the circle
    timerProgress.style.strokeDasharray = `${progress} 565.48`;
}

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        startTimerBtn.textContent = 'Pause';
        startTimerBtn.classList.add('pulse');
        sessionStartTime = Date.now();
        
        timer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (isStudySession && !isDistracted) {
                totalFocusTime++;
            }
            updatePlant();
            if (timeLeft === 0) {
                clearInterval(timer);
                isTimerRunning = false;
                startTimerBtn.textContent = 'Start';
                startTimerBtn.classList.remove('pulse');
                if (isStudySession) {
                    const focusPercentage = (totalFocusTime / totalTime) * 100;
                    focusDisplay.textContent = `Session completed! Focus: ${focusPercentage.toFixed(2)}%`;
                    timeLeft = breakTimeInput.value * 60;
                    totalTime = timeLeft;
                    isStudySession = false;
                    totalFocusTime = 0;
                    initialPlantSize = plantSize; // Store the final plant size
                    startTimer(); // Automatically start break session
                } else {
                    focusDisplay.textContent = 'Break time over! Ready to study again?';
                    timeLeft = studyTimeInput.value * 60;
                    totalTime = timeLeft;
                    isStudySession = true;
                    totalFocusTime = 0;
                    initialPlantSize = 100; // Reset plant size for new study session
                }
                updateTimerDisplay();
            }
        }, 1000);
    } else {
        clearInterval(timer);
        isTimerRunning = false;
        startTimerBtn.textContent = 'Resume';
        startTimerBtn.classList.remove('pulse');
    }
}

// Replace the pauseTimer function and its event listener with this new restartTimer function
function restartTimer() {
    clearInterval(timer);
    isTimerRunning = false;
    startTimerBtn.textContent = 'Start';
    startTimerBtn.classList.remove('pulse');
    
    // Reset the timer to the initial study or break time
    if (isStudySession) {
        timeLeft = studyTimeInput.value * 60;
    } else {
        timeLeft = breakTimeInput.value * 60;
    }
    totalTime = timeLeft;
    totalFocusTime = 0;
    
    // Reset the plant
    plantSize = 100;
    updatePlant();
    
    // Update the timer display
    updateTimerDisplay();
    
    // Reset focus display
    focusDisplay.textContent = 'Focus: 100%';
}

// Replace the pauseTimerBtn event listener with this:
const restartTimerBtn = document.getElementById('restartTimer');
restartTimerBtn.addEventListener('click', restartTimer);

startTimerBtn.addEventListener('click', startTimer);

studyTimeInput.addEventListener('change', () => {
    if (!isTimerRunning && isStudySession) {
        timeLeft = studyTimeInput.value * 60;
        totalTime = timeLeft;
        updateTimerDisplay();
        focusDisplay.textContent = 'Focus: 100%';
    }
});

breakTimeInput.addEventListener('change', () => {
    if (!isTimerRunning && !isStudySession) {
        timeLeft = breakTimeInput.value * 60;
        totalTime = timeLeft;
        updateTimerDisplay();
        focusDisplay.textContent = 'Break time';
    }
});

// Virtual plant
const plant = document.getElementById('plant');
let plantSize = 100; // Initial plant size (percentage)

let totalFocusTime = 0;
let sessionStartTime;
let initialPlantSize = 100;

function updatePlant() {
    const stem = plant.querySelector('.plant-stem');
    const leftLeaf = plant.querySelector('.plant-leaf.left');
    const rightLeaf = plant.querySelector('.plant-leaf.right');
    const flower = plant.querySelector('.plant-flower');

    if (isStudySession && isTimerRunning) {
        const elapsedTime = totalTime - timeLeft;
        const focusPercentage = (totalFocusTime / elapsedTime) * 100;
        
        // Gradually increase plantSize based on elapsed time
        const growthProgress = elapsedTime / totalTime;
        plantSize = 100 + (growthProgress * 50); // Max size will be 150 at 100% progress

        const maxStemHeight = 80;
        stem.style.height = `${Math.min((plantSize - 100) * 1.6, maxStemHeight)}px`;
        
        // First level: Left leaf
        if (plantSize >= 115) {
            leftLeaf.style.opacity = Math.min((plantSize - 115) / 15, 1);
            leftLeaf.style.bottom = '40%';
        } else {
            leftLeaf.style.opacity = '0';
        }
        
        // Second level: Right leaf
        if (plantSize >= 130) {
            rightLeaf.style.opacity = Math.min((plantSize - 130) / 15, 1);
            rightLeaf.style.bottom = '60%';
        } else {
            rightLeaf.style.opacity = '0';
        }
        
        // Third level: Flower
        if (plantSize >= 145) {
            flower.style.opacity = Math.min((plantSize - 145) / 5, 1);
        } else {
            flower.style.opacity = '0';
        }

        // Update focus display
        focusDisplay.textContent = `Focus: ${focusPercentage.toFixed(2)}%`;
    } else if (!isStudySession) {
        // During break, gradually return to initial size
        plantSize = Math.max(100, plantSize - 0.1);
        stem.style.height = `${Math.max((plantSize - 100) * 1.6, 0)}px`;
        
        leftLeaf.style.opacity = Math.max((plantSize - 115) / 15, 0);
        rightLeaf.style.opacity = Math.max((plantSize - 130) / 15, 0);
        flower.style.opacity = Math.max((plantSize - 145) / 5, 0);
    }
    
    plant.style.transform = `translateX(-50%) scale(${Math.min(plantSize / 200, 0.75)})`;
}

// Distraction detection
let isDistracted = false;
let distractionAlertInterval;

function handleVisibilityChange() {
    if (document.hidden && isTimerRunning && isStudySession) {
        if (!isDistracted) {
            isDistracted = true;
            showNotification('Distraction detected! Come back to Focus Flow.');
            plant.classList.add('shake');
            startDistractionAlert();
        }
    } else {
        if (isDistracted) {
            isDistracted = false;
            stopDistractionAlert();
            plant.classList.remove('shake');
        }
    }
}

function startDistractionAlert() {
    if (isTimerRunning && isStudySession) {
        playAlertSound();
        distractionAlertInterval = setInterval(() => {
            if (isTimerRunning && isStudySession) {
                playAlertSound();
                showNotification('Come back to Focus Flow!');
            } else {
                stopDistractionAlert();
            }
        }, 5000); // Alert every 5 seconds
    }
}

function stopDistractionAlert() {
    clearInterval(distractionAlertInterval);
}

// Audio context for generating sounds
let audioContext;

function initAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playAlertSound() {
    if (!audioContext) {
        initAudioContext();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
}

function showNotification(message) {
    // Check if the browser supports notifications
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    }
    // Check if permission is already granted
    else if (Notification.permission === "granted") {
        const notification = new Notification("Focus Flow", {
            body: message,
            icon: "path/to/icon.png" // Add an icon for your app
        });
    }
    // Otherwise, ask for permission
    else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                const notification = new Notification("Focus Flow", {
                    body: message,
                    icon: "path/to/icon.png" // Add an icon for your app
                });
            }
        });
    }

    // Also show an on-screen notification
    const onScreenNotification = document.createElement('div');
    onScreenNotification.textContent = message;
    onScreenNotification.style.position = 'fixed';
    onScreenNotification.style.bottom = '20px';
    onScreenNotification.style.right = '20px';
    onScreenNotification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    onScreenNotification.style.color = 'white';
    onScreenNotification.style.padding = '10px';
    onScreenNotification.style.borderRadius = '5px';
    onScreenNotification.style.animation = 'fadeIn 0.5s, fadeOut 0.5s 2.5s';
    document.body.appendChild(onScreenNotification);

    setTimeout(() => {
        document.body.removeChild(onScreenNotification);
    }, 3000);
}

document.addEventListener('visibilitychange', handleVisibilityChange);
// Play notification sound
function playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,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');
    audio.play();
}

// Music player functionality
const audio = document.getElementById('backgroundMusic');
const playMusicBtn = document.getElementById('playMusic');
const changeMusicBtn = document.getElementById('changeMusic');
const volumeControl = document.getElementById('volumeControl');
const musicProgress = document.getElementById('musicProgress');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');
const nowPlayingDisplay = document.getElementById('nowPlaying');

const musicTracks = ['1.mp3', '4.mp3'];
let currentTrackIndex = 0;
let isPlaying = false;

function togglePlayPause() {
    if (isPlaying) {
        audio.pause();
        playMusicBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        audio.play().catch(e => console.error("Error playing audio:", e));
        playMusicBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

function changeMusic() {
    currentTrackIndex = (currentTrackIndex + 1) % musicTracks.length;
    audio.src = musicTracks[currentTrackIndex];
    nowPlayingDisplay.textContent = `Now Playing: Track ${currentTrackIndex + 1}`;
    audio.load(); // Explicitly load the new track
    if (isPlaying) {
        audio.play().catch(e => {
            console.error("Error playing audio:", e);
            isPlaying = false;
            playMusicBtn.innerHTML = '<i class="fas fa-play"></i>';
        });
    }
    updateMusicProgress(); // Update progress immediately
}

function updateMusicProgress() {
    if (isNaN(audio.duration)) {
        currentTimeDisplay.textContent = "0:00";
        durationDisplay.textContent = "0:00";
        musicProgress.value = 0;
    } else {
        const progress = (audio.currentTime / audio.duration) * 100;
        musicProgress.value = isNaN(progress) ? 0 : progress;
        currentTimeDisplay.textContent = formatTime(audio.currentTime);
        durationDisplay.textContent = formatTime(audio.duration);
    }
}

function formatTime(time) {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

playMusicBtn.addEventListener('click', togglePlayPause);
changeMusicBtn.addEventListener('click', changeMusic);

volumeControl.addEventListener('input', (e) => {
    audio.volume = e.target.value;
});

musicProgress.addEventListener('input', (e) => {
    const time = (e.target.value / 100) * audio.duration;
    if (!isNaN(time)) {
        audio.currentTime = time;
    }
});

audio.addEventListener('timeupdate', updateMusicProgress);
audio.addEventListener('loadedmetadata', updateMusicProgress);
audio.addEventListener('error', (e) => {
    console.error("Audio error:", e);
    nowPlayingDisplay.textContent = `Error loading: Track ${currentTrackIndex + 1}`;
});

audio.addEventListener('ended', () => {
    isPlaying = false;
    playMusicBtn.innerHTML = '<i class="fas fa-play"></i>';
    changeMusic();
});

// Initialize music player
audio.volume = volumeControl.value;
nowPlayingDisplay.textContent = `Now Playing: Track 1`;
updateMusicProgress(); // Initial update

// Theme toggle
const lightThemeBtn = document.getElementById('lightTheme');
const darkThemeBtn = document.getElementById('darkTheme');

lightThemeBtn.addEventListener('click', () => document.body.classList.remove('dark-theme'));
darkThemeBtn.addEventListener('click', () => document.body.classList.add('dark-theme'));

// Chat functionality
const toggleChatBtn = document.getElementById('toggleChat');
const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessage');

toggleChatBtn.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
    chatWindow.style.animation = chatWindow.classList.contains('hidden') ? 'none' : 'fadeIn 0.3s';
});

sendMessageBtn.addEventListener('click', () => {
    const message = chatInput.value;
    if (message) {
        const messageElement = document.createElement('p');
        messageElement.textContent = `You: ${message}`;
        messageElement.style.animation = 'fadeIn 0.3s';
        chatWindow.appendChild(messageElement);
        chatInput.value = '';
    }
});

// Add friend functionality
const addFriendBtn = document.getElementById('addFriend');

addFriendBtn.addEventListener('click', () => {
    const friendEmailPrompt = document.createElement('div');
    friendEmailPrompt.className = 'friend-email-prompt';
    friendEmailPrompt.innerHTML = `
        <div class="prompt-content">
            <h3>Add a Friend</h3>
            <input type="email" id="friendEmail" placeholder="Enter your friend's email">
            <div class="prompt-buttons">
                <button id="sendFriendRequest">Send Request</button>
                <button id="cancelFriendRequest">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(friendEmailPrompt);

    const sendFriendRequestBtn = document.getElementById('sendFriendRequest');
    const cancelFriendRequestBtn = document.getElementById('cancelFriendRequest');
    const friendEmailInput = document.getElementById('friendEmail');

    sendFriendRequestBtn.addEventListener('click', () => {
        const friendEmail = friendEmailInput.value;
        if (friendEmail && isValidEmail(friendEmail)) {
            showNotification(`Friend request sent to ${friendEmail}!`);
            document.body.removeChild(friendEmailPrompt);
        } else {
            showNotification('Please enter a valid email address.');
        }
    });

    cancelFriendRequestBtn.addEventListener('click', () => {
        document.body.removeChild(friendEmailPrompt);
    });
});

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Background image functionality
const changeBackgroundBtn = document.getElementById('changeBackground');
const backgroundImage = document.querySelector('.background-image');
const backgroundImages = [
    'aurora.jpg',
    'office.jpg',
    'ews.jpg',
    '1.jpg'
];

function changeBackgroundRandomly() {
    const randomIndex = Math.floor(Math.random() * backgroundImages.length);
    const newBackground = `url('${backgroundImages[randomIndex]}')`;
    backgroundImage.style.backgroundImage = newBackground;
}

changeBackgroundBtn.addEventListener('click', changeBackgroundRandomly);

// Call this function once at the start to set a random background
document.addEventListener('DOMContentLoaded', () => {
    changeBackgroundRandomly();
});

// Initialize
updateTimerDisplay();
updatePlant();

// Initialize audio context when the page loads
document.addEventListener('DOMContentLoaded', initAudioContext);

// Add this at the end of your script.js file

window.addEventListener('resize', function() {
    updateTimerDisplay();
    updatePlant();
    // Add any other functions that might need to adjust based on screen size
});

