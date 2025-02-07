<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {loginHelper} from '../helpers/authHelper.js';

const router = useRouter();

const email = ref('');
const password = ref('');

const loading = ref(false);

async function login(){
  loading.value = true;
  try{
    // eslint-disable-next-line no-unused-vars
    const response = await loginHelper(email.value, password.value);
    // console.log(response);
    router.push('/home');
  }catch(err){
    console.error(err);
  }
}
</script>

<template>
  <v-container class="fill-height" fluid width="1000">
    <v-row justify="center">
      <v-col class="text-center" lg="9" md="6" xs="12">
        <v-card>
          <v-card-title>
            <h1>Login</h1>
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="login">
              <v-text-field
                v-model="email"
                label="Email"
                variant="outlined"
                outlined
                required
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="Password"
                variant="outlined"
                outlined
                required
                type="password"
              ></v-text-field>
              <v-btn type="submit" color="primary" :loading="loading">Login</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
