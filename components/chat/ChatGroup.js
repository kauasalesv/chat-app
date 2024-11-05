import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Buffer } from 'buffer';
import { TextDecoder } from 'text-encoding';
import * as Keychain from 'react-native-keychain';
import Rsa from 'react-native-rsa-native';
import io from 'socket.io-client';
import styles from "./ChatStyles";

import ChatUpBar from '../layout/ChatUpBar';
import ChatMessages from './ChatMessages';
import ChatBottomBar from '../layout/ChatBottomBar';

const socket = io('http://192.168.4.206:3000');
const IDEA = require("idea-cipher");

const ChatGroup = () => {
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(true); // Adiciona estado para controle de visibilidade
    const route = useRoute();
    const navigation = useNavigation();
    const { typeChat, groupId, groupName } = route.params;

    useEffect(() => {
        const userEmail = auth.currentUser.email;
        socket.emit('register', userEmail);
    
        socket.on('receiveGroupMessage', async (data) => {
            console.log(`Mensagem recebida (grupo): "${data.message}" de ${data.senderId}; chave: ${data.key}`);

            const myPriviteKey = await getPrivateKey(auth.currentUser.uid);
            const chaveCripitografada = await getMemberKeyFromGroup(groupId, userEmail);
            const chaveDescriptografada = await descriptografarRSA(chaveCripitografada, myPriviteKey);


            const message = descriptografarIDEA(fromBase64(data.message), fromBase64(chaveDescriptografada), myPriviteKey, chaveCripitografada);

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

                /*
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
                */
            }
        });
    
        return () => {
            socket.off('receiveGroupMessage');
        };
    }, []);
    
    const sendMessage = async () => {
        const authEmail = auth.currentUser.email; // Obtém o email do usuário autenticado

        const myPriviteKey = await getPrivateKey(auth.currentUser.uid);
        const chaveCripitografada = await getMemberKeyFromGroup(groupId, authEmail);
        const chaveDescriptografada = await descriptografarRSA(chaveCripitografada, myPriviteKey);

        const newMessage = { 
            id: messages.length + 1, 
            text: messageText, 
            time: new Date(), // Adiciona um timestamp
            from: 'me', 
            sender: authEmail
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]); // Adiciona a mensagem ao estado

        const message = criptografarIDEA(messageText, fromBase64(chaveDescriptografada));

        // Envia a mensagem pelo Socket.io
        socket.emit('sendGroupMessage', { message: toBase64(message), key: chaveCripitografada, senderEmail: authEmail, groupId });
        setMessageText(''); 
    };

    const loadMyMessages = async () => {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);
    
        if (groupSnap.exists()) {
            const groupData = groupSnap.data();
            const authEmail = auth.currentUser.email; // Obtém o email do usuário autenticado

            const myPriviteKey = await getPrivateKey(auth.currentUser.uid);
            const chaveCripitografada = await getMemberKeyFromGroup(groupId, authEmail);
            const chaveDescriptografada = await descriptografarRSA(chaveCripitografada, myPriviteKey);

            const loadedMessages = groupData.messages
                .filter((msg) => msg.sender === authEmail) // Filtra as mensagens onde o remetente é o usuário autenticado
                .map((msg, index) => ({
                    id: index + 1,
                    text: descriptografarIDEA(fromBase64(msg.content), fromBase64(chaveDescriptografada), myPriviteKey, chaveCripitografada),
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

            const myPriviteKey = await getPrivateKey(auth.currentUser.uid);
            const chaveCripitografada = await getMemberKeyFromGroup(groupId, authEmail);
            const chaveDescriptografada = await descriptografarRSA(chaveCripitografada, myPriviteKey);

            const loadedMessages = groupData.messages
                .filter((msg) => msg.sender !== authEmail) 
                .map((msg, index) => ({
                    id: index + 1,
                    text: descriptografarIDEA(fromBase64(msg.content), fromBase64(chaveDescriptografada), myPriviteKey, chaveCripitografada),
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
    
    /*
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
    */

    // Função para criptografar a mensagem com IDEA
    function criptografarIDEA(mensagem, chave) {
        const idea = new IDEA(chave);
        const mensagemBuffer = Buffer.from(mensagem, 'utf-8');
        const criptografada = idea.encrypt(mensagemBuffer);
        console.log("Mensagem criptografada (hex):", criptografada.toString('hex'));
        return criptografada;
    }

    // Função para descriptografar a mensagem com IDEA
    function descriptografarIDEA(criptografada, chave, chavePrivada, chaveCriptografada) {
        const idea = new IDEA(chave);
        const descriptografada = idea.decrypt(criptografada);
        console.log("\nMensagem criptografada:", toBase64(criptografada));
        console.log("Chave IDEA criptografada:", chaveCriptografada);
        console.log("Chave privada RSA:", chavePrivada)
        console.log("Chave IDEA descriptografada:", toBase64(chave));
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

    const getPrivateKey = async (userId) => {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: `privateKey_${userId}`, // Adicione o serviço aqui
            });
            if (credentials) {
                return credentials.password; // Retorna a chave privada
            } else {
                console.log('Nenhuma chave privada encontrada.');
                return null;
            }
        } catch (error) {
            console.error('Erro ao recuperar a chave privada:', error);
        }
    };

    const criptografarRSA = async (message, publicKey) => {
        try {
            const encrypted = await Rsa.encrypt(message, publicKey);
            return encrypted;
        } catch (error) {
            console.error('Erro ao criptografar a mensagem:', error);
        }
    };

    // Função para descriptografar uma mensagem
    const descriptografarRSA = async (encryptedMessage, privateKey) => {
        try {
        const decrypted = await Rsa.decrypt(encryptedMessage, privateKey);
        return decrypted;
        } catch (error) {
        console.error('Erro ao descriptografar a mensagem:', error);
        }
    };

    const getMemberKeyFromGroup = async (groupId, memberEmail) => {
        try {
            // Busca o documento do grupo no Firestore
            const groupDoc = await getDoc(doc(db, 'groups', groupId));
    
            if (groupDoc.exists()) {
                const groupData = groupDoc.data();
    
                // Encontra o membro específico pelo email
                const member = groupData.members.find((m) => m.email === memberEmail);
    
                if (member) {
                    // Retorna a chave IDEA criptografada do membro
                    return member.key;
                } else {
                    console.log("Membro não encontrado no grupo.");
                    return null;
                }
            } else {
                console.log("Grupo não encontrado.");
                return null;
            }
        } catch (error) {
            console.error("Erro ao buscar a chave do membro:", error);
            return null;
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
