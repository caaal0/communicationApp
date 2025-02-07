<script setup>
import { useUserStore } from '@/stores/user';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const loading = ref(false);

const userStore = useUserStore();

async function logoutUser() {
  loading.value = true;
  await userStore.logout();
  loading.value = false;
  router.push('/');
}
</script>

<template>
  <v-app-bar :elevation="2" rounded>
    <v-app-bar-title>Communication App</v-app-bar-title>
    <v-spacer />
    <v-btn variant="flat" to="/home">Home</v-btn>
    <v-btn variant="flat" to="/chat">Chat</v-btn>
    <v-btn variant="flat" to="/email">Email</v-btn>
    <v-btn variant="flat" to="/sms">SMS</v-btn>
    <v-btn variant="flat" to="/voice">Voice</v-btn>
    <v-btn variant="flat" @click="logoutUser" :loading="loading">Log out</v-btn>
  </v-app-bar>
</template>
