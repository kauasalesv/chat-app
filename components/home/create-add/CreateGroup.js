import React, { useState, useEffect } from 'react';
import { View, Image, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native'; 
import { doc, setDoc, arrayUnion, collection } from 'firebase/firestore'; 
import { auth, db } from '../../../config/firebase'; 
import { Buffer } from 'buffer';
import { TextDecoder } from 'text-encoding';
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

    // Função para criar o grupo
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
            const groupId = doc(collection(db, 'groups')).id; // Gera um ID único para o grupo
            const key = toBase64(gerarChaveIDEA())
            const groupData = {
                name: groupName,
                createdBy: auth.currentUser.email,
                key: key,
                members: [
                    { email: auth.currentUser.email }, // Adiciona o e-mail do criador
                    ...groupParticipants.map(contact => ({
                        email: contact.email,
                    }))
                ],
                messages: [] // Inicializa o array de mensagens como vazio
            };

            // Adiciona o grupo ao Firestore
            await setDoc(doc(db, 'groups', groupId), groupData);

            Alert.alert("Sucesso", "Grupo criado com sucesso!");
            navigation.goBack(); // Volta para a tela anterior após criar o grupo
        } catch (error) {
            console.error("Atenção ao criar o grupo: ", error);
            Alert.alert("Atenção", "Ocorreu um erro ao criar o grupo.");
        }
    };

    // Função para gerar uma chave IDEA (128 bits, 16 bytes)
    function gerarChaveIDEA() {
        // Em produção, use um gerador de chaves seguro
        return Buffer.from(Array.from({ length: 16 }, () => Math.floor(Math.random() * 256)));
    }

    // Função para converter Uint8Array ou Buffer para base64
    function toBase64(data) {
        return Buffer.from(data).toString('base64');
    }

    // Função para converter base64 de volta para Uint8Array
    function fromBase64(base64String) {
        return new Uint8Array(Buffer.from(base64String, 'base64'));
    }

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
