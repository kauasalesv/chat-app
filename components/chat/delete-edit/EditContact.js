import React, { useState } from 'react';
import { View, ScrollView, Image, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, updateDoc, arrayRemove, arrayUnion, getDoc, deleteDoc  } from 'firebase/firestore'; 
import { auth, db } from '../../../config/firebase'; 
import styles from "./EditContactStyles";

const EditContact = ({ route }) => {
    const navigation = useNavigation();
    const { contactName, contactEmail } = route.params;

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
