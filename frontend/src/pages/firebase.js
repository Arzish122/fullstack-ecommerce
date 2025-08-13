import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyC1lki0z-0iKeKSIomsN9i7RymEMMJP324",
  authDomain: "e-commerce-112aa.firebaseapp.com",
  projectId: "e-commerce-112aa",
  storageBucket: "e-commerce-112aa.firebasestorage.app",
  messagingSenderId: "242828705120",
  appId: "1:242828705120:web:8564e7198cf0a1d154b205",
  measurementId: "G-F1434Y23KJ"
};

const firebaseApp = initializeApp(firebaseConfig);

export default firebaseApp;