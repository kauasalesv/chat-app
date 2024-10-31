const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, arrayUnion } = require('firebase/firestore'); // Importar Firestore
const { auth, db } = require('../config/firebase'); // Importar configuração do Firebase
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
        const { message, senderKey, recipientKey, senderEmail, recipientEmail } = data;

        console.log(`Mensagem recebida no servidor:`, data); // Log para ver a mensagem recebida

        // Envia a mensagem ao usuário específico pelo email
        const recipientSocketId = userSockets[recipientEmail];
        if (recipientSocketId) {
            console.log(recipientSocketId);
            await saveMessageToFirestore(message, senderKey, recipientKey, senderEmail, recipientEmail); 

            io.to(recipientSocketId).emit('receiveMessage', { message, senderKey, recipientKey, senderId: senderEmail });

            console.log(`Mensagem enviada para ${recipientEmail}: "${message}" de ${senderEmail}`);
        } else {
            console.log(`${recipientEmail} está offline, persistindo a mensagem no Firestore.`);
            await saveMessageToFirestore(message, senderKey, recipientKey, senderEmail, recipientEmail);
        }
    });

    // Envio de mensagem para um grupo
    socket.on('sendGroupMessage', async (data) => {
        const { message, key, senderEmail, groupId } = data;
        console.log(`Mensagem (grupo) recebida no servidor:`, data);

        // Salva a mensagem no Firestore
        await saveGroupMessageToFirestore(message, key, senderEmail, groupId);

        // Envia a mensagem para todos os participantes conectados do grupo
        const groupMembers = await getGroupMembers(groupId, senderEmail);
        console.log(userSockets);
        console.log(groupMembers);
        
        groupMembers.forEach((memberEmail) => {
            const memberSocketId = userSockets[memberEmail];
            console.log(`ID do socket para ${memberEmail}:`, memberSocketId);
            
            if (memberSocketId) {
                if (memberEmail !== senderEmail) {
                    io.to(memberSocketId).emit('receiveGroupMessage', { message, key, senderId: senderEmail, groupId });
                    console.log(`Mensagem enviada para ${memberEmail} no grupo ${groupId}`);
                } else {
                    console.log(`Mensagem não enviada para ${memberEmail} pois é o remetente`);
                }
            } else {
                console.log(`Nenhum socket encontrado para ${memberEmail}`); // Log para sockets não encontrados
            }
        });
        
        
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
    const saveMessageToFirestore = async (message, senderKey, recipientKey, senderEmail, recipientEmail) => {
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
                    senderKey: senderKey,
                    recipientKey: recipientKey,
                    messages: arrayUnion(messageData) // Adiciona a nova mensagem ao array
                });
            } else {
                // O documento não existe, cria um novo
                console.log(messageData);
                await setDoc(chatRef, {
                    senderKey: senderKey,
                    recipientKey: recipientKey,
                    messages: [messageData] // Cria o documento com o array de messages
                });
            }

            console.log(`Mensagem persistida no Firestore para ${recipientEmail}`);
        } catch (error) {
            console.error("Erro ao salvar mensagem no Firestore:", error);
        }
    };

    // Função para salvar mensagem de grupo no Firestore
    const saveGroupMessageToFirestore = async (message, key, senderEmail, groupId) => {
        try {
            const groupRef = doc(db, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);

            const messageData = {
                content: message,
                time: new Date(),
                sender: senderEmail,
                status: 'read',
            };

            if (groupSnap.exists()) {
                await updateDoc(groupRef, {
                    messages: arrayUnion(messageData) 
                });
            } else {
                await setDoc(groupRef, {
                    messages: [messageData] 
                });
            }

            console.log(`Mensagem de grupo persistida no Firestore para o grupo ${groupId}`);
        } catch (error) {
            console.error("Erro ao salvar mensagem de grupo no Firestore:", error);
        }
    };

// Função para obter os membros do grupo a partir do Firestore
const getGroupMembers = async (groupId, authenticatedEmail) => {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);

    if (groupSnap.exists()) {
        const groupData = groupSnap.data();
        // Filtra os membros para remover o e-mail do usuário autenticado
        const members = groupData.members || [];

        // Extraí os e-mails dos objetos e filtra o e-mail autenticado
        return members
            .map(member => member.email) // Mapeia para um array de e-mails
            .filter(email => email !== authenticatedEmail); // Remove o e-mail do usuário autenticado
    }
    return [];
};


server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
