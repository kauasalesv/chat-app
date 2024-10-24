import React from 'react';
import { View, Image, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Importa useNavigation
import styles from "./EditGroupStyles";

const EditGroup = () => {
    // Criando uma lista de contatos
    const contacts = [...Array(20)].map((_, index) => ({
        id: index,
        name: `Contato ${index + 1}`,
    }));

    const navigation = useNavigation(); // Inicializa o hook de navegação

    // Função para navegar para a tela AddEditContacts
    const handleAddParticipants = () => {
        navigation.navigate('AddEditContacts'); // Navega para AddEditContacts
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
                <Text style={styles.editGroupHeadTittle}>Grupo</Text>
            </View>

            <View style={styles.editGroupContactsContainer}>
                <View style={styles.editGroupContacts}>
                    <TouchableOpacity onPress={handleAddParticipants}>
                        <Text style={styles.editGroupContactsAddButton}>Adicionar participantes</Text>
                    </TouchableOpacity>

                    {/* Envolvendo a lista de contatos com ScrollView */}
                    <ScrollView>
                        {contacts.map(contact => (
                            <View key={contact.id} style={styles.editGroupContactsContact}>
                                <Image 
                                    source={require('../../../assets/userImage.png')}
                                    style={styles.editGroupContactsUserImage} 
                                />
                                <Text style={styles.editGroupContactsName}>{contact.name}</Text>
                                <Text style={styles.editGroupContactsRemoveButton}>Remover</Text>
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
