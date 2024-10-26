const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, arrayUnion } = require('firebase/firestore'); // Importar Firestore
const { db } = require('../config/firebase'); // Importar configuração do Firebase
const { Buffer } =  require('buffer');
const { TextDecoder } = require('text-encoding');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const IDEA = require("idea-cipher");

// Armazenar conexões dos usuários (email -> socketId)
const userSockets = {};

io.on('connection', (socket) => {
    // Quando um usuário se conecta, armazene seu socketId com o email
    socket.on('register', (email) => {
        userSockets[email] = socket.id; // Mapeia o email ao socketId
        //console.log('Usuário conectado:', socket.id);
        console.log(`Usuário registrado: ${email} com socket ${socket.id}`);
    });

    // Escuta por mensagens enviadas por um usuário
    socket.on('sendMessage', async (data) => {
        const { message, key, senderEmail, recipientEmail } = data;
        console.log(`Mensagem recebida no servidor:`, data); // Log para ver a mensagem recebida

        // Envia a mensagem ao usuário específico pelo email
        const recipientSocketId = userSockets[recipientEmail];
        if (recipientSocketId) {
            console.log(recipientSocketId);
            await saveMessageToFirestore(message, key, senderEmail, recipientEmail); 
            io.to(recipientSocketId).emit('receiveMessage', { message, key, senderId: senderEmail });
            console.log(`Mensagem enviada para ${recipientEmail}: "${message}" de ${senderEmail}`);
        } else {
            console.log(`${recipientEmail} está offline, persistindo a mensagem no Firestore.`);
            await saveMessageToFirestore(message, key, senderEmail, recipientEmail); // Salva a mensagem no Firestore
        }
    });

    socket.on('disconnect', () => {
        //console.log('Usuário desconectado:', socket.id);
        // Remover o usuário do mapeamento quando desconectar
        for (const email in userSockets) {
            if (userSockets[email] === socket.id) {
                console.log(`Usuário desconectado: ${email}`);
                delete userSockets[email];
                break;
            }
        }
    });
});

    // Função para salvar mensagem no Firestore
    const saveMessageToFirestore = async (message, key, senderEmail, recipientEmail) => {
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
                status: 'pending',
            };

            if (chatSnap.exists()) {
                // O documento já existe, faz o push da nova mensagem no array de messages
                await updateDoc(chatRef, {
                    key : key,
                    messages: arrayUnion(messageData) // Adiciona a nova mensagem ao array
                });
            } else {
                // O documento não existe, cria um novo
                console.log(messageData);
                await setDoc(chatRef, {
                    key : key,
                    messages: [messageData] // Cria o documento com o array de messages
                });
            }

            console.log(`Mensagem persistida no Firestore para ${recipientEmail}`);
        } catch (error) {
            console.error("Erro ao salvar mensagem no Firestore:", error);
        }
    };

    // Função para converter Uint8Array ou Buffer para base64
    function toBase64(data) {
        return Buffer.from(data).toString('base64');
    }

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
