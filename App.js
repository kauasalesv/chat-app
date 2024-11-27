import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import io from 'socket.io-client';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { auth, db } from './config/firebase'; // Certifique-se de importar corretamente
import { Timestamp, getDoc, updateDoc, setDoc, doc } from "firebase/firestore";

// Importação dos componentes
import SignUp from './components/authentication/SignUp';
import SignIn from './components/authentication/SignIn';
import Home from './components/home/Home';
import Chat from './components/chat/Chat';
import ChatGroup from './components/chat/ChatGroup';
import CreateContact from './components/home/create-add/CreateContact';
import CreateGroup from './components/home/create-add/CreateGroup';
import AddContacts from './components/home/create-add/AddContacts';
import MyUser from './components/home/user/MyUser';
import Contacts from './components/home/Contacts';
import EditContact from './components/chat/delete-edit/EditContact';
import EditGroup from './components/chat/delete-edit/EditGroup';
import AddEditContacts from './components/chat/delete-edit/AddEditContacts';
import ConfirmationMessage from './components/layout/ConfirmationMessage';
import ConfirmCode from './components/authentication/ConfirmCode';

const Stack = createStackNavigator();
// const socket = io('http://192.168.162.206:3000');
const socket = io('http://192.168.1.7:3000'); 

export default function App() {
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        var userEmail = user.email;
        socket.connect(); // Conectar ao socket quando o usuário estiver autenticado
        socket.emit('register', userEmail);
        saveUserLastTime(user);
        //console.log("\x1b[35m", `Usuário conectado:`);
        //console.log(userEmail);
        
      } else {
        //console.log("\x1b[35m", 'Usuário desconectado:');
        socket.disconnect(); // Desconectar se o usuário não estiver autenticado
      }
    });

    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background') {
        socket.disconnect();
        //console.log("\x1b[35m", 'Socket desconectado ao entrar em segundo plano');

      }
      if (nextAppState === 'active') {
        // Verifica se o usuário está autenticado antes de reconectar
        auth.onAuthStateChanged((user) => {
          if (user) {
            const userEmail = user.email;
            socket.connect();
            socket.emit('register', userEmail);
            //console.log("\x1b[35m", 'Socket conectado ao voltar para o aplicativo');
            //console.log(socket.id);
          }
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubscribe();
      socket.disconnect(); // Desconectar quando o componente é desmontado
      subscription.remove(); // Remover o listener ao desmontar
    };
  }, []);

  const saveUserLastTime = async (user) => {
    try {
        // Cria o ID do documento com base nos e-mails do remetente e do destinatário
        const docId = `${user.email}`;
        const chatRef = doc(db, 'userSessions', docId); // Referência ao documento na coleção 'chats'

        // Verifica se o documento já existe
        const chatSnap = await getDoc(chatRef);
        const oneWeekInMillis = 7 * 24 * 60 * 60 * 1000; // Milissegundos em uma semana
        const oneMinuteInMillis = 1 * 60 * 1000; // Milissegundos em um minuto
        const currentTime = Timestamp.now();
        
        if (chatSnap.exists()) {
            // O documento já existe
            const existingTime = chatSnap.data().time;
        
            if (existingTime && currentTime.toMillis() - existingTime.toMillis() > oneWeekInMillis) {
                // O time existente é inferior a uma semana do atual, atualize o time
                await updateDoc(chatRef, {
                    time: currentTime,
                });
            } else {
                console.log("O time atual não é inferior a uma semana do time existente.");
            }
        } else {
            // O documento não existe, cria um novo
            await setDoc(chatRef, {
                time: currentTime,
            });
        }        
        console.log(`Sessão persistida no firestore para ${user.email}`);
    } catch (error) {
        console.error("Erro ao salvar mensagem no Firestore:", error);
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignIn">
        {/* Tela Autenticação */}
        <Stack.Screen name="SignIn" component={SignIn} options={{ headerShown: false, animationEnabled: false }} />
        <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false, animationEnabled: false }} />
        <Stack.Screen name="ConfirmCode" component={ConfirmCode} options={{ headerShown: false, animationEnabled: false }} />
        {/* Tela Home */}
        <Stack.Screen name="Home" component={Home} options={{ headerShown: false, animationEnabled: false }} />
        <Stack.Screen name="CreateContact" component={CreateContact} options={{ headerShown: false, animationEnabled: false }} />
        <Stack.Screen name="Contacts" component={Contacts} options={{ headerShown: false, animationEnabled: false }} />
        <Stack.Screen name="CreateGroup" component={CreateGroup} options={{ headerShown: false, animationEnabled: false }} />
        <Stack.Screen name="AddContacts" component={AddContacts} options={{ headerShown: false, animationEnabled: false }} />
        <Stack.Screen name="MyUser" component={MyUser} options={{ headerShown: false, animationEnabled: false }} />
        {/* Tela Chat */}
        <Stack.Screen name="Chat" component={Chat} options={{ headerShown: false, animationEnabled: false }} />
        <Stack.Screen name="ChatGroup" component={ChatGroup} options={{ headerShown: false, animationEnabled: false }} />
        <Stack.Screen name="EditContact" component={EditContact} options={{ headerShown: false, animationEnabled: false }} />
        <Stack.Screen name="EditGroup" component={EditGroup} options={{ headerShown: false, animationEnabled: false }} />
        <Stack.Screen name="AddEditContacts" component={AddEditContacts} options={{ headerShown: false, animationEnabled: false }} />
        {/* Mensagem de confirmação */}
        <Stack.Screen name="ConfirmationMessage" component={ConfirmationMessage} options={{ headerShown: false, animationEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
