const { initializeApp } = require('firebase/app');
const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
const AsyncStorage = require('@react-native-async-storage/async-storage');
const { getStorage } = require('firebase/storage');
const { getFirestore } = require('firebase/firestore');

// Sua configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCa0Lx3cyzPBz9eE10DuhvcOs3F4sm2GZE",
    authDomain: "chat-app-kaua.firebaseapp.com",
    projectId: "chat-app-kaua",
    storageBucket: "chat-app-kaua.appspot.com",
    messagingSenderId: "163085396885",
    appId: "1:163085396885:android:c00d3b653f6135d216a49c",
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Inicialização de autenticação
let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
} catch (error) {
    if (error.code === 'auth/already-initialized') {
        auth = getAuth(app);
    } else {
        console.error("Erro ao inicializar Auth:", error);
    }
}

const storage = getStorage(app);
const db = getFirestore(app);

module.exports = { auth, storage, db }; // Exporte as instâncias
