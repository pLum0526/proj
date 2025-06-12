import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDlWVCcAFAZzHOSe5piF7uSv05_rfZ0XkE",
  authDomain: "tripalbum-a0fe4.firebaseapp.com",
  databaseURL: "https://tripalbum-a0fe4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tripalbum-a0fe4",
  storageBucket: "tripalbum-a0fe4.firebasestorage.app",
  messagingSenderId: "208470611009",
  appId: "1:208470611009:web:889d06c05e0d8eb0c2e2c0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 