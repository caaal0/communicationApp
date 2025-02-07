<script setup>

</script>

<template>
  <v-app-bar :elevation="2" rounded>
    <v-app-bar-title>Communication Ap</v-app-bar-title>
    <v-spacer />
    <v-btn text to="/">Home</v-btn>
  </v-app-bar>
  <v-main>
    <router-view />
  </v-main>
</template>
