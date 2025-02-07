<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const loading = ref(false); // Loading state

const phoneNumber = ref(""); // Phone number input
const message = ref(""); // Message input
const messages = ref([]); // Stores chat messages
const selectedMessage = ref(null); // Selected message

const showInbox = ref(true); // Show inbox messages
const newMessage = ref(false); // Show new message form

// Send SMS via Twilio API (calls your backend)
const sendMessage = async () => {
  loading.value = true;
  if (!phoneNumber.value || !message.value) return;
  const newMessage = { text: message.value, sender: "You", time: new Date() };
  messages.value.push(newMessage);

  try {
    await axios.post(`${import.meta.env.VITE_API_URL}/api/sms/send`, {
      phoneNumber: phoneNumber.value,
      message: message.value,
    });
    message.value = "";
  } catch (error) {
    console.error("Error sending message:", error);
  }
  loading.value = false;
};

function inboxToNewMessage(){
  showInbox.value = false;
  newMessage.value = true;
}

function newMessageToInbox(){
  showInbox.value = true;
  newMessage.value = false;
}

function inboxToMessage(index){
  selectedMessage.value = messages.value[index];
  showInbox.value = false;
  newMessage.value = false;
}

// Simulate receiving an SMS (replace with WebSocket or polling)
onMounted(async () => {

  const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/sms/received`,
      {}, // Body is empty (if needed, you can add data here)
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  messages.value = response.data.data;
  // console.log(messages.value)
});
</script>

<template>
  <AppBar />
  <v-container class="chat-container">
    <v-card class="inbox" v-if="showInbox">
      <v-card-title class="chat-title>">Inbox</v-card-title>
      <v-card-text>
        <v-list class="chat-box">
          <v-list-item v-for="(msg, index) in messages" :key="index">
            <v-list-item @click="inboxToMessage(index)">
              <v-list-item-title class="phoneNumber">{{ msg.from }}</v-list-item-title>
              <v-list-item-subtitle>{{ msg.body }}</v-list-item-subtitle>
              <p>{{ new Date(msg.receivedAt).toDateString() }}</p>
            </v-list-item>
            <v-divider />
          </v-list-item>
        </v-list>
        <v-fab color="primary" fab small @click="inboxToNewMessage">
          <v-icon>mdi-message</v-icon>
        </v-fab>
      </v-card-text>
    </v-card>
    <!-- send a new message -->
    <v-card class="chat-box" v-else-if="newMessage">
      <v-card-title class="chat-title">
        New Message
      </v-card-title>
      <v-divider />

      <v-divider />

      <!-- Phone Number Input -->
      <v-text-field v-model="phoneNumber" label="Phone Number" prepend-icon="mdi-phone" />

      <!-- Message Input -->
      <v-text-field v-model="message" label="Type a message..." prepend-icon="mdi-message" />

      <!-- Send Button -->
      <v-btn color="primary" @click="sendMessage" :loading="loading">Send</v-btn>
      <v-btn color="primary" @click="newMessageToInbox">Back</v-btn>
    </v-card>
    <v-card v-else>
      <v-card-title class="chat-title">Message</v-card-title>
      <v-card-text>
        <p class="phoneNumber">
          {{ selectedMessage.from }}
        </p>
        <p>{{ selectedMessage.body }}</p>
        <span>{{ new Date(selectedMessage.receivedAt) }}</span>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="newMessageToInbox" text="Back" />
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<style scoped>
span {
  font-size: 12px;
  color: grey;
}

.phoneNumber {
  font-weight: 700;
}
.chat-container {
  max-width: 500px;
  margin: auto;
}
.chat-box {
  display: flex;
  flex-direction: column;
  height: 400px;
}
.chat-title {
  text-align: center;
}
.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
}
</style>
