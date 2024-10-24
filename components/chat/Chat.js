import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import io from 'socket.io-client';
import styles from "./ChatStyles";

import ChatUpBar from '../layout/ChatUpBar';
import ChatMessages from './ChatMessages';
import ChatBottomBar from '../layout/ChatBottomBar';

const socket = io('http://192.168.1.7:3000');

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(true); // Adiciona estado para controle de visibilidade
    const route = useRoute();
    const navigation = useNavigation();
    const { typeChat, contactName, contactEmail } = route.params;

    useEffect(() => {
        const userEmail = auth.currentUser.email;
    
        // Registra o e-mail no servidor ao conectar
        socket.emit('register', userEmail);
    
        socket.on('receiveMessage', async (data) => {
            console.log(`Mensagem recebida: "${data.message}" de ${data.senderId}`);
            const receivedMessage = { 
                id: messages.length + 1,
                text: data.message, 
                time: new Date(), 
                from: 'other' 
            };
    
            if (userEmail !== data.senderId) {
                setMessages((prevMessages) => [...prevMessages, receivedMessage]);
            }
        });
    
        return () => {
            socket.off('receiveMessage');
        };
    }, []);
    

    const sendMessage = async () => {
        const newMessage = { 
            id: messages.length + 1, 
            text: messageText, 
            from: 'me', 
            time: new Date() // Adiciona um timestamp
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]); // Adiciona a mensagem ao estado

        const userEmail = auth.currentUser.email;

        // Envia a mensagem pelo Socket.io
        socket.emit('sendMessage', { message: messageText, recipientEmail: contactEmail, senderEmail: userEmail });
        setMessageText(''); // Limpa o campo de 
        console.log("SSS")
    };

    const loadMyMessages = async () => {
        const userEmail = auth.currentUser.email;
        const chatDocId = `${userEmail}:${contactEmail}`;
        const chatRef = doc(db, 'chats', chatDocId);
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists()) {
            const chatData = chatSnap.data();
            const loadedMessages = chatData.messages.map((msg, index) => ({
                id: index + 1,
                text: msg.content,
                time: msg.time,
                from: 'me',
                status: msg.status // Inclui o status
            }));
            setMessages((prevMessages) => [...loadedMessages, ...prevMessages]);
        } else {
            console.log("Nenhuma mensagem encontrada para o usuário.");
        }
    };

    const loadContactMessages = async () => {
        const chatDocId = `${contactEmail}:${auth.currentUser.email}`;
        const chatRef = doc(db, 'chats', chatDocId);
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists()) {
            const chatData = chatSnap.data();
            const loadedMessages = chatData.messages.map((msg, index) => ({
                id: index + 1,
                text: msg.content,
                time: msg.time,
                from: 'other',
                status: msg.status // Inclui o status
            }));
            setMessages((prevMessages) => [...loadedMessages, ...prevMessages]);
        } else {
            console.log("Nenhuma mensagem encontrada para o contato.");
        }
    };

    useEffect(() => {
        loadMyMessages();
        loadContactMessages();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            // Muda a visibilidade para false ao sair do componente
            setIsChatVisible(false);
        });
        return unsubscribe;
    }, [navigation]);

    return (
        <View style={styles.chatContainer}>
            <ChatUpBar typeChat={typeChat} contactName={contactName} contactEmail={contactEmail} />
            {isChatVisible && ( // Renderiza ChatMessages apenas se isChatVisible for true
                <ChatMessages 
                    messages={messages} 
                    contactEmail={contactEmail}
                />
            )}
            <ChatBottomBar
                messageText={messageText}
                setMessageText={setMessageText}
                sendMessage={sendMessage}
            />
        </View>
    );
};

export default Chat;
