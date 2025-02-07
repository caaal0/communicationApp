<template>
  <AppBar />
  <div class="voice-call-container">
    <!-- Call controls -->
    <div v-if="!isInCall" class="call-controls">
      <input v-model="targetUserId" placeholder="Enter user ID to call" />
      <button @click="initiateCall" :disabled="!targetUserId">
        Start Call
      </button>
    </div>

    <!-- Active call interface -->
    <div v-else class="active-call">
      <!-- <audio id="remoteAudio" ref= autoplay playsinline></audio> -->
       <!-- Local audio (muted) -->
        <audio ref="localAudio" autoplay muted></audio>
        <!-- Remote audio -->
        <audio id="remoteAudio" ref="remoteAudio" autoplay></audio>
      <div class="call-status">
        {{ callStatus }}
      </div>
      <button @click="endCall" class="end-call-btn">
        End Call
      </button>
    </div>

    <!-- Incoming call dialog -->
    <v-dialog v-model="showIncomingCallDialog" class="incoming-call-dialog">
      <v-card width="600">
        <v-card-title>Incoming call from {{ incomingCall.callerName }}</v-card-title>
        <v-card-actions>
          <v-btn @click="acceptCall">Accept</v-btn>
          <v-btn @click="endCall">Reject</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {io} from 'socket.io-client';
import AppBar from '@/components/AppBar.vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
userStore.initAuth();

const socket = io('http://localhost:5000');

// State management
const isInCall = ref(false);
const targetUserId = ref('');
const callStatus = ref('');
const incomingCall = ref(null);
const currentCallPartner = ref(null);
const peerConnection = ref(null);
const localStream = ref(null);
const remoteStream = ref(null);

const localAudio = ref(null);
const remoteAudio = ref(null);

const showIncomingCallDialog = ref(false);

// This function creates our WebRTC peer connection with all necessary event handlers
function createPeerConnection() {
  // First, let's set up our configuration with STUN servers
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  };

  // Create the new RTCPeerConnection
  peerConnection.value = new RTCPeerConnection(configuration);

  // When we receive tracks from the remote peer, we need to play them
  peerConnection.value.ontrack = (event) => {
    console.log('Received remote track', event.streams[0].getTracks());
    remoteStream.value = event.streams[0];

    // Bind the remote stream to the audio element
    if (remoteAudio.value) {
      console.log('remoteAudio:', remoteAudio.value);
      remoteAudio.value.srcObject = remoteStream.value;
      remoteAudio.value.play().catch((error) => {
        console.error('Error playing remote audio:', error);
      });
    }

    // Create an audio element to play the remote stream
    // const audioElement = new Audio();
    // audioElement.srcObject = remoteStream.value;
    // audioElement.autoplay = true;
    // const audioElement = document.getElementById("remoteAudio");
    // if (audioElement) {
    //   audioElement.srcObject = remoteStream.value;
    //   audioElement.play().catch(error => console.error("❌ Audio play error:", error));
    // }
  };

  // When we find ICE candidates, we need to share them with the other peer
  // console.log('currentCallPartner.value:', currentCallPartner.value);
  peerConnection.value.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("Sending ICE candidate to", currentCallPartner.value);
      console.log("📡 Sending ICE candidate:", event.candidate);
      socket.emit('signal', {
        targetUserId: currentCallPartner.value || targetUserId.value,
        signal: event.candidate
        // signal: {
        //   type: 'candidate',
        //   candidate: event.candidate
        // }
      });
    }
  };

  socket.on("signal", ({ signal }) => {
  console.log("📶 Received ICE candidate:", signal);
  peerConnection.value.addIceCandidate(new RTCIceCandidate(signal))
    .catch(error => console.error("❌ Failed to add ICE candidate:", error));
  });

  // Add our local audio stream to the connection
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => {
      peerConnection.value.addTrack(track, localStream.value);
    });
  }
}

// Initialize WebRTC and media streams
async function initializeMedia() {
  try {
    localStream.value = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });
    console.log('Microphone access granted');

    // Verify we're getting audio
    const audioTrack = localStream.value.getAudioTracks()[0];
    console.log('Audio track settings:', audioTrack.getSettings());
    console.log('Audio track constraints:', audioTrack.getConstraints());

    return true;
  } catch (err) {
    console.error('Error accessing media devices:', err);
    callStatus.value = 'Error accessing microphone';
    return false;
  }
}

