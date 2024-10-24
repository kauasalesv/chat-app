import React, { useEffect, useState } from 'react';
import { View, Image, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../../../config/firebase'; 
import styles from "./AddEditContactsStyles";

const AddEditContacts = () => {
    const navigation = useNavigation();

    // Estados para armazenar os contatos, o termo de pesquisa, o carregamento e os contatos selecionados
    const [contacts, setContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedContacts, setSelectedContacts] = useState([]);

    const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const filteredContacts = contacts.filter(contact => 
        removeAccents(contact.name.toLowerCase()).includes(removeAccents(searchTerm.toLowerCase()))
    );

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

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchContacts();
        });

        return unsubscribe;
    }, [navigation]);

    const toggleContactSelection = (contactId) => {
        setSelectedContacts(prevSelectedContacts => {
            if (prevSelectedContacts.includes(contactId)) {
                // Se o contato já está selecionado, removê-lo
                return prevSelectedContacts.filter(id => id !== contactId);
            } else {
                // Caso contrário, adicionar o contato aos selecionados
                return [...prevSelectedContacts, contactId];
            }
        });
    };

    return (
        <View style={styles.addEditContactsContainer}>
            <View style={styles.addEditContactsHead}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Image 
                        source={require('../../../assets/returnImage.png')}
                        style={styles.addEditContactsHeadReturnImage} 
                    />
                </TouchableOpacity>

                <View style={styles.addEditContactsSearchContainer}>
                    <Image 
                        source={require('../../../assets/searchImage.png')}
                        style={styles.addEditContactsSearchImage} 
                    />

                    <TextInput
                        style={styles.addEditContactsSearchInput}
                        placeholder="Pesquisar..."
                        placeholderTextColor="#ffff"
                        onChangeText={text => setSearchTerm(text)}
                    />
                </View>
            </View>

            <View style={styles.addEditContactsContactsContainer}>
                <TouchableOpacity 
                    style={styles.addEditContactsContactsAddButton} 
                    onPress={() => navigation.navigate('CreateContact')}
                >
                    <Text style={styles.addEditContactsContactsAddButtonText}>Novo Contato</Text> 
                </TouchableOpacity>

                {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <ScrollView>
                        {filteredContacts.length > 0 ? (
                            filteredContacts.map(contact => (
                                <TouchableOpacity
                                    key={contact.id} // Certifique-se de que contact.id é realmente único
                                    onPress={() => toggleContactSelection(contact.id)} // Alterna a seleção
                                    style={[
                                        styles.addEditContactsContactsContact,
                                        selectedContacts.includes(contact.id) && { backgroundColor: 'rgba(89, 107, 178, 0.41)' } // Cor de fundo se selecionado
                                    ]}
                                >
                                    <Image 
                                        source={require('../../../assets/userImage.png')}
                                        style={styles.addEditContactsContactsUserImage} 
                                    />
                                    <Text style={styles.addEditContactsContactsName}>{contact.name}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.addEditContactsNoResultsText}>Nenhum contato encontrado</Text>
                        )}
                    </ScrollView>
                )}
            </View>

            <View style={styles.addEditContactsButtonContainer}>
                <TouchableOpacity style={styles.addEditContactsSaveButton}>
                    <Text style={styles.addEditContactsButtonTittle}>Adicionar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default AddEditContacts;
