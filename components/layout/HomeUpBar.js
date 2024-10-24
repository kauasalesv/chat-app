import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Importa useNavigation
import styles from './HomeUpBarStyles';

const HomeUpBar = ({ setSearchTerm, activeButton, userEmail, userId }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const navigation = useNavigation(); // Inicializa o hook de navegação

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleMenuItemPress = () => {
    if (activeButton === 'chats') {
      navigation.navigate('CreateContact'); // Navega para CreateContact
    } else {
      navigation.navigate('CreateGroup'); // Navega para CreateGroup
    }
    setIsMenuVisible(false); // Fecha o menu após a navegação
  };

  const handleContactsPress = () => {
    navigation.navigate('Contacts'); // Navega para a tela Contacts
    setIsMenuVisible(false); // Fecha o menu após a navegação
  };

  const handleUserImagePress = () => {
    navigation.navigate('MyUser'); // Navega para MyUser
  };

  return (
    <View style={styles.homeUpBarContainer}>
      <TouchableOpacity onPress={handleUserImagePress}>
        <Image 
            source={require('../../assets/userImage.png')}
            style={styles.homeUpBarUserImage} 
        />
      </TouchableOpacity>

      <View style={styles.homeUpBarSearchContainer}>
        <Image 
            source={require('../../assets/searchImage.png')}
            style={styles.homeUpBarSearchImage} 
        />

        <TextInput
            style={styles.homeUpBarSearchInput}
            placeholder="Pesquisar..."
            placeholderTextColor="#ffff"
            onChangeText={text => setSearchTerm(text)}  
        />
      </View>

      <TouchableOpacity onPress={toggleMenu}>
        <Image 
            source={require('../../assets/menuImage.png')}
            style={styles.homeUpBarMenuImage} 
        />
      </TouchableOpacity>

      {isMenuVisible && (
        <View style={styles.homeUpBarDropdownMenu}>
          <TouchableOpacity onPress={handleMenuItemPress}>
            <Text style={styles.homeUpBarDropdownMenuItem}>
              {activeButton === 'chats' ? 'Adicionar Contato' : 'Criar Grupo'}
            </Text>
          </TouchableOpacity>

          {activeButton === 'chats' && (
            <TouchableOpacity onPress={handleContactsPress}>
              <Text style={styles.homeUpBarDropdownMenuItem}>Contatos</Text>
            </TouchableOpacity>
          )}

        </View>
      )}
    </View>
  );
};

export default HomeUpBar;