// Call initiation
async function initiateCall() {
  if (!await initializeMedia()) return;

  createPeerConnection();
  isInCall.value = true;
  callStatus.value = 'Calling...';

  console.log("Local tracks being sent:", localStream.value.getTracks());

  // Create and send offer
  const offer = await peerConnection.value.createOffer();
  await peerConnection.value.setLocalDescription(offer);

  socket.emit('callUser', {
    targetUserId: targetUserId.value,
    callerId: socket.id, // Or your user ID
    callerName: userStore.user.email, // Replace with actual user name
    signal: offer
  });
}

// This function handles incoming calls
async function handleIncomingCall(data) {
  try {
    console.log('Received incoming call');

    // First, let's get access to the microphone
    if (!await initializeMedia()) {
      console.error('Failed to get media access');
      return;
    }

    // Store the incoming call data
    incomingCall.value = data;
    console.log('Incoming call data:', data);
    currentCallPartner.value = data.callerId;

    showIncomingCallDialog.value = true;
    // Create our peer connection right when we receive the call
    createPeerConnection();

    // Set the remote description from the offer we received
    await peerConnection.value.setRemoteDescription(
      new RTCSessionDescription(data.signal)
    );

    console.log('Successfully handled incoming call');
  } catch (err) {
    console.error('Error handling incoming call:', err);
    callStatus.value = 'Failed to establish connection';
  }
}

// This function accepts an incoming call
async function acceptCall() {
  try {
    console.log('Accepting call');

    // Verify we have both the peer connection and an incoming call
    if (!peerConnection.value) {
      throw new Error('No peer connection available');
    }

    if (!incomingCall.value) {
      throw new Error('No incoming call to accept');
    }

    isInCall.value = true;
    callStatus.value = 'Connecting...';

    // Create our answer
    const answer = await peerConnection.value.createAnswer();

    // Set it as our local description
    await peerConnection.value.setLocalDescription(answer);

    // Send the answer to the caller
    socket.emit('acceptCall', {
      targetUserId: incomingCall.value.callerId,
      signal: answer
    });

    callStatus.value = 'Connected';
    // incomingCall.value = null;

    console.log('Successfully accepted call');
  } catch (err) {
    console.error('Error accepting call:', err);
    callStatus.value = 'Failed to accept call: ' + err.message;
    endCall();
  }
}

// Let's also enhance our signal handling
async function handleSignalingData(data) {
  try {
    if (!peerConnection.value) {
      console.error('No peer connection available');
      return;
    }

    if (data.signal.type === 'offer') {
      await peerConnection.value.setRemoteDescription(new RTCSessionDescription(data.signal));
      const answer = await peerConnection.value.createAnswer();
      await peerConnection.value.setLocalDescription(answer);
      socket.emit('signal', {
        targetUserId: data.from,
        signal: answer
      });
    } else if (data.signal.type === 'answer') {
      await peerConnection.value.setRemoteDescription(new RTCSessionDescription(data.signal));
    } else if (data.signal.candidate) {
      await peerConnection.value.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
    }
  } catch (err) {
    console.error('Error handling signaling data:', err);
  }
}

// End call
function endCall() {
  if (peerConnection.value) {
    peerConnection.value.close();
    peerConnection.value = null;
  }

  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop());
    localStream.value = null;
  }

  if (remoteStream.value) {
    remoteStream.value.getTracks().forEach(track => track.stop());
    remoteStream.value = null;
  }

  isInCall.value = false;
  callStatus.value = '';
  incomingCall.value = null;

  socket.emit('endCall', { targetUserId: targetUserId.value });
}

// Set up our socket listeners when the component mounts
onMounted(() => {
  socket.on('incomingCall', handleIncomingCall);
  socket.on('callAccepted', async (data) => {
    try {
      if (peerConnection.value) {
        await peerConnection.value.setRemoteDescription(
          new RTCSessionDescription(data.signal)
        );
        callStatus.value = 'Connected';
      }
    } catch (err) {
      console.error('Error handling accepted call:', err);
      callStatus.value = 'Connection failed';
      endCall();
    }
  });
});

onUnmounted(() => {
  // Clean up event listeners and connections
  socket.off('incomingCall');
  socket.off('callAccepted');
  socket.off('signal');
  socket.off('callEnded');
  endCall();
});
</script>

<style scoped>
.voice-call-container {
  padding: 1rem;
}

.active-users {
  margin-bottom: 1rem;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}

.active-call {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  margin-top: 1rem;
}

.end-call-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
</style>
