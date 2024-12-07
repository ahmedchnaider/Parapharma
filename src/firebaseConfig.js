import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyCbOa-gswYfa6BILREqijvACM5msjtBVXI",
  authDomain: "pharmashop-bc252.firebaseapp.com",
  databaseURL: "https://pharmashop-bc252-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pharmashop-bc252",
  storageBucket: "pharmashop-bc252.appspot.com",
  messagingSenderId: "681522279618",
  appId: "1:681522279618:web:f7d4f7c4ae0afd02e4f75b",
  measurementId: "G-GV56CVTDHC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const database = getDatabase(app);

export { auth, googleProvider, database };
