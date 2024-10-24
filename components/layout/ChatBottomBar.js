import React from 'react';
import { View, TextInput, TouchableOpacity, Image } from 'react-native';
import styles from './ChatBottomBarStyles';

const ChatBottomBar = ({ messageText, setMessageText, sendMessage }) => {
  return (
    <View style={styles.chatBottomBarContainer}>
      <View style={styles.chatBottomBarWriteMessageContainer}>
        <TextInput
          style={styles.chatBottomBarWriteMessageInput}
          placeholder="Mensagem..."
          placeholderTextColor="#ffff"
          value={messageText}
          onChangeText={setMessageText} // Atualiza o texto da mensagem
        />
      </View>

      <TouchableOpacity onPress={sendMessage}>
        <Image 
          source={require('../../assets/sendImage.png')}
          style={styles.chatBottomBarWriteMessageImage} 
        />
      </TouchableOpacity>
    </View>
  );
};

export default ChatBottomBar;
