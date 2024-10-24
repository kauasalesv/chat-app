import React, { useEffect, useState } from 'react';
import { View, Image, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../../../config/firebase'; 
import styles from "./AddContactsStyles";

const AddContacts = () => {
    const navigation = useNavigation();

    // Estados para armazenar os contatos, o termo de pesquisa, o carregamento e os contatos selecionados
    const [contacts, setContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedContacts, setSelectedContacts] = useState([]);

    // Função para remover acentos
    const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    // Filtrando contatos com base no termo de pesquisa
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
        <View style={styles.addContactsContainer}>
            <View style={styles.addContactsHead}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Image 
                        source={require('../../../assets/returnImage.png')}
                        style={styles.addContactsHeadReturnImage} 
                    />
                </TouchableOpacity>

                <View style={styles.addContactsSearchContainer}>
                    <Image 
                        source={require('../../../assets/searchImage.png')}
                        style={styles.addContactsSearchImage} 
                    />

                    <TextInput
                        style={styles.addContactsSearchInput}
                        placeholder="Pesquisar..."
                        placeholderTextColor="#ffff"
                        onChangeText={text => setSearchTerm(text)} // Atualiza o termo de pesquisa
                    />
                </View>
            </View>

            <View style={styles.addContactsContactsContainer}>
                <TouchableOpacity 
                    style={styles.addContactsContactsAddButton} 
                    onPress={() => navigation.navigate('CreateContact')} // Navega para CreateContact
                >
                    <Text style={styles.addContactsContactsAddButtonText}>Novo Contato</Text>
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
                                        styles.addContactsContactsContact,
                                        selectedContacts.includes(contact.id) && { backgroundColor: 'rgba(89, 107, 178, 0.41)' } // Cor de fundo se selecionado
                                    ]}
                                >
                                    <Image 
                                        source={require('../../../assets/userImage.png')}
                                        style={styles.addContactsContactsUserImage} 
                                    />
                                    <Text style={styles.addContactsContactsName}>{contact.name}</Text>
                                </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.addEditContactsNoResultsText}>Nenhum contato encontrado</Text>
                    )}
                    </ScrollView>
                )}
            </View>

            <View style={styles.addContactsButtonContainer}>
                <TouchableOpacity style={styles.addContactsSaveButton}>
                    <Text style={styles.addContactsButtonTittle}>Adicionar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default AddContacts;
