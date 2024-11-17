import React, { useState, useEffect } from 'react';
import { View, Image, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 
import { auth, db } from '../../../config/firebase'; 
import { doc, updateDoc, arrayRemove, getDoc, collection, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { Buffer } from 'buffer';
import Rsa from 'react-native-rsa-native';
import * as Keychain from 'react-native-keychain';

import styles from "./EditGroupStyles";

const IDEA = require("idea-cipher");

const EditGroup = ({ route }) => {
    const { groupName, groupId, groupCreator, contacts, members, selectedContacts } = route.params;
    const [groupMembers, setGroupMembers] = useState(members); // Estado local para membros
    const navigation = useNavigation(); 
    const user = auth.currentUser;

    if(selectedContacts) {
        console.log(selectedContacts);
    }

    const addUpdateMembers = async (key) => {
        // Para cada participante, buscar a chave pública e criptografar a chave IDEA
        for (let contact of selectedContacts) {
            const publicKey = await getContactPublicKey(contact);
            if (publicKey) {
                const chaveCriptografada = await criptografarRSA(key, publicKey);
                groupMembers.push({ email: contact, key: chaveCriptografada });
                //membersToConsole.push({email: contact, ideaCriptografada: chaveCriptografada, publicKey: publicKey})
            } else {
                console.log(`Chave pública não encontrada para ${contact.email}`);
            }
        }
    }

    const handleAddParticipants = () => {
        navigation.navigate('AddEditContacts', {
            groupName: groupName,
            groupId: groupId, 
            groupCreator: groupCreator,
            contacts: contacts,
            members: groupMembers // Passando o estado atualizado
        });
    };

    const handleRemoveMember = async (chooseMember) => {
        Alert.alert(
            "Atenção",
            "Você realmente deseja remover esse participante? Esta ação não pode ser desfeita e o participante perderá a conversa.",
            [
                {
                    text: "Cancelar",
                    onPress: () => console.log("Exclusão cancelada"),
                    style: "cancel", 
                },
                {
                    text: "Excluir",
                    onPress: async () => {
                        try {
                            const groupRef = doc(db, 'groups', groupId);
                            const groupSnap = await getDoc(groupRef);

                            if (groupSnap.exists()) {
                                const groupData = groupSnap.data();

                                // REMOÇÃO DO MEMBRO
                                var members = groupData.members || [];

                                const memberToRemove = members.find(member => member.email === chooseMember.email);

                                if (memberToRemove) {
                                    await updateDoc(groupRef, {
                                        members: arrayRemove(memberToRemove)
                                    });

                                    // Atualiza o estado local para remover o membro da lista
                                    setGroupMembers(prevMembers => prevMembers.filter(member => member.email !== chooseMember.email));
                                    members = members.filter(member => member.email !== memberToRemove.email);

                                    Alert.alert("Sucesso", "O membro foi removido com sucesso!");
                                }

                                // TROCA CHAVE IDEA
                                const messages = groupData.messages || [];
                                const ideaMember = members.find(member => member.email === user.email);
                                const oldEncryptedIdea = ideaMember.key;
                                const publicKey = await getMyPublicKey();
                                const privateKey = await getPrivateKey();
                                const oldDecryptedIdea = await descriptografarRSA(oldEncryptedIdea, privateKey);

                                const newIdea = gerarChaveIDEA();
                                const newKeyMembers = []

                                if (messages) {
                                    messages.forEach(message => {
                                        if (message.content) {
                                            const decryptedMessage = descriptografarIDEA(fromBase64(message.content), fromBase64(oldDecryptedIdea), privateKey, oldEncryptedIdea, message.sender);
                                            const encryptedMessage = criptografarIDEA(decryptedMessage, newIdea);
                                            message.content = toBase64(encryptedMessage);
                                        }
                                    });

                                    await Promise.all(
                                        members.map(async (member) => {
                                            const publicKey = await getContactPublicKey(member.email);
                                            const encryptedIdea = await criptografarRSA(toBase64(newIdea), publicKey);
                                            member.key = encryptedIdea;
                                        })
                                    );
                                    

                                    await updateDoc(groupRef, {
                                        messages: messages,
                                        members: members
                                    });
                                }

                            }

                        } catch (error) {
                            console.error("Erro ao remover o membro:", error);
                            Alert.alert("Erro", "Ocorreu um erro ao remover o participante.");
                        }
                    },
                    style: "destructive", 
                },
            ]
        );
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

    return (
        <View style={styles.editGroupContainer}>
            <View style={styles.editGroupReturn}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Image 
                        source={require('../../../assets/returnImage.png')}
                        style={styles.editGroupReturnImage} 
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.editGroupHead}>
                <Image 
                    source={require('../../../assets/userImage.png')}
                    style={styles.editGroupHeadUserImage} 
                />
                <Text style={styles.editGroupHeadTittle}>{groupName}</Text>
            </View>

            <View style={styles.editGroupContactsContainer}>
                <View style={styles.editGroupContacts}>
                    {user.email === groupCreator && ( 
                        <TouchableOpacity onPress={handleAddParticipants}>
                            <Text style={styles.editGroupContactsAddButton}>Adicionar participantes</Text>
                        </TouchableOpacity>
                    )}
                    <ScrollView>
                    {groupMembers.map((member, index) => (
                        <View key={index} style={styles.editGroupContactsContact}>
                            <Image 
                                source={require('../../../assets/userImage.png')}
                                style={styles.editGroupContactsUserImage} 
                            />
                            <Text style={styles.editGroupContactsName}>{member.name}</Text>
                            {user.email === groupCreator && member.email !== user.email && ( 
                                <TouchableOpacity onPress={() => handleRemoveMember(member)}>
                                    <Text style={styles.editGroupContactsRemoveButton}>Remover</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    </ScrollView>
                </View>
            </View>

            <View style={styles.editGroupButtonContainer}>
                <View style={styles.editGroupSaveButton}>
                    <Text style={styles.editGroupButtonTittle}>Excluir/Sair</Text>
                </View>
            </View>

        </View>
    );
};

export default EditGroup;
