const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, arrayUnion, deleteDoc } = require('firebase/firestore'); // Importar Firestore
const { auth, db } = require('../config/firebase'); // Importar configuração do Firebase

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const cors = require('cors');
 
app.use(cors({
    //origin: 'http://192.168.1.7:8081', // Substitua pela origem do seu frontend
    origin: 'http://192.168.119.206:8081', // Substitua pela origem do seu frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
}));

const nodemailer = require('nodemailer'); // Biblioteca para enviar e-mails
const crypto = require('crypto'); // Biblioteca para geração de códigos aleatórios
 
app.use(express.json()); // Middleware para processar JSON no corpo das requisições

// -----> TROCA DE MENSAGENS <------ //
// Armazenar conexões dos usuários (email -> socketId)
const userSockets = {};

io.on('connection', (socket) => {
    // Quando um usuário se conecta, armazene seu socketId com o email
    socket.on('register', (email) => {
        userSockets[email] = socket.id; // Mapeia o email ao socketId
        //console.log('Usuário conectado:', socket.id);
        console.log("\x1b[35m", 'Usuário registrado: ');
        console.log("\x1b[0m", `${email} com socket ${socket.id}`);
    });

    // Escuta por mensagens enviadas por um usuário
    socket.on('sendMessage', async (data) => {
        const { message, senderKey, recipientKey, senderEmail, recipientEmail } = data;

        console.log(`Mensagem recebida no servidor:`, data); // Log para ver a mensagem recebida

        // Envia a mensagem ao usuário específico pelo email
        const recipientSocketId = userSockets[recipientEmail];
        if (recipientSocketId) {
            //console.log(recipientSocketId);
            await saveMessageToFirestore(message, senderKey, recipientKey, senderEmail, recipientEmail); 

            io.to(recipientSocketId).emit('receiveMessage', { message, senderKey, recipientKey, senderId: senderEmail });

            //console.log(`Mensagem enviada para ${recipientEmail}: "${message}" de ${senderEmail}`);
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
        //console.log(userSockets);
        //console.log(groupMembers);
        
        groupMembers.forEach((memberEmail) => {
            const memberSocketId = userSockets[memberEmail];
            //console.log(`ID do socket para ${memberEmail}:`, memberSocketId);
            
            if (memberSocketId) {
                if (memberEmail !== senderEmail) {
                    io.to(memberSocketId).emit('receiveGroupMessage', { message, key, senderId: senderEmail, groupId });
                    //console.log(`Mensagem enviada para ${memberEmail} no grupo ${groupId}`);
                } else {
                    //console.log(`Mensagem não enviada para ${memberEmail} pois é o remetente`);
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

                console.log("\x1b[35m", `Usuário desconectado: `);
                console.log("\x1b[0m", `${email} com socket ${socket.id}`);

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
            const chatDocId1 = `${senderEmail}:${recipientEmail}`;
            const chatDocId2 = `${recipientEmail}:${senderEmail}`;

            const chatRef1 = doc(db, 'chats', chatDocId1); // Referência ao documento na coleção 'chats'
            const chatRef2 = doc(db, 'chats', chatDocId2); // Referência ao documento na coleção 'chats'

            // Verifica se o documento já existe
            const chatSnap1 = await getDoc(chatRef1);
            const chatSnap2 = await getDoc(chatRef2);

            const messageData = {
                content: message,
                time: new Date(),
                sender: senderEmail,
                recipient: recipientEmail,
                status: 'pending',
            };

            if (chatSnap1.exists()) {
                // O documento já existe, faz o push da nova mensagem no array de messages
                await updateDoc(chatRef1, {
                    [removeDot(senderEmail)]: senderKey,
                    [removeDot(recipientEmail)]: recipientKey,
                    messages: arrayUnion(messageData) // Adiciona a nova mensagem ao array
                });

            } else if (chatSnap2.exists()) {
                // O documento já existe, faz o push da nova mensagem no array de messages
                await updateDoc(chatRef2, {
                    [removeDot(senderEmail)]: senderKey,
                    [removeDot(recipientEmail)]: recipientKey,
                    messages: arrayUnion(messageData) // Adiciona a nova mensagem ao array
                });

            } else {
                // O documento não existe, cria um novo
                //console.log(messageData);
                await setDoc(chatRef1, {
                    [removeDot(senderEmail)]: senderKey,
                    [removeDot(recipientEmail)]: recipientKey,
                    messages: arrayUnion(messageData) // Cria o documento com o array de messages
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

const removeDot = (email) => email.replace(/\./g, ',');


// -----> CÓDIGO DE CONFIRMAÇÃO <------ //
// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Ou outro serviço de e-mail que você usa
    auth: {
        user: 'testchatapptestchatapp@gmail.com', // Seu e-mail
        pass: 'rymd guky chzd iike' // Sua senha (recomenda-se usar uma senha de aplicativo)
    },
    tls: {
      rejectUnauthorized: false, // Configuração de TLS
    },
    port: 465, // Porta SMTP com SSL
  });

// Função para adicionar documento na coleção 'codes'
const addCodeDocument = async (code, email) => {
    try {
        // Documento que será adicionado
        const newDocument = {
            code: code,
            email: email,
        };

        // Referência à coleção 'codes', onde o ID do documento será o email
        const docRef = doc(db, 'codes', email); // O ID será o email

        // Adicionando o documento com o ID personalizado
        await setDoc(docRef, newDocument);
        console.log("Documento adicionado com ID:", email);
    } catch (error) {
        console.error("Erro ao adicionar documento:", error);
    }
};

// POST para gerar e enviar código de verificação
app.post('/generate-code', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'E-mail é obrigatório' });
    }

    try {
    //     // Gera um código aleatório de 6 dígitos
        const code = crypto.randomInt(100000, 999999).toString();


 
        // Agora você pode adicionar o documento ao Firestore
        addCodeDocument(code,email);
        

        // Envia o e-mail com o código
        const mailOptions = {
            from: 'testchatapptestchatapp@gmail.com',
            to: email,
            subject: 'Seu código de verificação',
            text: `Seu código de verificação é: ${code}`
        };

        await transporter.sendMail(mailOptions);

        console.log(`Código enviado para ${email}: ${code}`);
        res.status(200).json({ message: 'Código enviado com sucesso' });
    } catch (error) {
        console.error('Erro ao gerar ou enviar o código:', error);
        res.status(500).json({ message: 'Erro ao gerar ou enviar o código' });
    }
});

app.post('/verificar-codigo', async (req, res) => {
    const { email, code } = req.body;

    // Validação de entrada
    if (!email || !code) {
        return res.status(400).json({ message: 'Email e código são obrigatórios.' });
    }

    try {
        // Referência à coleção "codes"
        const codesCollection = collection(db, 'codes');
        
        // Consulta para encontrar o documento com o campo "email" correspondente
        const q = query(codesCollection, where("email", "==", email));
        const querySnapshot = await getDocs(q); // Obtém os documentos que correspondem à consulta

        // Verifica se algum documento foi encontrado
        if (querySnapshot.empty) {
            return res.status(404).json({ message: 'Código não encontrado para este email.' });
        }

        // Itera sobre os documentos encontrados (deve haver no máximo um)
        let codeData = null;
        querySnapshot.forEach((doc) => {
            codeData = doc.data(); // Obtém os dados do primeiro documento encontrado
        });

        // Verifica se o código fornecido é igual ao armazenado no Firestore
        if (codeData.code === code) {
            // Se a verificação for bem-sucedida, você pode excluir o código (opcional)
            await deleteDoc(querySnapshot.docs[0].ref); // Exclui o primeiro documento encontrado

            return res.status(200).json({ message: 'Código verificado com sucesso!' });
        } else {
            return res.status(400).json({ message: 'Código incorreto.' });
        }
    } catch (error) {
        console.error('Erro ao verificar o código:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});


// -----> RODAR SERVIDOR NA PORTA <------ //
server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
