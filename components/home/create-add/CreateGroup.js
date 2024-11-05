import React, { useState, useEffect } from 'react';
import { View, Image, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native'; 
import { doc, setDoc, arrayUnion, collection, query, where, getDoc, getDocs } from 'firebase/firestore'; 
import { auth, db } from '../../../config/firebase'; 
import { Buffer } from 'buffer';
import { TextDecoder } from 'text-encoding';
import Rsa from 'react-native-rsa-native';
import * as Keychain from 'react-native-keychain';
import styles from "./CreateGroupStyles";

const IDEA = require("idea-cipher");

const CreateGroup = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { selectedContacts = [] } = route.params || {}; // Define um valor padrão como um array vazio

    // Cria o estado groupParticipants e inicializa com selectedContacts
    const [groupParticipants, setGroupParticipants] = useState(selectedContacts);
    const [groupName, setGroupName] = useState(''); // Estado para armazenar o nome do grupo

    // Use useEffect para atualizar o estado caso selectedContacts mude
    useEffect(() => {
        setGroupParticipants(selectedContacts);
    }, [selectedContacts]);

    // Função para remover um participante
    const removeParticipant = (email) => {
        setGroupParticipants(prevParticipants => 
            prevParticipants.filter(contact => contact.email !== email)
        );
    };

    const createGroup = async () => {
        if (groupParticipants.length === 0) {
            Alert.alert("Atenção", "Adicione pelo menos um participante ao grupo.");
            return;
        }
        if (groupName.trim() === '') {
            Alert.alert("Atenção", "O nome do grupo não pode estar vazio.");
            return;
        }

        try {
            const groupId = doc(collection(db, 'groups')).id; 
            const key = toBase64(gerarChaveIDEA());

            const myPublicKey = await getMyPublicKey();
            const myKey =  await criptografarRSA(key, myPublicKey);

            const members = [
                { email: auth.currentUser.email, key: myKey } 
            ];

            // Para cada participante, buscar a chave pública e criptografar a chave IDEA
            for (let contact of groupParticipants) {
                const publicKey = await getContactPublicKey(contact.email);
                if (publicKey) {
                    const chaveCriptografada = await criptografarRSA(key, publicKey);
                    members.push({ email: contact.email, key: chaveCriptografada });
                } else {
                    console.log(`Chave pública não encontrada para ${contact.email}`);
                }
            }

            const groupData = {
                name: groupName,
                createdBy: auth.currentUser.email,
                members,
                messages: []
            };

            await setDoc(doc(db, 'groups', groupId), groupData);

            Alert.alert("Sucesso", "Grupo criado com sucesso!");
            console.log("Chave IDEA do grupo: ");
            console.log(key);
            navigation.goBack();
        } catch (error) {
            console.error("Atenção ao criar o grupo: ", error);
            Alert.alert("Atenção", "Ocorreu um erro ao criar o grupo.");
        }
    };

    function gerarChaveIDEA() {
        return Buffer.from(Array.from({ length: 16 }, () => Math.floor(Math.random() * 256)));
    }

    function toBase64(data) {
        return Buffer.from(data).toString('base64');
    }

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

    const criptografarRSA = async (message, publicKey) => {
        try {
            const encrypted = await Rsa.encrypt(message, publicKey);
            return encrypted;
        } catch (error) {
            console.error('Erro ao criptografar a mensagem:', error);
        }
    };

    return (
        <View style={styles.createGroupContainer}>
            <View style={styles.createGroupReturn}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Image 
                        source={require('../../../assets/returnImage.png')}
                        style={styles.createGroupReturnImage} 
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.createGroupHead}>
                <Image 
                    source={require('../../../assets/userImage.png')}
                    style={styles.createGroupHeadUserImage} 
                />
                <TextInput 
                    style={styles.createGroupHeadTittle} 
                    placeholder='Nome do grupo...' 
                    placeholderTextColor={'white'}
                    value={groupName} // Atribui o valor do estado groupName
                    onChangeText={setGroupName} // Atualiza o estado ao digitar
                />
            </View>

            <View style={styles.createGroupContactsContainer}>
                <View style={styles.createGroupContacts}>
                    <TouchableOpacity onPress={() => navigation.navigate('AddContacts', {groupParticipants})}>
                        <Text style={styles.createGroupContactsAddButton}>Adicionar participantes</Text>
                    </TouchableOpacity>

                    <ScrollView>
                        {groupParticipants.map(contact => (
                            <View key={contact.email} style={styles.createGroupContactsContact}>
                                <Image 
                                    source={require('../../../assets/userImage.png')}
                                    style={styles.createGroupContactsUserImage} 
                                />
                                <Text style={styles.createGroupContactsName}>{contact.name}</Text>
                                <TouchableOpacity style={styles.createGroupContactsRemoveButton} onPress={() => removeParticipant(contact.email)}>
                                    <Text style={styles.createGroupContactsRemoveButton}>Remover</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>

            <View style={styles.createGroupButtonContainer}>
                <TouchableOpacity style={styles.createGroupSaveButton} onPress={createGroup}>
                    <Text style={styles.createGroupButtonTittle}>Salvar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default CreateGroup;
