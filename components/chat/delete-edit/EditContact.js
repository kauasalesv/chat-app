import React, { useState } from 'react';
import { View, ScrollView, Image, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, updateDoc, arrayRemove, getDoc, collection, query, where, getDocs, arrayUnion, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase'; 
import { Buffer } from 'buffer';
import Rsa from 'react-native-rsa-native';
import * as Keychain from 'react-native-keychain';

import styles from "./EditContactStyles";

const IDEA = require("idea-cipher");


const EditContact = ({ route }) => {
    const navigation = useNavigation();
    const { contactName, contactEmail } = route.params;
    const user = auth.currentUser;

    // Estado para armazenar o valor do nome do contato
    const [name, setName] = useState(contactName); // Inicia com o valor de contactName

    // Função para salvar as atualizações no nome do contato
    const handleUpdateContact = async () => {
        try {
            const userId = auth.currentUser.uid; // Obtém o ID do usuário autenticado
            const userRef = doc(db, 'users', userId); // Referência ao documento do usuário

            // Primeiro, obter o documento do usuário para verificar os contatos
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const contacts = userData.contacts || [];

                // Encontrar o contato antigo para removê-lo
                const oldContact = contacts.find(contact => contact.email === contactEmail);

                // Remover o contato antigo e adicionar o contato atualizado com o novo nome
                if (oldContact) {
                    await updateDoc(userRef, {
                        contacts: arrayRemove(oldContact) // Remove o contato antigo
                    });

                    await updateDoc(userRef, {
                        contacts: arrayUnion({ name, email: contactEmail }) // Adiciona o contato atualizado
                    });

                    console.log(name)

                    Alert.alert("Sucesso", "O contato foi atualizado com sucesso!");
                    navigation.navigate('Chat', { contactName: name, contactEmail: contactEmail, typeChat: 'chat' });
                }
            }
        } catch (error) {
            console.error("Erro ao atualizar o contato:", error);
            Alert.alert("Erro", "Ocorreu um erro ao atualizar o contato.");
        }
    };

    // Função para excluir o contato com confirmação
    const handleDeleteContact = () => {
        Alert.alert(
            "Atenção",
            "Você realmente deseja excluir esse contato? Esta ação não pode ser desfeita e você perderá a sua conversa (seu contato também perderá).",
            [
                {
                    text: "Cancelar",
                    onPress: () => console.log("Exclusão cancelada"),
                    style: "cancel" // Estilo do botão "Cancelar"
                },
                {
                    text: "Excluir",
                    onPress: async () => {
                        try {
                            const userId = auth.currentUser.uid; // Obtém o ID do usuário autenticado
                            const userRef = doc(db, 'users', userId); // Referência ao documento do usuário

                            const userEmail = auth.currentUser.email;
                            const chatId1 = `${userEmail}:${contactEmail}`;
                            const chatId2 = `${contactEmail}:${userEmail}`;

                            try {
                                const chatRef1 = doc(db, 'chats', chatId1);
                                await deleteDoc(chatRef1);
                                console.log(`Documento ${chatId1} excluído com sucesso.`);
                            } catch (error) {
                                console.error("Erro ao excluir chatId1:", error);
                            }
                            
                            try {
                                const chatRef2 = doc(db, 'chats', chatId2);
                                await deleteDoc(chatRef2);
                                console.log(`Documento ${chatId2} excluído com sucesso.`);
                            } catch (error) {
                                console.error("Erro ao excluir chatId2:", error);
                            }
                            

                            // Primeiro, obter o documento do usuário para verificar os contatos
                            const userSnap = await getDoc(userRef);
                            if (userSnap.exists()) {
                                const userData = userSnap.data();
                                const contacts = userData.contacts || [];

                                // Encontrar o contato a ser removido
                                const contactToRemove = contacts.find(contact => contact.email === contactEmail);

                                // Remover o contato
                                if (contactToRemove) {
                                    await updateDoc(userRef, {
                                        contacts: arrayRemove(contactToRemove) // Remove o contato
                                    });

                                    Alert.alert("Sucesso", "O contato foi removido com sucesso!");
                                    navigation.navigate('Home');
                                }
                            }
                        } catch (error) {
                            console.error("Erro ao excluir o contato:", error);
                            Alert.alert("Erro", "Ocorreu um erro ao excluir o contato.");
                        }
                    },
                    style: "destructive" // Estilo do botão "Excluir" (vermelho)
                }
            ]
        );
    };

    // Função para navegar para a tela de chat
    const handleStartChat = () => {
        navigation.navigate('Chat', { 
            typeChat: 'chat', 
            contactName, 
            contactEmail 
        }); // Passa o tipo de chat, nome e e-mail do contato
    };

    const changeKey = async () => {
        try{
            // Cria o ID do documento com base nos e-mails do remetente e do destinatário
            const chatDocId1 = `${user.email}:${contactEmail}`;
            const chatDocId2 = `${contactEmail}:${user.email}`;

            const chatRef1 = doc(db, 'chats', chatDocId1); // Referência ao documento na coleção 'chats'
            const chatRef2 = doc(db, 'chats', chatDocId2); // Referência ao documento na coleção 'chats'

            // Verifica se o documento já existe
            const chatSnap1 = await getDoc(chatRef1);
            const chatSnap2 = await getDoc(chatRef2);

            if (chatSnap1.exists()) {
                const chatData = chatSnap1.data();

                // TROCA CHAVE IDEA
                // Estados iniciais
                const oldMembers = [
                    { email: user.email, key: chatData[removeDot(user.email)] },
                    { email: contactEmail, key: chatData[removeDot(contactEmail)] }
                ];                
                const oldMessages = chatData.messages || [];

                let members = [...oldMembers]; // Clonando para modificar
                let messages = [...oldMessages]; // Clonando para modificar

                const oldEncryptedIdea = chatData[removeDot(user.email)];
                const publicKey = await getMyPublicKey();
                const privateKey = await getPrivateKey();
                const oldDecryptedIdea = await descriptografarRSA(oldEncryptedIdea, privateKey);
                const newIdea = gerarChaveIDEA();

                const newKeyMembers = [];

                if (messages) {
                    // Atualizar mensagens
                    messages = messages.map(message => {
                        if (message.content) {
                            const decryptedMessage = descriptografarIDEA(
                                fromBase64(message.content),
                                fromBase64(oldDecryptedIdea)
                            );
                            const encryptedMessage = criptografarIDEA(decryptedMessage, newIdea);
                            return { ...message, content: toBase64(encryptedMessage) };
                        }
                        return message;
                    });

                    // Atualizar chaves dos membros
                    members = await Promise.all(
                        members.map(async member => {
                            const publicKey = await getContactPublicKey(member.email);
                            const encryptedIdea = await criptografarRSA(toBase64(newIdea), publicKey);
                            return { ...member, key: encryptedIdea };
                        })
                    );
                
                    await updateDoc(chatRef1, {
                        [removeDot(user.email)]: members[0].key,
                        [removeDot(contactEmail)]: members[1].key,
                        messages: messages,
                    });
        
                    // Logs para depuração
                    console.log("\x1b[32m", "Estado inicial dos membros:", "\x1b[37m", oldMembers);
                    console.log("\x1b[32m", "Estado inicial da chave IDEA:", "\x1b[37m", oldDecryptedIdea);
                    console.log("\x1b[32m", "Estado inicial das mensagens:", "\x1b[37m", oldMessages);
                    console.log("\x1b[32m", "Estado final da chave IDEA:", "\x1b[37m", toBase64(newIdea));
                    console.log("\x1b[32m", "Estado final das mensagens (após modificação):", "\x1b[37m", messages);
                    console.log("\x1b[32m", "Estado final dos membros (após modificação):", "\x1b[37m", members);

                }
            } else if (chatSnap2.exists()) {
                const chatData = chatSnap2.data();

                // TROCA CHAVE IDEA
                // Estados iniciais
                const oldMembers = [
                    { email: user.email, key: chatData[removeDot(user.email)] },
                    { email: contactEmail, key: chatData[removeDot(contactEmail)] }
                ];                
                const oldMessages = chatData.messages || [];

                let members = [...oldMembers]; // Clonando para modificar
                let messages = [...oldMessages]; // Clonando para modificar

                const oldEncryptedIdea = chatData[removeDot(user.email)];
                const publicKey = await getMyPublicKey();
                const privateKey = await getPrivateKey();
                const oldDecryptedIdea = await descriptografarRSA(oldEncryptedIdea, privateKey);
                const newIdea = gerarChaveIDEA();

                const newKeyMembers = [];

                if (messages) {
                    // Atualizar mensagens
                    messages = messages.map(message => {
                        if (message.content) {
                            const decryptedMessage = descriptografarIDEA(
                                fromBase64(message.content),
                                fromBase64(oldDecryptedIdea)
                            );
                            const encryptedMessage = criptografarIDEA(decryptedMessage, newIdea);
                            return { ...message, content: toBase64(encryptedMessage) };
                        }
                        return message;
                    });

                    // Atualizar chaves dos membros
                    members = await Promise.all(
                        members.map(async member => {
                            const publicKey = await getContactPublicKey(member.email);
                            const encryptedIdea = await criptografarRSA(toBase64(newIdea), publicKey);
                            return { ...member, key: encryptedIdea };
                        })
                    );
                    
                    await updateDoc(chatRef2, {
                        [removeDot(user.email)]: members[0].key,
                        [removeDot(contactEmail)]: members[1].key,
                        messages: messages,
                    });

            }

            // Logs para depuração
            console.log("\x1b[32m", "Estado inicial dos membros:", "\x1b[37m", oldMembers);
            console.log("\x1b[32m", "Estado inicial da chave IDEA:", "\x1b[37m", oldDecryptedIdea);
            console.log("\x1b[32m", "Estado inicial das mensagens:", "\x1b[37m", oldMessages);
            console.log("\x1b[32m", "Estado final da chave IDEA:", "\x1b[37m", toBase64(newIdea));
            console.log("\x1b[32m", "Estado final das mensagens (após modificação):", "\x1b[37m", messages);
            console.log("\x1b[32m", "Estado final dos membros (após modificação):", "\x1b[37m", members);
        }
            Alert.alert("Sucesso", "A chave da conversa foi atualizada com sucesso!");

        } catch (error) {
            Alert.alert("Erro", "Ocorreu um erro ao atualizar a chave da conversa.");
            console.error(error);
        }
    }

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

    // Função para converter Uint8Array ou Buffer para base64
    function toBase64(data) {
        return Buffer.from(data).toString('base64');
    }

    // Função para converter base64 de volta para Uint8Array
    function fromBase64(base64String) {
        return new Uint8Array(Buffer.from(base64String, 'base64'));
    }

    function gerarChaveIDEA() {
        return Buffer.from(Array.from({ length: 16 }, () => Math.floor(Math.random() * 256)));
    }

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
        // console.log('\n\n');
        // console.log("\x1b[34m", "Email remetente:");
        // console.log(senderEmail);
        // console.log("\x1b[34m", "Mensagem criptografada:");
        // console.log(toBase64(criptografada));
        // console.log("\x1b[34m", "Chave IDEA criptografada:");
        // console.log(chaveCriptografada);
        // console.log("\x1b[34m", "Chave privada RSA:");
        // console.log(chavePrivada);
        // console.log("\x1b[34m", "Chave IDEA descriptografada:");
        // console.log(toBase64(chave));
        // console.log("\x1b[34m", "Mensagem descriptografada:");
        // console.log(descriptografada.toString('utf-8'));
        // console.log('\n\n');

        return descriptografada.toString('utf-8');
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

    const getPrivateKey = async () => {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: `privateKey_${user.uid}`, // Adicione o serviço aqui
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

    const getContactPublicKey = async (contactEmail) => {
        const usersRef = collection(db, 'users'); 
        const q = query(usersRef, where('email', '==', contactEmail)); 
        const querySnapshot = await getDocs(q); 
        let recipientPublicKey = null;

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            recipientPublicKey = userDoc.data().publicKey; 
            return recipientPublicKey;
        } else {
            console.log("Nenhum usuário encontrado com esse e-mail.");
            return null; 
        }
    };

    const removeDot = (email) => email.replace(/\./g, ',');

    return (
        <ScrollView style={styles.editContactContainer}>
            <View style={styles.editContactReturn}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Image 
                        source={require('../../../assets/returnImage.png')}
                        style={styles.editContactReturnImage} 
                    />
                </TouchableOpacity>

                <Text style={styles.editContactTittle}>Editar Contato</Text>
            </View>

            <View style={styles.editContactHead}>
                <Image 
                    source={require('../../../assets/userImage.png')}
                    style={styles.editContactHeadUserImage} 
                />
            </View>

            <View style={styles.editContactInfoContainer}>
                <View style={styles.editContactInfo}>
                    {/* Campo Nome */}
                    <Text style={styles.editContactInfoTittle}>Nome</Text>
                    <TextInput
                        style={styles.editContactInfoInput}
                        value={name} // Define o valor inicial como o nome do contato
                        onChangeText={text => setName(text)} // Permite editar o nome
                    />

                    {/* Campo Email (somente leitura) */}
                    <Text style={styles.editContactInfoTittle}>Usuário</Text>
                    <Text style={styles.editContactInfoInput}>{contactEmail}</Text>

                    <TouchableOpacity style={styles.editContactButtonChatup} onPress={handleStartChat}>
                        <Text style={styles.editContactButtonChatup}>Conversar</Text>
                    </TouchableOpacity>



                    <TouchableOpacity style={styles.editContactButtonChatup} onPress={changeKey}>
                        <Text style={styles.editContactButtonChatup}>Teste Trocar Chave</Text>
                    </TouchableOpacity>



                    
                </View>
            </View>

            <View style={styles.editContactButtonContainer}>
                <TouchableOpacity style={styles.editContactButton} onPress={handleUpdateContact}>
                    <Text style={styles.editContactButtonSaveTittle}>Salvar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.editContactButton} onPress={handleDeleteContact}>
                    <Text style={styles.editContactButtonTittle}>Excluir</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default EditContact;
