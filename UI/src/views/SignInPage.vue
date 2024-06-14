<template>
  <div class="signin-container">
    <div class="signin-box">
      <img src="@/assets/logo.png" alt="Logo" class="logo">
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

<style scoped>
.signin-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.signin-box {
  background-color: #2d2d44;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  width: 300px;
  text-align: center;
}

.logo {
  width: 160px; /* Increase the size of the logo */
  margin-bottom: 1.5rem; /* Adjust margin for better spacing */
}

h1 {
  font-size: 1.2rem; /* Make the text smaller */
  margin-bottom: 1rem;
  color: #b0b0d1;
}

input[type="text"], input[type="password"] {
  width: calc(100% - 20px);
  padding: 10px;
  margin-bottom: 1rem;
  border: 1px solid #b0b0d1;
  border-radius: 5px;
  background-color: #3c3c55;
  color: #eaeaea;
  transition: border-color 0.3s ease, border-width 0.3s ease;
}

input[type="text"]:focus, input[type="password"]:focus {
  border-color: #cf2727; /* Change border color to reddish when focused */
  border-width: 1.5px; /* Increase the border width */
  outline: none; /* Remove the default outline */
}

input::placeholder {
  color: #b0b0d1;
}

.signin-button {
  width: calc(100% - 20px);
  padding: 10px;
  border: none;
  border-radius: 5px;
  background: linear-gradient(45deg, #6a11cb, #2575fc);
  color: #fff;
  cursor: pointer;
  transition: background 0.3s ease;
}

.signin-button:hover {
  background: linear-gradient(45deg, #6a11cb, #1e6cef);
}

.error {
  color: #ff6b6b;
  margin-bottom: 1rem;
}

footer {
  margin-top: 2rem;
  color: #a0a0c1;
  font-size: 0.9rem;
}
</style>
