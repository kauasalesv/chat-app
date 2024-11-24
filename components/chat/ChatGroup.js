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

// const socket = io('http://192.168.112.206:3000');
const socket = io('http://192.168.1.7:3000'); 

const IDEA = require("idea-cipher");

const ChatGroup = () => {
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(true); // Adiciona estado para controle de visibilidade
    const [groupMembers, setGroupMembers] = useState([])
    const route = useRoute();
    const navigation = useNavigation();
    const { typeChat, groupId, groupName, groupCreator } = route.params;

    useEffect(() => {
        const userEmail = auth.currentUser.email;
        socket.emit('register', userEmail);
    
        socket.on('receiveGroupMessage', async (data) => {
            console.log(`Mensagem recebida (grupo): "${data.message}" de ${data.senderId}; chave: ${data.key}`);

            const myPriviteKey = await getPrivateKey(auth.currentUser.uid);
            const chaveCripitografada = await getMemberKeyFromGroup(groupId, userEmail);
            const chaveDescriptografada = await descriptografarRSA(chaveCripitografada, myPriviteKey);

            const message = descriptografarIDEA(fromBase64(data.message), fromBase64(chaveDescriptografada), myPriviteKey, chaveCripitografada, userEmail);

            const receivedMessage = { 
                id: messages.length + 1,
                text: message, 
                time: new Date(), 
                from: data.senderId,
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
        const myPublicKey = await getMyPublicKey();
        const chaveCripitografada = await getMemberKeyFromGroup(groupId, authEmail);
        const chaveDescriptografada = await descriptografarRSA(chaveCripitografada, myPriviteKey);

        const newMessage = { 
            id: messages.length + 1, 
            text: messageText, 
            time: new Date(), // Adiciona um timestamp
            from: authEmail, 
            sender: authEmail
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]); // Adiciona a mensagem ao estado

        const message = criptografarIDEA(messageText, fromBase64(chaveDescriptografada));

        // Envia a mensagem pelo Socket.io
        socket.emit('sendGroupMessage', { message: toBase64(message), key: chaveCripitografada, senderEmail: authEmail, groupId });

        console.log('\n\n');
        console.log("\x1b[31m", "Email remetente: ");
        console.log(authEmail);
        console.log("\x1b[31m", "Chave RSA pública remetente: ");
        console.log(myPublicKey);
        console.log("\x1b[31m", "Chave RSA privada remetente: ");
        console.log(myPriviteKey);
        console.log('\n');
        console.log("\x1b[31m", "Chave IDEA conversa: ");
        console.log(chaveDescriptografada);
        console.log('\n');
        console.log("\x1b[31m", "Mensagem: ");
        console.log(messageText);
        console.log('\n\n');

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
                    text: descriptografarIDEA(fromBase64(msg.content), fromBase64(chaveDescriptografada), myPriviteKey, chaveCripitografada, msg.sender),
                    time: msg.time,
                    from: authEmail,
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
                    text: descriptografarIDEA(fromBase64(msg.content), fromBase64(chaveDescriptografada), myPriviteKey, chaveCripitografada, msg.sender),
                    time: msg.time,
                    from: msg.sender,
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
        //console.log("Mensagem criptografada (hex):", criptografada.toString('hex'));
        return criptografada;
    }

    // Função para descriptografar a mensagem com IDEA
    function descriptografarIDEA(criptografada, chave, chavePrivada, chaveCriptografada, senderEmail) {
        const idea = new IDEA(chave);
        const descriptografada = idea.decrypt(criptografada);

        console.log('\n\n');
        console.log("\x1b[34m", "Email remetente:");
        console.log(senderEmail);
        console.log("\x1b[34m", "Mensagem criptografada:");
        console.log(toBase64(criptografada));
        console.log("\x1b[34m", "Chave IDEA criptografada:");
        console.log(chaveCriptografada);
        console.log("\x1b[34m", "Chave privada RSA:");
        console.log(chavePrivada);
        console.log("\x1b[34m", "Chave IDEA descriptografada:");
        console.log(toBase64(chave));
        console.log("\x1b[34m", "Mensagem descriptografada:");
        console.log(descriptografada.toString('utf-8'));
        console.log('\n\n');

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
                setGroupMembers(groupData.members);

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

    const getMyPublicKey = async () => {
        try {
            // Obtenha o UID do usuário autenticado
            const userId = auth.currentUser.uid; 
            const userDocRef = doc(db, 'users', userId); // Referência direta ao documento do usuário
            const userDoc = await getDoc(userDocRef); // Obtém o documento
    
            if (userDoc.exists()) {
                return userDoc.data().publicKey; // Acesse a chave pública
            } else {
                console.log("Documento do usuário não encontrado.");
                return null; // Retorna null se o documento não existir
            }
        } catch (error) {
            console.error("Erro ao buscar minha chave pública:", error);
            return null; // Retorna null em caso de erro
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
            <ChatUpBar typeChat={typeChat} contactName={groupName} contactEmail={groupId} groupCreator={groupCreator}/>
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
