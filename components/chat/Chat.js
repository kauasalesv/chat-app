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

                // Atualiza o status das mensagens que estão pendentes para 'read'
                const chatDocId = `${userEmail}:${contactEmail}`;
                const chatRef = doc(db, 'chats', chatDocId);
                const chatSnap = await getDoc(chatRef);

                if (chatSnap.exists()) {
                    const chatData = chatSnap.data();
                    const updatedMessages = chatData.messages.map((msg) => {
                        if (msg.status === 'pending') {
                            return { ...msg, status: 'read' }; // Atualiza status de pending para read
                        }
                        return msg;
                    });
                    
                    // Atualiza as mensagens no Firestore
                    await updateDoc(chatRef, {
                        messages: updatedMessages
                    });
                }
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
            //console.log("Nenhuma mensagem encontrada para o usuário.");
        }
    };

    const loadContactMessages = async () => {
        const chatDocId = `${contactEmail}:${auth.currentUser.email}`;
        const chatRef = doc(db, 'chats', chatDocId);
        const chatSnap = await getDoc(chatRef);
    
        if (chatSnap.exists()) {
            const chatData = chatSnap.data();
    
            // Atualiza o status das mensagens carregadas para 'read'
            const loadedMessages = chatData.messages.map((msg, index) => ({
                id: index + 1,
                text: msg.content,
                time: msg.time,
                from: 'other',
                status: 'read' // Atualiza o status para 'read'
            }));
    
            // Atualiza o estado local
            setMessages((prevMessages) => [...loadedMessages, ...prevMessages]);
    
            // Atualiza o status das mensagens no Firestore
            await updateMessagesStatusToRead(chatRef, chatData.messages);
        } else {
            //console.log("Nenhuma mensagem encontrada para o contato.");
        }
    };
    
    const updateMessagesStatusToRead = async (chatRef, messages) => {
        try {
            // Atualiza apenas as mensagens que estão com status diferente de 'read'
            const updatedMessages = messages.map((msg) => {
                if (msg.status !== 'read') {
                    return { ...msg, status: 'read' };
                }
                return msg;
            });
    
            // Atualiza o documento no Firestore
            await updateDoc(chatRef, {
                messages: updatedMessages
            });
    
            //console.log("Status das mensagens atualizado para 'read'.");
        } catch (error) {
            console.error("Erro ao atualizar o status das mensagens no Firestore:", error);
        }
    };    


    // Função para salvar mensagem no Firestore
    const saveMessageToFirestore = async (message, senderEmail, recipientEmail, status) => {
        try {
            // Cria o ID do documento com base nos e-mails do remetente e do destinatário
            const chatDocId = `${senderEmail}:${recipientEmail}`;
            const chatRef = doc(db, 'chats', chatDocId); // Referência ao documento na coleção 'chats'

            // Verifica se o documento já existe
            const chatSnap = await getDoc(chatRef);

            const messageData = {
                content: message,
                time: new Date(),
                sender: senderEmail,
                status: status
            };

            if (chatSnap.exists()) {
                // O documento já existe, faz o push da nova mensagem no array de messages
                await updateDoc(chatRef, {
                    messages: arrayUnion(messageData) // Adiciona a nova mensagem ao array
                });
            } else {
                // O documento não existe, cria um novo
                await setDoc(chatRef, {
                    messages: [messageData] // Cria o documento com o array de messages
                });
            }

            console.log(`Mensagem salva no Firestore para ${recipientEmail}`);
        } catch (error) {
            console.error("Erro ao salvar mensagem no Firestore:", error);
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
