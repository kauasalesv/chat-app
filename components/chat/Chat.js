import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Buffer } from 'buffer';
import { TextDecoder } from 'text-encoding';
import io from 'socket.io-client';
import styles from "./ChatStyles";

import ChatUpBar from '../layout/ChatUpBar';
import ChatMessages from './ChatMessages';
import ChatBottomBar from '../layout/ChatBottomBar';

const socket = io('http://192.168.1.7:3000');
const IDEA = require("idea-cipher");

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
            console.log(`Mensagem recebida: "${data.message}" de ${data.senderId}; chave: ${data.key}`);
            const message = descriptografarIDEA(fromBase64(data.message), fromBase64(data.key))

            console.log(message);

            const receivedMessage = { 
                id: messages.length + 1,
                text: message, 
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
        const criptografia = await findExistingKey(messageText, userEmail, contactEmail);

        // Envia a mensagem pelo Socket.io
        socket.emit('sendMessage', { message: criptografia[0], key: criptografia[1], recipientEmail: contactEmail, senderEmail: userEmail });
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
                text: descriptografarIDEA(fromBase64(msg.content), fromBase64(chatData.key)),
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
                text: descriptografarIDEA(fromBase64(msg.content), fromBase64(chatData.key)),
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

    // Função para gerar uma chave IDEA (128 bits, 16 bytes)
    function gerarChaveIDEA() {
        // Em produção, use um gerador de chaves seguro
        return Buffer.from(Array.from({ length: 16 }, () => Math.floor(Math.random() * 256)));
    }

    // Função para criptografar a mensagem com IDEA
    function criptografarIDEA(mensagem, chave) {
        const idea = new IDEA(chave);
        const mensagemBuffer = Buffer.from(mensagem, 'utf-8');
        const criptografada = idea.encrypt(mensagemBuffer);
        console.log("Mensagem criptografada (hex):", criptografada.toString('hex'));
        return criptografada;
    }

    // Função para descriptografar a mensagem com IDEA
    function descriptografarIDEA(criptografada, chave) {
        const idea = new IDEA(chave);
        const descriptografada = idea.decrypt(criptografada);
        console.log("Mensagem descriptografada:", descriptografada.toString('utf-8'));
        return descriptografada.toString('utf-8');
    }

    // Função para converter Uint8Array ou Buffer para base64
    function toBase64(data) {
        return Buffer.from(data).toString('base64');
    }

    // Função para converter base64 de volta para Uint8Array
    function fromBase64(base64String) {
        return new Uint8Array(Buffer.from(base64String, 'base64'));
    }

    const findExistingKey = async (message, senderEmail, recipientEmail) => {
        try {
            // Definindo o ID do chat como `recipientEmail:userEmail`
            const chatId1 = `${recipientEmail}:${senderEmail}`;
            const chatId2 = `${senderEmail}:${recipientEmail}`;

            // Referência ao documento do chat com o ID especificad
            const chatDocRef1 = doc(db, 'chats', chatId1);
            const chatDocRef2 = doc(db, 'chats', chatId2);

            const chatDoc1 = await getDoc(chatDocRef1);
            const chatDoc2 = await getDoc(chatDocRef2);

            // Verificar se o documento existe e retornar a chave
            if (chatDoc1.exists()) {
                //console.log("EXISTE 1");
                const chatData = chatDoc1.data();

                const chave = fromBase64(chatData.key);
                const criptografada = criptografarIDEA(message, chave);

                const array = [toBase64(criptografada), chatData.key]

                return array

            } else if (chatDoc2.exists()) {
                //console.log("EXISTE 2");
                const chatData = chatDoc2.data();

                const chave = fromBase64(chatData.key);
                const criptografada = criptografarIDEA(message, chave);

                const array = [toBase64(criptografada), chatData.key]

                return array 
            }
            else {
                //console.log("NÃO EXISTE");
                const chave = gerarChaveIDEA();
                const criptografada = criptografarIDEA(message, chave);

                const array = [toBase64(criptografada), toBase64(chave)]

                return array
            }
        } catch (error) {
            console.error("Erro ao buscar a chave existente:", error);
            return null;
        }
    }

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
