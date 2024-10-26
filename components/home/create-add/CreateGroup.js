import React, { useState, useEffect } from 'react';
import { View, Image, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native'; 
import styles from "./CreateGroupStyles";

const CreateGroup = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { selectedContacts = [] } = route.params || {}; // Define um valor padrão como um array vazio

    // Cria o estado groupParticipants e inicializa com selectedContacts
    const [groupParticipants, setGroupParticipants] = useState(selectedContacts);

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
                <TextInput style={styles.createGroupHeadTittle} placeholder='Nome do grupo...' placeholderTextColor={'white'}/>
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
                <View style={styles.createGroupSaveButton}>
                    <Text style={styles.createGroupButtonTittle}>Salvar</Text>
                </View>
            </View>
        </View>
    );
};

export default CreateGroup;
