import React from 'react';
import { View, Text, Image, TouchableOpacity, ImageBackground } from 'react-native';
import styles from './HomeBottomBarStyles';

const HomeBottomBar = ({ activeButton, setActiveButton, userEmail, userId }) => {
  // Função para alterar o botão ativo
  const handleButtonPress = (buttonName) => {
    setActiveButton(buttonName);
  };

  return (
    <View style={styles.homeBottomBarContainer}>
      
      {/* Botão de Conversas */}
      <TouchableOpacity 
        style={styles.homeBottomBarChatsContainer} 
        onPress={() => handleButtonPress('chats')}
      >
        {activeButton === 'chats' ? (
          <ImageBackground 
            source={require('../../assets/chatsButtonBackgroundImage.png')} 
            style={styles.homeBottomBarChatsImage}
            resizeMode='contain'
          >
            <Image 
              source={require('../../assets/chatImage.png')}
              style={styles.homeBottomBarChatIcon} 
            />
            <Text style={styles.homeBottomBarChatText}>Conversas</Text>
          </ImageBackground>
        ) : (
          <>
            <Image 
              source={require('../../assets/chatImage.png')}
              style={styles.homeBottomBarChatIcon} 
            />
            <Text style={styles.homeBottomBarChatText}>Conversas</Text>
          </>
        )}
      </TouchableOpacity>
      
      {/* Botão de Grupos */}
      <TouchableOpacity 
        style={styles.homeBottomBarGroupsContainer} 
        onPress={() => handleButtonPress('groups')}
      >
        {activeButton === 'groups' ? (
          <ImageBackground 
            source={require('../../assets/groupsButtonBackgroundImage.png')} 
            style={styles.homeBottomBarGroupsImage}
            resizeMode='contain'
          >
            <Image 
              source={require('../../assets/groupImage2.png')}
              style={styles.homeBottomBarGroupIcon} 
            />
            <Text style={styles.homeBottomBarGroupText}>Grupos</Text>
          </ImageBackground>
        ) : (
          <>
            <Image 
              source={require('../../assets/groupImage2.png')}
              style={styles.homeBottomBarGroupIcon} 
            />
            <Text style={styles.homeBottomBarGroupText}>Grupos</Text>
          </>
        )}
      </TouchableOpacity>

    </View>
  );
};

export default HomeBottomBar;
