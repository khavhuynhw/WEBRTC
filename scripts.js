// Configuration - Thay đổi URL này thành URL của signaling server của bạn
// Sau khi deploy signaling server lên Railway, thay đổi URL dưới đây:
// const SIGNALING_SERVER_URL = 'https://your-app-name.railway.app'; // Railway URL

// Sử dụng localhost cho development
// const SIGNALING_SERVER_URL = 'https://webrtc-production-5c3a.up.railway.app';
const SIGNALING_SERVER_URL = 'https://localhost:8181'; // Localhost for development

const userName = "User-" + Math.floor(Math.random() * 100000);
const password = "x";
document.querySelector('#user-name').innerHTML = `Your ID: ${userName}`;

// Kết nối với signaling server
const socket = io.connect(SIGNALING_SERVER_URL, {
    auth: {
        userName,
        password
    },
    transports: ['websocket', 'polling']
});

const localVideoEl = document.querySelector('#local-video');
const remoteVideoEl = document.querySelector('#remote-video');

let localStream;
let remoteStream;
let peerConnection;
let didIOffer = false;
let isInCall = false;

// Cấu hình ICE servers tốt hơn cho production
let peerConfiguration = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun3.l.google.com:19302',
                'stun:stun4.l.google.com:19302'
            ]
        },
        // Thêm TURN servers nếu cần (có thể dùng free TURN servers)
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ]
};

// Cập nhật UI
const updateUI = () => {
    const callBtn = document.querySelector('#call');
    const hangupBtn = document.querySelector('#hangup');
    const waitingDiv = document.querySelector('#waiting');
    
    if (isInCall) {
        callBtn.style.display = 'none';
        hangupBtn.style.display = 'block';
        waitingDiv.style.display = 'none';
    } else {
        callBtn.style.display = 'block';
        hangupBtn.style.display = 'none';
        waitingDiv.style.display = 'none';
    }
};

// Khi client khởi tạo cuộc gọi
const call = async (e) => {
    try {
        await fetchUserMedia();
        await createPeerConnection();
        
        console.log("Creating offer...");
        const offer = await peerConnection.createOffer();
        console.log(offer);
        await peerConnection.setLocalDescription(offer);
        didIOffer = true;
        isInCall = true;
        updateUI();
        
        socket.emit('newOffer', offer);
        
        // Hiển thị waiting message
        document.querySelector('#waiting').style.display = 'block';
        document.querySelector('#waiting').innerHTML = 'Waiting for someone to answer...';
        
    } catch (err) {
        console.error('Error creating offer:', err);
        alert('Error starting call. Please check your camera permissions.');
    }
};

// Khi client trả lời cuộc gọi
const answerOffer = async (offerObj) => {
    try {
        await fetchUserMedia();
        await createPeerConnection(offerObj);
        
        const answer = await peerConnection.createAnswer({});
        await peerConnection.setLocalDescription(answer);
        
        console.log('Answer created:', answer);
        
        offerObj.answer = answer;
        isInCall = true;
        updateUI();
        
        const offerIceCandidates = await socket.emitWithAck('newAnswer', offerObj);
        offerIceCandidates.forEach(c => {
            peerConnection.addIceCandidate(c);
            console.log("Added ICE Candidate from offerer");
        });
        
    } catch (err) {
        console.error('Error answering offer:', err);
        alert('Error answering call.');
    }
};

// Thêm answer vào peer connection
const addAnswer = async (offerObj) => {
    try {
        await peerConnection.setRemoteDescription(offerObj.answer);
        console.log('Remote description set');
        
        // Ẩn waiting message
        document.querySelector('#waiting').style.display = 'none';
        
    } catch (err) {
        console.error('Error setting remote description:', err);
    }
};

// Lấy user media
const fetchUserMedia = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: true,
            });
            localVideoEl.srcObject = stream;
            localStream = stream;
            resolve();
        } catch (err) {
            console.error('Error accessing media devices:', err);
            alert('Please allow camera and microphone access to use this app.');
            reject(err);
        }
    });
};

// Tạo peer connection
const createPeerConnection = (offerObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            peerConnection = new RTCPeerConnection(peerConfiguration);
            remoteStream = new MediaStream();
            remoteVideoEl.srcObject = remoteStream;

            // Thêm local tracks
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });

            // Event listeners
            peerConnection.addEventListener("signalingstatechange", (event) => {
                console.log('Signaling state:', peerConnection.signalingState);
            });

            peerConnection.addEventListener('icecandidate', e => {
                console.log('ICE candidate found');
                if (e.candidate) {
                    socket.emit('sendIceCandidateToSignalingServer', {
                        iceCandidate: e.candidate,
                        iceUserName: userName,
                        didIOffer,
                    });
                }
            });

            peerConnection.addEventListener('track', e => {
                console.log("Got track from remote peer");
                e.streams[0].getTracks().forEach(track => {
                    remoteStream.addTrack(track);
                });
            });

            peerConnection.addEventListener('connectionstatechange', () => {
                console.log('Connection state:', peerConnection.connectionState);
                if (peerConnection.connectionState === 'connected') {
                    console.log('WebRTC connection established!');
                }
            });

            // Nếu có offer object, set remote description
            if (offerObj) {
                await peerConnection.setRemoteDescription(offerObj.offer);
            }
            
            resolve();
        } catch (err) {
            console.error('Error creating peer connection:', err);
            reject(err);
        }
    });
};

// Thêm ICE candidate mới
const addNewIceCandidate = (iceCandidate) => {
    if (peerConnection) {
        peerConnection.addIceCandidate(iceCandidate);
        console.log("Added ICE Candidate from signaling server");
    }
};

// Hangup function
const hangup = () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    localVideoEl.srcObject = null;
    remoteVideoEl.srcObject = null;
    
    isInCall = false;
    didIOffer = false;
    updateUI();
    
    // Clear answer buttons
    document.querySelector('#answer').innerHTML = '';
    
    console.log('Call ended');
};

// Event listeners
document.querySelector('#call').addEventListener('click', call);
document.querySelector('#hangup').addEventListener('click', hangup);

// Socket connection status
socket.on('connect', () => {
    console.log('Connected to signaling server');
    document.querySelector('#user-name').innerHTML = `Your ID: ${userName} (Connected)`;
});

socket.on('disconnect', () => {
    console.log('Disconnected from signaling server');
    document.querySelector('#user-name').innerHTML = `Your ID: ${userName} (Disconnected)`;
});

// Initialize UI
updateUI();