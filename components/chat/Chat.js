import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { doc, getDoc, setDoc, updateDoc, getDocs, where, query, collection, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Buffer } from 'buffer';
import { TextDecoder } from 'text-encoding';
import Rsa from 'react-native-rsa-native';
import * as Keychain from 'react-native-keychain';
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

    const user = auth.currentUser;

    useEffect(() => {
        const userEmail = auth.currentUser.email;
        socket.emit('register', userEmail);
    
        socket.on('receiveMessage', async (data) => {
            console.log(`Mensagem recebida: "${data.message}" de ${data.senderId}; chave: ${data.recipientKey}`);

            //message, senderKey, recipientKey, senderId: senderEmail

            const myPriviteKey = await getPrivateKey(user.uid);
            const chaveDescriptografada = await descriptografarRSA(data.recipientKey, myPriviteKey);

            const message = descriptografarIDEA(fromBase64(data.message), fromBase64(chaveDescriptografada))

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
        const myPriviteKey = await getPrivateKey(user.uid);

        const criptografia = await findExistingKey(messageText, userEmail, contactEmail, myPriviteKey);

        // Envia a mensagem pelo Socket.io
        socket.emit('sendMessage', { message: criptografia[0], senderKey: criptografia[1], recipientKey: criptografia[2], recipientEmail: contactEmail, senderEmail: userEmail });
        setMessageText(''); // Limpa o campo de 
    };

    const loadMyMessages = async () => {
        const userEmail = auth.currentUser.email;
        const chatDocId = `${userEmail}:${contactEmail}`;
        const chatRef = doc(db, 'chats', chatDocId);
        const chatSnap = await getDoc(chatRef);

        if (chatSnap.exists()) {
            const chatData = chatSnap.data();

            const myPriviteKey = await getPrivateKey(user.uid);
            const chaveDescriptografada = await descriptografarRSA(chatData.senderKey, myPriviteKey);

            const loadedMessages = chatData.messages.map((msg, index) => ({
                id: index + 1,
                text: descriptografarIDEA(fromBase64(msg.content), fromBase64(chaveDescriptografada)),
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
    
            const myPriviteKey = await getPrivateKey(user.uid);
            const chaveDescriptografada = await descriptografarRSA(chatData.recipientKey, myPriviteKey);

            // Atualiza o status das mensagens carregadas para 'read'
            const loadedMessages = chatData.messages.map((msg, index) => ({
                id: index + 1,
                text: descriptografarIDEA(fromBase64(msg.content), fromBase64(chaveDescriptografada)),
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

    // Função para descriptografar uma mensagem
    const descriptografarRSA = async (encryptedMessage, privateKey) => {
        try {
        const decrypted = await Rsa.decrypt(encryptedMessage, privateKey);
        return decrypted;
        } catch (error) {
        console.error('Erro ao descriptografar a mensagem:', error);
        }
    };

    // Função para criptografar uma mensagem
    const criptografarRSA = async (message, publicKey) => {
        try {
        const encrypted = await Rsa.encrypt(message, publicKey);
        return encrypted;
        } catch (error) {
        console.error('Erro ao criptografar a mensagem:', error);
        }
    };

    const findExistingKey = async (message, senderEmail, recipientEmail, myPriviteKey) => {
        try {
            // Definindo o ID do chat como `recipientEmail:userEmail`
            const chatId1 = `${recipientEmail}:${senderEmail}`;
            const chatId2 = `${senderEmail}:${recipientEmail}`;

            // Referência ao documento do chat com o ID especificad
            const chatDocRef1 = doc(db, 'chats', chatId1);
            const chatDocRef2 = doc(db, 'chats', chatId2);

            const chatDoc1 = await getDoc(chatDocRef1);
            const chatDoc2 = await getDoc(chatDocRef2);

            //const myPriviteKey = await getPrivateKey(user.uid);

            const senderPublicKey = await getMyPublicKey();
            const recipientPublicKey = await getContactPublicKey(recipientEmail);

            // Verificar se o documento existe e retornar a chave
            if (chatDoc1.exists()) {
                console.log("EXISTE 1");
                const chatData = chatDoc1.data();

                const chaveDescriptografada = await descriptografarRSA(chatData.recipientKey, myPriviteKey);

                const chave = fromBase64(chaveDescriptografada);
                const criptografada = criptografarIDEA(message, chave);

                // CRIPTOGRAFAR CHAVE
                const senderKey = await criptografarRSA(toBase64(chave), senderPublicKey);
                const recipientKey = await criptografarRSA(toBase64(chave), recipientPublicKey);

                const array = [toBase64(criptografada), senderKey, recipientKey];

                return array

            } else if (chatDoc2.exists()) {
                //console.log("EXISTE 2");
                const chatData = chatDoc2.data();

                const chaveDescriptografada = await descriptografarRSA(chatData.senderKey, myPriviteKey);

                const chave = fromBase64(chaveDescriptografada);
                const criptografada = criptografarIDEA(message, chave);

                // CRIPTOGRAFAR CHAVE
                const senderKey = await criptografarRSA(toBase64(chave), senderPublicKey);
                const recipientKey = await criptografarRSA(toBase64(chave), recipientPublicKey);

                const array = [toBase64(criptografada), senderKey, recipientKey];

                return array 
            }
            else {
                //console.log("NÃO EXISTE");
                const chave = gerarChaveIDEA();
                const criptografada = criptografarIDEA(message, chave);

                // CRIPTOGRAFAR CHAVE
                const senderKey = await criptografarRSA(toBase64(chave), senderPublicKey);
                const recipientKey = await criptografarRSA(toBase64(chave), recipientPublicKey);

                const array = [toBase64(criptografada), senderKey, recipientKey];

                return array
            }
        } catch (error) {
            console.error("Erro ao buscar a chave existente:", error);
            return null;
        }
    }

    const getContactPublicKey = async (contactEmail) => {
        // Buscar o usuário correspondente ao contactEmail
        const usersRef = collection(db, 'users'); 
        const q = query(usersRef, where('email', '==', contactEmail)); 

        const querySnapshot = await getDocs(q); 
        let recipientPublicKey = null;

        // Verifique se existem documentos retornados pela consulta
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            recipientPublicKey = userDoc.data().publicKey; // Acesse a chave pública

            return recipientPublicKey;

        } else {
            console.log("Nenhum usuário encontrado com esse e-mail.");
            return null; // Retorna null se o usuário não for encontrado
        }
    }

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

    useEffect(() => {
        loadMyMessages();
        loadContactMessages();
        getPrivateKey(user.uid);
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
