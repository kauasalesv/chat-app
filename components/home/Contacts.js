import React, { useState, useEffect } from 'react';
import { View, Image, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../../config/firebase'; 
import styles from "./ContactsStyles";

const Contacts = () => {
    const navigation = useNavigation();

    // Estados para armazenar o termo de pesquisa e os contatos
    const [searchTerm, setSearchTerm] = useState('');
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const filteredContacts = contacts.filter(contact => 
        removeAccents(contact.name.toLowerCase()).includes(removeAccents(searchTerm.toLowerCase()))
    );

    const fetchContacts = async () => {
        try {
            const userId = auth.currentUser.uid; // Obtém o ID do usuário autenticado
            const userRef = doc(db, 'users', userId); // Referência ao documento do usuário
            const userSnap = await getDoc(userRef); // Busca os dados do usuário

            if (userSnap.exists()) {
                const userData = userSnap.data();
                setContacts(userData.contacts || []); // Define os contatos (ou array vazio se não houver contatos)
            } else {
                console.log("Documento do usuário não encontrado");
            }
        } catch (error) {
            console.error("Erro ao buscar contatos:", error);
        } finally {
            setLoading(false); // Para de exibir o indicador de carregamento
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchContacts(); // Recarrega os contatos quando a tela é focada
        });

        // Cleanup the listener on unmount
        return unsubscribe;
    }, [navigation]);

    return (
        <View style={styles.contactsContainer}>
            <View style={styles.contactsHead}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Image 
                        source={require('../../assets/returnImage.png')}
                        style={styles.contactsHeadReturnImage} 
                    />
                </TouchableOpacity>

                <View style={styles.contactsSearchContainer}>
                    <Image 
                        source={require('../../assets/searchImage.png')}
                        style={styles.contactsSearchImage} 
                    />
                    <TextInput
                        style={styles.contactsSearchInput}
                        placeholder="Pesquisar..."
                        placeholderTextColor="#ffff"
                        onChangeText={(text) => setSearchTerm(text)} // Atualiza o termo de pesquisa
                    />
                </View>
            </View>

            <View style={styles.contactsContactsContainer}>
                <TouchableOpacity 
                    style={styles.contactsContactsAddButton} 
                    onPress={() => navigation.navigate('CreateContact')} // Navega para CreateContact
                >
                    <Text style={styles.contactsContactsAddButtonText}>Novo Contato</Text>
                </TouchableOpacity>

                {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <ScrollView>
                        {filteredContacts.length > 0 ? (
                            filteredContacts.map((contact, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.contactsContactsContact}
                                    onPress={() => navigation.navigate('EditContact', {
                                        contactName: contact.name,
                                        contactEmail: contact.email
                                    })} // Navega para EditContact com os dados do contato
                                >
                                    <Image 
                                        source={require('../../assets/userImage.png')}
                                        style={styles.contactsContactsUserImage} 
                                    />
                                    <Text style={styles.contactsContactsName}>{contact.name}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.contactsNoResultsText}>Nenhum contato encontrado</Text>
                        )}
                    </ScrollView>
                )}
            </View>
        </View>
    );
};

export default Contacts;
