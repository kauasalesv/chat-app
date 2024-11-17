import React, { useEffect, useState } from 'react';
import { View, Image, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../../../config/firebase'; 
import styles from "./AddEditContactsStyles";

const AddEditContacts = ({ route }) => {
    const navigation = useNavigation();
    const { groupName, groupId, groupCreator, contacts, members } = route.params;
    const [notInGroupContacts, setNotInGroupContacts] = useState([]);

    // Estados para armazenar os contatos, o termo de pesquisa, o carregamento e os contatos selecionados
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContacts, setSelectedContacts] = useState([]);

    useEffect(() => {
        // Filtrar contatos que não estão no grupo
        const filteredContacts = contacts.filter(contact => {
            // Verifica se o email do contato não está nos members
            return !members.some(member => member.email === contact.email);
        });

        setNotInGroupContacts(filteredContacts);
    }, [contacts, members]); // Atualiza se contacts ou members mudarem

    const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const filteredContacts = notInGroupContacts.filter(contact => 
        removeAccents(contact.name.toLowerCase()).includes(removeAccents(searchTerm.toLowerCase()))
    );

    const toggleContactSelection = (contactId) => {
        setSelectedContacts((prevSelectedContacts) => {
            if (prevSelectedContacts.includes(contactId)) {
                // Se o contato já está selecionado, removê-lo
                return prevSelectedContacts.filter((id) => id !== contactId);
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

                <ScrollView>
                {filteredContacts.length > 0 ? (
                    filteredContacts.map((contact) => (
                        <TouchableOpacity
                            key={contact.id || contact.email} // Use o campo mais confiável e único
                            onPress={() => toggleContactSelection(contact.id || contact.email)} // Altere conforme necessário
                            style={[
                                styles.addEditContactsContactsContact,
                                selectedContacts.includes(contact.id || contact.email) && { backgroundColor: 'rgba(89, 107, 178, 0.41)' } // Cor se selecionado
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
            </View>

            <View style={styles.addEditContactsButtonContainer}>
                <TouchableOpacity 
                    style={styles.addEditContactsSaveButton}
                    onPress={() => navigation.navigate('EditGroup', { groupName, groupId, groupCreator, contacts, members, selectedContacts })} 
                >
                    <Text style={styles.addEditContactsButtonTittle}>Adicionar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default AddEditContacts;
