// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC82_iY9niZ3wbOb4Slkzb4zlKuY96_aSk",
  authDomain: "planc-dc0d7.firebaseapp.com",
  projectId: "planc-dc0d7",
  storageBucket: "planc-dc0d7.firebasestorage.app",
  messagingSenderId: "133708371719",
  appId: "1:133708371719:web:83ffb92dd2f88fe93497a2",
  measurementId: "G-SH27ZE8HK7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
