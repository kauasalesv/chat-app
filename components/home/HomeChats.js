import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, ImageBackground, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../../config/firebase'; 
import styles from './HomeChatsStyles';

const HomeChats = ({ searchTerm }) => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    const fetchContacts = async () => {
        try {
            const userId = auth.currentUser.uid; 
            const userRef = doc(db, 'users', userId); 
            const userSnap = await getDoc(userRef); 

            if (userSnap.exists()) {
                const userData = userSnap.data();
                setContacts(userData.contacts || []); 
            } else {
                console.log("Documento do usuário não encontrado");
            }
        } catch (error) {
            console.error("Erro ao buscar contatos:", error);
        } finally {
            setLoading(false); 
        }
    };

    const loadMyMessages = async () => {
        const userEmail = auth.currentUser.email;

        const updatedContacts = await Promise.all(contacts.map(async (contact) => {
            const chatDocId = `${contact.email}:${userEmail}`; // Usando o email do contato
            const chatRef = doc(db, 'chats', chatDocId);
            const chatSnap = await getDoc(chatRef);

            if (chatSnap.exists()) {
                const chatData = chatSnap.data();
                const pendingCount = chatData.messages.filter(msg => msg.status === 'pending').length; // Conta mensagens pendentes
                return { ...contact, pendingCount }; // Adiciona a contagem ao contato
            } else {
                //console.log(`Nenhuma mensagem encontrada para o contato ${contact.name}.`);
                return { ...contact, pendingCount: 0 }; // Se não houver mensagens, contagem é 0
            }
        }));

        setContacts(updatedContacts); // Atualiza o estado com os contatos e suas contagens de mensagens pendentes
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    useEffect(() => {
        if (!loading) {
            loadMyMessages(); // Carrega mensagens após os contatos serem carregados
        }
    }, [contacts, loading]); // Recarrega mensagens sempre que os contatos mudarem

    const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const filteredContacts = contacts.filter(contact => 
        removeAccents(contact.name.toLowerCase()).includes(removeAccents(searchTerm.toLowerCase()))
    );

    const handleContactPress = (contact) => {
        navigation.navigate('Chat', { typeChat: 'chat', contactName: contact.name, contactEmail: contact.email });
    };

    return (
        <View style={styles.homeChatsContainer}>
            {loading ? (
                <ActivityIndicator size="large" color="white" />
            ) : (
                <ScrollView>
                    {filteredContacts.map(contact => (
                        <TouchableOpacity key={contact.email} onPress={() => handleContactPress(contact)}>
                            <View style={styles.homeChatsChats}>
                                <Image 
                                    source={require('../../assets/userImage.png')}
                                    style={styles.homeChatsUserImage} 
                                />
                                <Text style={styles.homeChatsName}>{contact.name}</Text>

                                <View style={styles.homeChatsNotificationOnlineContainer}> 
                                    {contact.pendingCount > 0 && ( // Exibe apenas se a contagem for maior que 0
                                        <ImageBackground 
                                            source={require('../../assets/notificationImage.png')}
                                            style={styles.homeChatsNotificationContainer} 
                                            resizeMode='contain'
                                        >
                                            <Text style={styles.homeChatsNotificationText}>{contact.pendingCount}</Text>
                                        </ImageBackground>
                                    )}
                                    {/*
                                    <Image 
                                        source={require('../../assets/onlineImage.png')}
                                        style={styles.homeChatsOnlineImage} 
                                    />
                                    */}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}

                </ScrollView>
            )}
        </View>
    );
};

export default HomeChats;
