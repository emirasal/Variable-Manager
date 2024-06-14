// main.js
import { createApp } from 'vue'
import App from './App.vue'
import MainPage from './views/MainPage.vue'
import SignInPage from './views/SignInPage.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { getAuth, onAuthStateChanged } from "firebase/auth";



// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration



const firebaseConfig = {
  apiKey: "AIzaSyDePldqTycFVvuA6LHsUl3UEkcBNPIJVpk",
  authDomain: "codeway-case-study-49281.firebaseapp.com",
  projectId: "codeway-case-study-49281",
  storageBucket: "codeway-case-study-49281.appspot.com",
  messagingSenderId: "861655153344",
  appId: "1:861655153344:web:071dae6eedc217bffecb25",
};

initializeApp(firebaseConfig);

const routes = [
  { path: '/',
     component: MainPage,
     meta: {
      requiresAuth: true,
  } },
  { path: '/signin', component: SignInPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      getAuth(),
      (user) => {
        removeListener();
        resolve(user);
      },
      reject
    )
  });
};


router.beforeEach(async (to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (await getCurrentUser()) {
      next();
    } else {
      alert("You are not logged in!");
      next("/signin");
    }
  } else {
    next();
  }
});

createApp(App).use(router).mount('#app')
