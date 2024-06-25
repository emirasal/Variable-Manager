<template>
  <div class="signin-container">
    <div class="img/signin-box">
      <img src="img/logo.png" alt="Logo" class="logo">
      <h1>Please sign in</h1>
      <p><input type="text" placeholder="E-mail address" v-model="email" @keyup.enter="signin" /></p>
      <p><input type="password" placeholder="Password" v-model="password" @keyup.enter="signin" /></p>
      <p v-if="errMsg" class="error">{{ errMsg }}</p>
      <p><button @click="signin" class="signin-button">Sign In</button></p>
    </div>
    <footer>Built by Emir Asal © 2024</footer>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from 'vue-router';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const email = ref("");
const password = ref("");
const errMsg = ref();
const router = useRouter();

const signin = () => {
  const auth = getAuth();

  signInWithEmailAndPassword(auth, email.value, password.value)
    .then(() => {
      console.log("successfully signed in!");
      router.push('/');
    })
    .catch((error) => {
      console.log(error.code);
      switch (error.code) {
        case "auth/invalid-email":
          errMsg.value = "Invalid Email";
          break;
        case "auth/user-not-found":
          errMsg.value = "No account with that email";
          break;
        case "auth/wrong-password":
          errMsg.value = "Incorrect Password";
          break;
        default:
          errMsg.value = "Invalid credentials";
          break;
      }
    });
};
</script>

<style src="./SignInPage.css"></style>
