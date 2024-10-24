import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import styles from './ChatMessagesStyles';

const ChatMessages = ({ messages, contactEmail }) => {
  const scrollViewRef = useRef();
  const [loading, setLoading] = useState(false);
    
  // Função para garantir que o timestamp seja convertido corretamente
  const getMessageTime = (time) => {
    // Se for um objeto do Firebase (com 'seconds'), converte para Date
    if (time && time.seconds) {
      return new Date(time.seconds * 1000);
    }
    // Se for uma string ISO 8601, converte diretamente para Date
    if (typeof time === 'string') {
      return new Date(time);
    }
    // Caso não tenha tempo definido, retorna a data atual
    return new Date();
  };

  // Faz uma cópia das mensagens antes de ordenar
  const sortedMessages = [...messages].sort((a, b) => {
    const timeA = getMessageTime(a.time);
    const timeB = getMessageTime(b.time);
    return timeA - timeB;
  });

  // Função para rolar para o final do ScrollView
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: false });
    }
  };

  // Efeito para rolar para o final quando as mensagens mudam
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [messages]);


  return (
    <View style={styles.chatMessagesContainer}>
        <ScrollView ref={scrollViewRef}>
          {sortedMessages.map((message, index) => {
            const isLastMessageFromSender =
              (index === sortedMessages.length - 1) || 
              (sortedMessages[index + 1].from !== message.from);

            // Gera uma chave única para cada mensagem
            const uniqueKey = `${message.id || index}-${message.time ? message.time.seconds || message.time : Date.now()}`;

            // Obtem o tempo da mensagem
            const messageTime = getMessageTime(message.time);

            return (
              <View key={uniqueKey}>
                {(index === 0 || !sortedMessages[index - 1].time) && messageTime ? (
                  <Text style={styles.chatMessagesDateText}>
                    {messageTime.toLocaleDateString()}
                  </Text>
                ) : null}

              <View 
                  style={[
                    message.from === 'me' ? styles.chatMessagesMyMessage : styles.chatMessagesOtherMessage,
                    message.from === 'other' && message.status === 'pending' ? { backgroundColor: '#A28B59' } : {}
                  ]}
                >
                  <Text style={styles.chatMessagesMessageText}>{message.text}</Text>
                  <Text style={styles.chatMessagesTimestamp}>
                    {isLastMessageFromSender && messageTime && (
                      <>{/* Apenas exibe a hora se for a última mensagem do remetente */}</>
                    )}
                    {messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
    </View>
  );
};

export default ChatMessages;
