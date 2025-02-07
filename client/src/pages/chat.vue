<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import axios from "axios";
import AppBar from "../components/AppBar.vue";
// import useUserStore from "../stores/user.js";
import { useUserStore } from "../stores/user.js";

const userStore = useUserStore();

const socket = io("http://localhost:5000"); // Connect to backend

const messages = ref([]);
const newMessage = ref("");
const username = ref('');

const selectedFile = ref(null);

// Handle file selection
const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0];
};

onMounted(() => {
  userStore.initAuth();
  username.value = userStore.user.email;
  // fetchMessages();
  // Listen for messages from the server
  socket.on("chatMessage", (message) => {
    messages.value.push(message);
  });
});

onUnmounted(() => {
  socket.disconnect();
});

// Send message
// const sendMessage = () => {
//   if (!newMessage.value.trim()) return;

//   const message = { sender: username.value, text: newMessage.value };
//   socket.emit("chatMessage", message); // Send message to backend
//   newMessage.value = "";
// };
// Send message with optional file
const sendMessage = async () => {
  if (!newMessage.value.trim() && !selectedFile.value) return;

  let fileData = null;
  let fileName = null;

  if (selectedFile.value) {
    const reader = new FileReader();
    reader.readAsDataURL(selectedFile.value);
    reader.onload = async () => {
      fileData = reader.result.split(",")[1]; // Base64 file data
      fileName = selectedFile.value.name;

      const messageData = {
        senderId: username.value,
        message: newMessage.value,
        // timestamp: Date.now(),
        fileName,
        fileData,
      };

      // Emit message via Socket.io
      socket.emit("chatMessage", messageData);
      console.log("Message sent with file:", messageData);

      newMessage.value = "";
      selectedFile.value = null;
    };
  } else {
    const messageData = { senderId: username.value, message: newMessage.value, timestamp: Date.now() };
    socket.emit("chatMessage", messageData);
    // try {
    //   await axios.post("http://localhost:8080/api/chat/send", messageData);
    // } catch (error) {
    //   console.error("Error saving message:", error);
    // }
    newMessage.value = "";
  }
};
</script>

<template>
  <AppBar />
  <div class="chat-container">
    <div v-for="msg in messages" :key="msg.id" class="chat-message">
      <strong>{{ msg.senderId }}</strong>: {{ msg.message }}
      <div v-if="msg.fileData">
        <a :href="'data:application/octet-stream;base64,' + msg.fileData" :download="msg.fileName">
          Download Attachment
        </a>
      </div>
    </div>

    <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Type a message..." />
    <input type="file" @change="handleFileUpload" />
    <button @click="sendMessage">Send</button>
  </div>
</template>

<style>
.chat-container {
  max-width: 400px;
  margin: auto;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.messages {
  max-height: 300px;
  overflow-y: auto;
  padding: 5px;
  margin-bottom: 10px;
}

.message {
  background: #f1f1f1;
  padding: 5px;
  margin-bottom: 5px;
  border-radius: 3px;
}

.input-area {
  display: flex;
}

input {
  flex-grow: 1;
  padding: 5px;
}

button {
  margin-left: 5px;
  padding: 5px 10px;
}
</style>
