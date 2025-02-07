<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup>
  import { useUserStore } from './stores/user';
  import { onMounted } from 'vue';
  import {db, auth, app} from './helpers/firebase.js';
  import { RouterView } from 'vue-router';
  import { useRoute } from "vue-router";

  const route = useRoute();

  const userStore = useUserStore();
  onMounted(() => {
    userStore.initAuth();
  });
</script>
