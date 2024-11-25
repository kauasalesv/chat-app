import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ScrollView, Image } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import styles from './ChatMessagesStyles';

const ChatMessages = ({ messages }) => {
  const navigation = useNavigation();
  const scrollViewRef = useRef();
  const [contacts, setContacts] = useState([]);
  const user = auth.currentUser;

  const getMessageTime = (time) => {
    if (time && time.seconds) {
      return new Date(time.seconds * 1000);
    }
    if (typeof time === 'string') {
      return new Date(time);
    }
    return new Date();
  };

  const sortedMessages = [...messages].sort((a, b) => {
    const timeA = getMessageTime(a.time);
    const timeB = getMessageTime(b.time);
    return timeA - timeB;
  });

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: false });
    }
  };

  const fetchContacts = async () => {
    try {
      const userId = auth.currentUser.uid; // Obtém o ID do usuário autenticado
      const userRef = doc(db, 'users', userId); // Referência ao documento do usuário
      const userSnap = await getDoc(userRef); // Busca os dados do usuário

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setContacts(userData.contacts || []); // Define os contatos (ou array vazio se não houver contatos)
      } else {
        console.log("Documento do usuário não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchContacts(); // Recarrega os contatos quando a tela é focada
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [messages]);

  //console.log(messages);

  return (
    <View style={styles.chatMessagesContainer}>
      <ScrollView ref={scrollViewRef}>
        {sortedMessages.length === 0 ? (
          <Text style={styles.noMessagesText}> Nenhuma mensagem </Text>
        ) : (
          sortedMessages.map((message, index) => {
            const isLastMessageFromSender =
              index === sortedMessages.length - 1 ||
              sortedMessages[index + 1].from !== message.from;

            const uniqueKey = `${message.id || index}-${message.time ? message.time.seconds || message.time : Date.now()}`;
            const messageTime = getMessageTime(message.time);

            const contact = contacts.find(contact => contact.email === message.sender);

            const messageDate = messageTime.toLocaleDateString();
            const showDate = index === 0 || messageDate !== getMessageTime(sortedMessages[index - 1].time).toLocaleDateString();

            return (
              <View key={uniqueKey}>
                {showDate && (
                  <Text style={styles.chatMessagesDateText}>
                    {messageDate}
                  </Text>
                )}

                <View
                  style={[
                    message.from === user.email ? styles.chatMessagesMyMessage : styles.chatMessagesOtherMessage,
                    message.from !== user.email && message.status === 'read' ? { backgroundColor: '#CA8B4B' } : {}
                  ]}
                >
                  {message.from !== user.email && message.sender ? (
                    <Text style={styles.chatMessagesSenderEmail}>
                      {contact ? contact.name : message.sender}
                    </Text>
                  ) : null}
                  <Text style={styles.chatMessagesMessageText}>{message.text}</Text>
                  
                  <View style={styles.timeCheckContainer}>
                    <Text style={styles.chatMessagesTimestamp}>
                      {isLastMessageFromSender && messageTime && (
                        <>
                          {/* Apenas exibe a hora se for a última mensagem do remetente */}
                        </>
                      )}
                      {messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>

                    {/* {message.from === user.email && message.status === 'pending' ? (
                      <Image 
                        source={require('../../assets/sendMessageImage.png')}
                        style={styles.checkImage} 
                      />
                    ) : null}

                    {message.from === user.email && message.status === 'read' ? (
                      <Image 
                        source={require('../../assets/viewMessageImage.png')}
                        style={styles.checkImage} 
                      />
                    ) : null} */}

                  </View>

                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default ChatMessages;
