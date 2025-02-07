<script setup>
import AppBar from "@/components/AppBar.vue";
import { ref, onMounted } from "vue";
import axios from "axios";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();

const emails = ref([]);
const refreshLoading = ref(false);
const sendLoading = ref(false);
const showInbox = ref(true);
const showEmail = ref(false);
const showSendEmail = ref(false);
const selectedEmail = ref(null);
const attachmentFiles = ref([]); // Stores uploaded files

const newEmail = ref({
  to: "",
  subject: "",
  message: "",
  attachments: [],
});

async function loadInbox() {
  refreshLoading.value = true;
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/email/inbox/${userStore.user.email}`
    );
    if (response.data.success) {
      emails.value = response.data.data;
    } else {
      console.error("Error loading inbox:", response.data.error);
    }
  } catch (error) {
    console.error("Error loading inbox:", error);
  }
  refreshLoading.value = false;
}

onMounted(async () => {
  userStore.initAuth();
  loadInbox();
});

function backToInbox() {
  showInbox.value = true;
  showEmail.value = false;
  showSendEmail.value = false;
}

async function handleFileUpload(event) {
  const files = event.target.files;
  newEmail.value.attachments = [];

  for (const file of files) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      newEmail.value.attachments.push({
        filename: file.name,
        content: reader.result.split(",")[1], // Extract Base64 string
        mimetype: file.type,
      });
    };
  }
}

async function sendEmail() {
  sendLoading.value = true;

  const emailData = {
    from: userStore.user.email,
    to: newEmail.value.to,
    subject: newEmail.value.subject,
    text: newEmail.value.message,
    attachments: newEmail.value.attachments,
  };
  console.log(emailData)

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/email/send`,
      emailData,
      { headers: { "Content-Type": "application/json" } }
    );

    if (response.data.success) {
      newEmail.value = { to: "", subject: "", message: "", attachments: [] };
      backToInbox();
    } else {
      console.error("Error sending email:", response.data.error);
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }

  sendLoading.value = false;
}

function getAttachmentUrl(attachment) {
  if (!attachment.content || !attachment.content.data) return "#";

  // Convert Buffer array to a Uint8Array
  const byteArray = new Uint8Array(attachment.content.data);

  // Create a Blob from the byte array
  const blob = new Blob([byteArray], { type: attachment.contentType });

  // Generate a downloadable URL
  return URL.createObjectURL(blob);
}

</script>

<template>
  <AppBar />
  <v-container fill-height>
    <v-row>
      <v-col>
        <v-row class="btns-container">
          <v-btn variant="flat" @click="backToInbox">Inbox</v-btn>
          <v-btn variant="flat" @click="loadInbox" :loading="refreshLoading">Refresh</v-btn>
          <v-spacer />
          <v-btn variant="flat" @click="showSendEmail=true">New Email</v-btn>
        </v-row>

        <v-card v-if="showSendEmail">
          <v-card-title>New Email</v-card-title>
          <v-card-text>
            <v-text-field label="To" v-model="newEmail.to" />
            <v-text-field label="Subject" v-model="newEmail.subject" />
            <v-textarea label="Message" v-model="newEmail.message" />
            <!-- <v-file-input
              label="Attachments"
              multiple
              @change="(files) => (attachmentFiles = files)"
            /> -->
            <v-file-input label="Attachments" multiple @change="handleFileUpload" />
          </v-card-text>
          <v-card-actions>
            <v-btn @click="sendEmail" :loading="sendLoading">Send</v-btn>
            <v-btn @click="newEmail = {}; attachmentFiles = [];">Cancel</v-btn>
          </v-card-actions>
        </v-card>

        <v-card v-else-if="showEmail">
          <v-card-title>{{ selectedEmail.subject }}</v-card-title>
          <v-card-text>
            <p><span id="from">From:</span> {{ selectedEmail.from.name }} <{{ selectedEmail.from.address }}></p>
            <p v-html="selectedEmail.body.replace(/\n/g, '<br>')"></p>
            <div v-if="selectedEmail.attachments && selectedEmail.attachments.length">
              <h4>Attachments:</h4>
              <ul>
                <li v-for="(attachment, index) in selectedEmail.attachments" :key="index">
                  <a :href="getAttachmentUrl(attachment)" :download="attachment.filename">
                    {{ attachment.filename }}
                  </a>
                </li>
              </ul>
            </div>
          </v-card-text>
        </v-card>

        <v-card v-else-if="showInbox">
          <v-card-title>Inbox</v-card-title>
          <v-card-text class="inbox">
            <v-list>
              <v-list-item v-for="(email, index) in emails" :key="index">
                <v-list-item @click="selectedEmail = email; showEmail = true">
                  <template v-slot:prepend>
                    {{ email.from.name }} <{{email.from.address}}>
                  </template>
                  <v-list-item-title> {{ email.subject }} </v-list-item-title>
                  <template v-slot:append>
                    {{ new Date(email.date).toDateString() }}
                  </template>
                </v-list-item>
                <v-divider />
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

      </v-col>
    </v-row>
  </v-container>
</template>

<style>
v-btn {
  margin: 0 10px;
}
#from {
  font-weight: bold;
}
.btns-container {
  margin-bottom: 20px;
}
div .v-list-item-title {
  margin-left: 10px;
  font-weight: bold;
}

.inbox{
  max-height: 500px;
  overflow-y: auto;
}
</style>
