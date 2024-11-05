import React, { useState } from "react";
import { View, Text, Image, ScrollView, ImageBackground, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; 
import { collection, getDocs } from 'firebase/firestore'; 
import { auth, db } from '../../config/firebase'; 
import styles from './HomeGroupsStyles';

const HomeGroups = ({ searchTerm }) => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation(); // Inicializa o hook de navegação

    const fetchGroups = async () => {
        setLoading(true); // Define loading como true ao começar a busca
        try {
            const userEmail = auth.currentUser.email; // Pega o email do usuário autenticado
            const groupsCollection = collection(db, 'groups');
            const querySnapshot = await getDocs(groupsCollection);
            const userGroups = [];

            querySnapshot.forEach((doc) => {
                const groupData = doc.data();
                // Verifica se o email do usuário está nos membros do grupo
                if (groupData.members.some(member => member.email === userEmail)) {
                    userGroups.push({ id: doc.id, ...groupData }); // Adiciona o grupo ao array
                }
            });

            setGroups(userGroups); // Atualiza o estado com os grupos do usuário
        } catch (error) {
            console.error("Erro ao buscar grupos:", error);
        } finally {
            setLoading(false); // Define loading como false ao terminar a busca
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchGroups(); // Chama a função ao focar no componente
        }, [])
    );

    const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    // Filtrando grupos com base no termo de pesquisa
    const filteredGroups = groups.filter(group => 
        removeAccents(group.name.toLowerCase()).includes(removeAccents(searchTerm.toLowerCase()))
    );

    const handleGroupPress = (group) => {
        navigation.navigate('ChatGroup', { typeChat: 'group', groupId: group.id, groupName: group.name, groupKey: group.key }); // Passa o tipo de chat e ID do grupo
    };

    return (
        <ScrollView style={styles.homeGroupsContainer}>
            {loading ? (
                <ActivityIndicator size="large" color="white" />
            ) : (
                filteredGroups.map(group => (
                    <TouchableOpacity key={group.id} onPress={() => handleGroupPress(group)}>
                        <View style={styles.homeGroupsChats}>
                            <Image 
                                source={require('../../assets/userImage.png')}
                                style={styles.homeGroupsUserImage} 
                            />
                            <Text style={styles.homeGroupsName}>{group.name}</Text>
                            {/*<Image 
                                source={require('../../assets/onlineImage.png')}
                                style={styles.homeGroupsOnlineImage} 
                            />*/}
                            {/*
                            <ImageBackground 
                                source={require('../../assets/notificationImage.png')}
                                style={styles.homeGroupsNotificationContainer} 
                                resizeMode='contain'
                            >
                                <Text style={styles.homeGroupsNotificationText}>111</Text>
                            </ImageBackground>
                            */}
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </ScrollView>
    );
};

export default HomeGroups;
