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

const ChatGroup = () => {
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(true); // Adiciona estado para controle de visibilidade
    const route = useRoute();
    const navigation = useNavigation();
    const { typeChat, groupId, groupName, groupKey } = route.params;

    useEffect(() => {
        const userEmail = auth.currentUser.email;
        socket.emit('register', userEmail);
    
        socket.on('receiveGroupMessage', async (data) => {
            console.log(`Mensagem recebida (grupo): "${data.message}" de ${data.senderId}; chave: ${data.key}`);
            const message = descriptografarIDEA(fromBase64(data.message), fromBase64(data.key))

            const receivedMessage = { 
                id: messages.length + 1,
                text: message, 
                time: new Date(), 
                from: 'other',
                sender: data.senderId
            };

            if (userEmail !== data.senderId) {
                setMessages((prevMessages) => [...prevMessages, receivedMessage]);

                // Atualiza o status das mensagens que estão pendentes para 'read'
                const groupRef = doc(db, 'groups', data.groupId);
                const groupSnap = await getDoc(groupRef);

                if (groupSnap.exists()) {
                    const groupData = groupSnap.data();
                    const updatedMessages = groupData.messages.map((msg) => {
                        if (msg.status === 'read') {
                            return { ...msg, status: 'read' }; // Atualiza status de pending para read
                        }
                        return msg;
                    });
                    
                    // Atualiza as mensagens no Firestore
                    await updateDoc(groupRef, {
                        messages: updatedMessages
                    });
                }
            }
        });
    
        return () => {
            socket.off('receiveGroupMessage');
        };
    }, []);
    
    const sendMessage = async () => {
        const authEmail = auth.currentUser.email; // Obtém o email do usuário autenticado

        const newMessage = { 
            id: messages.length + 1, 
            text: messageText, 
            time: new Date(), // Adiciona um timestamp
            from: 'me', 
            sender: authEmail
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]); // Adiciona a mensagem ao estado

        const message = criptografarIDEA(messageText, fromBase64(groupKey));

        // Envia a mensagem pelo Socket.io
        socket.emit('sendGroupMessage', { message: toBase64(message), key: groupKey, senderEmail: authEmail, groupId });
        setMessageText(''); 
    };

    const loadMyMessages = async () => {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);
    
        if (groupSnap.exists()) {
            const groupData = groupSnap.data();
            const authEmail = auth.currentUser.email; // Obtém o email do usuário autenticado

            const loadedMessages = groupData.messages
                .filter((msg) => msg.sender === authEmail) // Filtra as mensagens onde o remetente é o usuário autenticado
                .map((msg, index) => ({
                    id: index + 1,
                    text: descriptografarIDEA(fromBase64(msg.content), fromBase64(groupKey)),
                    time: msg.time,
                    from: 'me',
                    sender: authEmail,
                    status: msg.status,
                }));

            setMessages((prevMessages) => [...loadedMessages, ...prevMessages]);
        } else {
            console.log("Nenhuma mensagem encontrada para o grupo.");
        }
    };    

    const loadContactMessages = async () => {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);
    
        if (groupSnap.exists()) {
            const groupData = groupSnap.data();
            const authEmail = auth.currentUser.email; // Obtém o email do usuário autenticado

            const loadedMessages = groupData.messages
                .filter((msg) => msg.sender !== authEmail) 
                .map((msg, index) => ({
                    id: index + 1,
                    text: descriptografarIDEA(fromBase64(msg.content), fromBase64(groupKey)),
                    time: msg.time,
                    from: 'other',
                    sender: msg.sender,
                    status: msg.status
                }));
    
            // Atualiza o estado local
            setMessages((prevMessages) => [...loadedMessages, ...prevMessages]);
    
            // Atualiza o status das mensagens no Firestore para 'read'
            //await updateMessagesStatusToRead(groupRef, groupData.messages.filter((msg) => msg.sender !== authEmail));
        } else {
            console.log("Nenhuma mensagem encontrada para o contato.");
        }
    };    
    
    const updateMessagesStatusToRead = async (groupRef, messages) => {
        try {
            // Atualiza apenas as mensagens que estão com status diferente de 'read'
            const updatedMessages = messages.map((msg) => {
                if (msg.status !== 'read') {
                    return { ...msg, status: 'read' };
                }
                return msg;
            });
    
            // Atualiza o documento no Firestore
            await updateDoc(groupRef, {
                messages: updatedMessages
            });
    
            //console.log("Status das mensagens atualizado para 'read'.");
        } catch (error) {
            console.error("Erro ao atualizar o status das mensagens no Firestore:", error);
        }
    };    

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
            <ChatUpBar typeChat={typeChat} contactName={groupName} contactEmail={groupId} />
            {isChatVisible && ( // Renderiza ChatMessages apenas se isChatVisible for true
                <ChatMessages 
                    messages={messages} 
                    contactEmail={groupId}
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

export default ChatGroup;
