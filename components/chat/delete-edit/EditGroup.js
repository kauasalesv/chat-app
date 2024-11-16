import React, { useState, useEffect } from 'react';
import { View, Image, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 
import { auth, db } from '../../../config/firebase'; 
import { doc, updateDoc, arrayRemove, getDoc } from 'firebase/firestore'; 
import styles from "./EditGroupStyles";

const EditGroup = ({ route }) => {
    const { groupName, groupId, groupCreator, contacts, members } = route.params;
    
    const [groupMembers, setGroupMembers] = useState(members); // Estado local para membros
    const navigation = useNavigation(); 
    const user = auth.currentUser;

    const handleAddParticipants = () => {
        navigation.navigate('AddEditContacts', {
            contacts: contacts,
            members: groupMembers // Passando o estado atualizado
        });
    };

    const handleRemoveMember = async (chooseMember) => {
        Alert.alert(
            "Atenção",
            "Você realmente deseja remover esse participante? Esta ação não pode ser desfeita e o participante perderá a conversa.",
            [
                {
                    text: "Cancelar",
                    onPress: () => console.log("Exclusão cancelada"),
                    style: "cancel", 
                },
                {
                    text: "Excluir",
                    onPress: async () => {
                        try {
                            const groupRef = doc(db, 'groups', groupId);
                            const groupSnap = await getDoc(groupRef);

                            if (groupSnap.exists()) {
                                const groupData = groupSnap.data();
                                const members = groupData.members || [];

                                const memberToRemove = members.find(member => member.email === chooseMember.email);

                                if (memberToRemove) {
                                    await updateDoc(groupRef, {
                                        members: arrayRemove(memberToRemove)
                                    });

                                    // Atualiza o estado local para remover o membro da lista
                                    setGroupMembers(prevMembers => prevMembers.filter(member => member.email !== chooseMember.email));

                                    Alert.alert("Sucesso", "O membro foi removido com sucesso!");
                                }
                            }

                        } catch (error) {
                            console.error("Erro ao remover o membro:", error);
                            Alert.alert("Erro", "Ocorreu um erro ao remover o participante.");
                        }
                    },
                    style: "destructive", 
                },
            ]
        );
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
                <Text style={styles.editGroupHeadTittle}>{groupName}</Text>
            </View>

            <View style={styles.editGroupContactsContainer}>
                <View style={styles.editGroupContacts}>
                    {user.email === groupCreator && ( 
                        <TouchableOpacity onPress={handleAddParticipants}>
                            <Text style={styles.editGroupContactsAddButton}>Adicionar participantes</Text>
                        </TouchableOpacity>
                    )}
                    <ScrollView>
                    {groupMembers.map((member, index) => (
                        <View key={index} style={styles.editGroupContactsContact}>
                            <Image 
                                source={require('../../../assets/userImage.png')}
                                style={styles.editGroupContactsUserImage} 
                            />
                            <Text style={styles.editGroupContactsName}>{member.name}</Text>
                            {user.email === groupCreator && member.email !== user.email && ( 
                                <TouchableOpacity onPress={() => handleRemoveMember(member)}>
                                    <Text style={styles.editGroupContactsRemoveButton}>Remover</Text>
                                </TouchableOpacity>
                            )}
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
