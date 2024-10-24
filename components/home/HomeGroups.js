import React from "react";
import { View, Text, Image, ScrollView, ImageBackground, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Importa useNavigation
import styles from './HomeGroupsStyles';

const HomeGroups = ({ searchTerm, userEmail, userId }) => {
    // Criando uma lista de grupos
    const groups = [...Array(1)].map((_, index) => ({
        id: index,
        name: `Grupo ${index + 1}`,
    }));

    // Função para remover acentos
    const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    // Filtrando grupos com base no termo de pesquisa
    const filteredGroups = groups.filter(group => 
        removeAccents(group.name.toLowerCase()).includes(removeAccents(searchTerm.toLowerCase()))
    );

    const navigation = useNavigation(); // Inicializa o hook de navegação

    const handleGroupPress = () => {
        navigation.navigate('Chat', { typeChat: 'group' }); // Passa o tipo de chat
    };

    return (
        <ScrollView style={styles.homeGroupsContainer}>
            {filteredGroups.map(group => (
                <TouchableOpacity key={group.id} onPress={() => handleGroupPress(group)}>
                    <View style={styles.homeGroupsChats}>
                        <Image 
                            source={require('../../assets/userImage.png')}
                            style={styles.homeGroupsUserImage} 
                        />
                        <Text style={styles.homeGroupsName}>{group.name}</Text>
                        <Image 
                            source={require('../../assets/onlineImage.png')}
                            style={styles.homeGroupsOnlineImage} 
                        />
                        <ImageBackground 
                            source={require('../../assets/notificationImage.png')}
                            style={styles.homeGroupsNotificationContainer} 
                            resizeMode='contain' // Ajusta como a imagem se encaixa
                        >
                            <Text style={styles.homeGroupsNotificationText}>111</Text>
                        </ImageBackground>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

export default HomeGroups;
