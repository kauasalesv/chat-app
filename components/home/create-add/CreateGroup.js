import React from 'react';
import { View, Image, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Importa useNavigation
import styles from "./CreateGroupStyles";

const CreateGroup = () => {
    const navigation = useNavigation(); // Inicializa o hook de navegação

    // Criando uma lista de contatos
    const contacts = [...Array(20)].map((_, index) => ({
        id: index,
        name: `Contato ${index + 1}`,
    }));

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
                <Text style={styles.createGroupHeadTittle}>Grupo</Text>
            </View>

            <View style={styles.createGroupContactsContainer}>
                <View style={styles.createGroupContacts}>
                    <TouchableOpacity onPress={() => navigation.navigate('AddContacts')}>
                        <Text style={styles.createGroupContactsAddButton}>Adicionar participantes</Text>
                    </TouchableOpacity>

                    {/* Envolvendo a lista de contatos com ScrollView */}
                    <ScrollView>
                        {contacts.map(contact => (
                            <View key={contact.id} style={styles.createGroupContactsContact}>
                                <Image 
                                    source={require('../../../assets/userImage.png')}
                                    style={styles.createGroupContactsUserImage} 
                                />
                                <Text style={styles.createGroupContactsName}>{contact.name}</Text>
                                <Text style={styles.createGroupContactsRemoveButton}>Remover</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>

            <View style={styles.createGroupButtonContainer}>
                <View style={styles.createGroupSaveButton}>
                    <Text style={styles.createGroupButtonTittle}>Salvar</Text>
                </View>
            </View>
        </View>
    );
};

export default CreateGroup;
