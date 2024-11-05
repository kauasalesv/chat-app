import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, ImageBackground, TouchableOpacity, ActivityIndicator, onSnapshot } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; 
import { doc, getDoc, setDoc, updateDoc, arrayUnion, getDocs, collection } from 'firebase/firestore';
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
            const chatDocId = `${contact.email}:${userEmail}`; 
            const chatRef = doc(db, 'chats', chatDocId);
            const chatSnap = await getDoc(chatRef);

            if (chatSnap.exists()) {
                const chatData = chatSnap.data();
                const pendingCount = chatData.messages.filter(msg => msg.status === 'pending').length; 
                return { ...contact, pendingCount }; 
            } else {
                return { ...contact, pendingCount: 0 }; 
            }
        }));

        setContacts(updatedContacts); 
    };

    const updateContactsFromChats = async () => {
        try {
            const userEmail = auth.currentUser.email;
            const userId = auth.currentUser.uid;
            const userRef = doc(db, 'users', userId);
            const contactsCollection = collection(db, 'chats');

            const chatDocs = await getDocs(contactsCollection);
            const userSnapshot = await getDoc(userRef);
            const existingContacts = userSnapshot.exists() ? userSnapshot.data().contacts : [];
            const newContacts = [];

            for (let chatDoc of chatDocs.docs) {
                const [email1, email2] = chatDoc.id.split(':');
                if (email1 === userEmail || email2 === userEmail) {
                    const contactEmail = email1 === userEmail ? email2 : email1;
                    if (!existingContacts.some(contact => contact.email === contactEmail)) {
                        newContacts.push({ email: contactEmail, name: contactEmail});
                    }
                }
            }
    
            if (newContacts.length > 0) {
                await updateDoc(userRef, {
                    contacts: arrayUnion(...newContacts)
                });
                //console.log('Novos contatos adicionados:', newContacts);
            }
        } catch (error) {
            console.error('Erro ao atualizar contatos a partir dos chats:', error);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            setLoading(true); // Define loading como true ao focar no componente
            fetchContacts();
            updateContactsFromChats();
        }, [])
    );

    useEffect(() => {
        if (!loading) {
            loadMyMessages();
        }
    }, [contacts, loading]);

    const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const filteredContacts = contacts
        .filter(contact => {
            if (contact.name && searchTerm) {
                return removeAccents(contact.name.toLowerCase()).includes(removeAccents(searchTerm.toLowerCase()));
            }
            return true;
        })
        .sort((a, b) => b.pendingCount - a.pendingCount);

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
                                    {contact.pendingCount > 0 && (
                                        <ImageBackground 
                                            source={require('../../assets/notificationImage.png')}
                                            style={styles.homeChatsNotificationContainer} 
                                            resizeMode='contain'
                                        >
                                            <Text style={styles.homeChatsNotificationText}>{contact.pendingCount}</Text>
                                        </ImageBackground>
                                    )}
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
