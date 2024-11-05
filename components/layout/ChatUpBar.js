import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Importa useNavigation
import styles from './ChatUpBarStyles';

const ChatUpBar = ({ typeChat, contactName, contactEmail }) => {
  // Estado para controlar a visibilidade do menu suspenso
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const navigation = useNavigation(); // Inicializa o hook de navegação

  // Função para alternar a visibilidade do menu
  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  // Função para lidar com a navegação
  const handleMenuItemPress = (menuType) => {
    if (menuType === 'group') {
      //navigation.navigate('EditGroup'); // Navega para EditGroup
    } else {
      navigation.navigate('EditContact', {
        contactName: contactName,
        contactEmail: contactEmail
      }); // Navega para EditContact
    }
    setIsMenuVisible(false); // Fecha o menu após a navegação
  };

  return (
    <View style={styles.chatUpBarContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image 
            source={require('../../assets/returnImage.png')}
            style={styles.chatUpBarReturnImage} 
        />
      </TouchableOpacity>

      <View style={styles.chatUpBarContact}>
        <Image 
            source={require('../../assets/userImage.png')}
            style={styles.chatUpBarUserImage} 
        />
        
        {typeChat === 'group' ? (
          <Text style={styles.chatUpBarName}>{contactName}</Text>
        ) : (
          <Text style={styles.chatUpBarName}>{contactName}</Text>
        )}
      </View>

      <TouchableOpacity onPress={toggleMenu}>
        <Image 
            source={require('../../assets/menuImage.png')}
            style={styles.chatUpBarMenuImage} 
        />
      </TouchableOpacity>

      {/* Menu suspenso abaixo da barra */}
      {isMenuVisible && (
        <View style={styles.chatUpBarDropdownMenu}>
          {typeChat === 'group' ? (
            <>
              <TouchableOpacity onPress={() => handleMenuItemPress('group')}>
                <Text style={styles.chatUpBarDropdownMenuItem}>Ver Grupo</Text>
              </TouchableOpacity>
              <Text style={styles.chatUpBarDropdownMenuItem}>Excluir/Sair</Text>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => handleMenuItemPress('contact')}>
                <Text style={styles.chatUpBarDropdownMenuItem}>Ver Contato</Text>
              </TouchableOpacity>
              <Text style={styles.chatUpBarDropdownMenuItem}>Limpar Conversa</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default ChatUpBar;
