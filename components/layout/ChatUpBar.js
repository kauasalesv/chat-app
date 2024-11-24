import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Importa useNavigation
import { doc, updateDoc, arrayRemove, getDoc, collection, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../../config/firebase'; 
import { Buffer } from 'buffer';
import Rsa from 'react-native-rsa-native';
import * as Keychain from 'react-native-keychain';

import styles from './ChatUpBarStyles';

const IDEA = require("idea-cipher");

const ChatUpBar = ({ typeChat, contactName, contactEmail, groupCreator }) => {
  // Estado para controlar a visibilidade do menu suspenso
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const navigation = useNavigation(); // Inicializa o hook de navegação
  const [contacts, setContacts] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [members, setMembers] = useState([]);
  const user = auth.currentUser;

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

  const getMembers = async (groupId) => {
    try {
        // Busca o documento do grupo no Firestore
        const groupDoc = await getDoc(doc(db, 'groups', groupId));

        if (groupDoc.exists()) {
            const groupData = groupDoc.data();
            setMembers(groupData.members);

        } else {
            //console.log("Grupo não encontrado.");
            return null;
        }
    } catch (error) {
        //console.error("Grupo não encontrado.", error);
        return null;
    }
  };

  useFocusEffect(
    React.useCallback(() => {
        fetchContacts();
        getMembers(contactEmail);
    }, [])  // Isso será executado sempre que a tela for exibida
  );

  useEffect(() => {
    // Função para sincronizar `groupMembers` com base em `members`, `contacts` e `user.email`
    const updatedGroupMembers = members.map(member => {
        if (member.email === user.email) {
            // Se for o email do usuário autenticado, define "EU"
            return { email: member.email, name: "Eu" };
        }

        const matchingContact = contacts.find(contact => contact.email === member.email);
        if (matchingContact) {
            // Caso o email esteja em `contacts`
            return { email: matchingContact.email, name: matchingContact.name };
        }

        // Caso contrário, define o email como nome
        return { email: member.email, name: member.email };
    });

    setGroupMembers(updatedGroupMembers);
  }, [members, contacts, user.email]);

  // Função para alternar a visibilidade do menu
  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  // Função para lidar com a navegação
  const handleMenuItemPress = (menuType) => {
    if (menuType === 'group') {
      navigation.navigate('EditGroup', {
        groupName: contactName,
        groupId: contactEmail,
        groupCreator: groupCreator,
        contacts: contacts,
        members: groupMembers
      }); // Navega para EditGroup

    } else {
      navigation.navigate('EditContact', {
        contactName: contactName,
        contactEmail: contactEmail
      }); // Navega para EditContact
    }
    setIsMenuVisible(false); // Fecha o menu após a navegação
  };

  const leaveGroup = async () => {
    Alert.alert(
        "Atenção",
        "Você realmente deseja sair do grupo? Esta ação não pode ser desfeita e você perderá a conversa.",
        [
            {
                text: "Cancelar",
                onPress: () => console.log("Exclusão cancelada"),
                style: "cancel", 
            },
            {
                text: "Sair/Excluir",
                onPress: async () => {
                    try {
                        const groupRef = doc(db, 'groups', contactEmail);
                        const groupSnap = await getDoc(groupRef);

                        if (groupSnap.exists()) {
                            const groupData = groupSnap.data();

                            // REMOÇÃO DO MEMBRO
                            var members = groupData.members || [];

                            // TROCA CHAVE IDEA
                            const messages = groupData.messages || [];
                            const ideaMember = members.find(member => member.email === user.email);
                            const oldEncryptedIdea = ideaMember.key;
                            const publicKey = await getMyPublicKey();
                            const privateKey = await getPrivateKey();
                            const oldDecryptedIdea = await descriptografarRSA(oldEncryptedIdea, privateKey);

                            const newIdea = gerarChaveIDEA();
                            const newKeyMembers = []

                            if (messages) {
                                messages.forEach(message => {
                                    if (message.content) {
                                        const decryptedMessage = descriptografarIDEA(fromBase64(message.content), fromBase64(oldDecryptedIdea), privateKey, oldEncryptedIdea, message.sender);
                                        const encryptedMessage = criptografarIDEA(decryptedMessage, newIdea);
                                        message.content = toBase64(encryptedMessage);
                                    }
                                });

                                await Promise.all(
                                    members.map(async (member) => {
                                        const publicKey = await getContactPublicKey(member.email);
                                        const encryptedIdea = await criptografarRSA(toBase64(newIdea), publicKey);
                                        member.key = encryptedIdea;
                                    })
                                );
                                

                                await updateDoc(groupRef, {
                                    messages: messages,
                                    members: members
                                });
                            }

                            const memberToRemove = members.find(member => member.email === user.email);

                            if (memberToRemove) {
                                await updateDoc(groupRef, {
                                    members: arrayRemove(memberToRemove)
                                });

                                // Atualiza o estado local para remover o membro da lista
                                setGroupMembers(prevMembers => prevMembers.filter(member => member.email !== user.email));
                                members = members.filter(member => member.email !== memberToRemove.email);

                                

                                if ((groupData.members).length > 0 && memberToRemove.email === groupData.createdBy) {
                                    await updateDoc(groupRef, {
                                        createdBy: members[0].email
                                    });
                                }

                                Alert.alert("Sucesso", "Você saiu deste grupo!");
                            }
                        }

                        navigation.goBack();

                    } catch (error) {
                        console.error("Erro ao remover o membro:", error);
                        Alert.alert("Erro", "Ocorreu um erro ao sair do grupo.");
                    }
                },
                style: "destructive", 
            },
        ]
    );
  };

  const criptografarRSA = async (message, publicKey) => {
    try {
        const encrypted = await Rsa.encrypt(message, publicKey);
        return encrypted;
    } catch (error) {
        console.error('Erro ao criptografar a mensagem:', error);
    }
  };

  // Função para descriptografar uma mensagem
  const descriptografarRSA = async (encryptedMessage, privateKey) => {
      try {
      const decrypted = await Rsa.decrypt(encryptedMessage, privateKey);
      return decrypted;
      } catch (error) {
      console.error('Erro ao descriptografar a mensagem:', error);
      }
  };

  // Função para converter Uint8Array ou Buffer para base64
  function toBase64(data) {
      return Buffer.from(data).toString('base64');
  }

  // Função para converter base64 de volta para Uint8Array
  function fromBase64(base64String) {
      return new Uint8Array(Buffer.from(base64String, 'base64'));
  }

  function gerarChaveIDEA() {
      return Buffer.from(Array.from({ length: 16 }, () => Math.floor(Math.random() * 256)));
  }

  // Função para criptografar a mensagem com IDEA
  function criptografarIDEA(mensagem, chave) {
      const idea = new IDEA(chave);
      const mensagemBuffer = Buffer.from(mensagem, 'utf-8');
      const criptografada = idea.encrypt(mensagemBuffer);
      //console.log("Mensagem criptografada (hex):", criptografada.toString('hex'));
      return criptografada;
  }

  // Função para descriptografar a mensagem com IDEA
  function descriptografarIDEA(criptografada, chave, chavePrivada, chaveCriptografada, senderEmail) {
      const idea = new IDEA(chave);
      const descriptografada = idea.decrypt(criptografada);
      console.log('\n\n');
      console.log("\x1b[34m", "Email remetente:");
      console.log(senderEmail);
      console.log("\x1b[34m", "Mensagem criptografada:");
      console.log(toBase64(criptografada));
      console.log("\x1b[34m", "Chave IDEA criptografada:");
      console.log(chaveCriptografada);
      console.log("\x1b[34m", "Chave privada RSA:");
      console.log(chavePrivada);
      console.log("\x1b[34m", "Chave IDEA descriptografada:");
      console.log(toBase64(chave));
      console.log("\x1b[34m", "Mensagem descriptografada:");
      console.log(descriptografada.toString('utf-8'));
      console.log('\n\n');

      return descriptografada.toString('utf-8');
  }

  const getMyPublicKey = async () => {
      try {
          // Obtenha o UID do usuário autenticado
          const userId = auth.currentUser.uid; 
          const userDocRef = doc(db, 'users', userId); // Referência direta ao documento do usuário
          const userDoc = await getDoc(userDocRef); // Obtém o documento

          if (userDoc.exists()) {
              return userDoc.data().publicKey; // Acesse a chave pública
          } else {
              console.log("Documento do usuário não encontrado.");
              return null; // Retorna null se o documento não existir
          }
      } catch (error) {
          console.error("Erro ao buscar minha chave pública:", error);
          return null; // Retorna null em caso de erro
      }
  };

  const getPrivateKey = async () => {
      try {
          const credentials = await Keychain.getGenericPassword({
              service: `privateKey_${user.uid}`, // Adicione o serviço aqui
          });
          if (credentials) {
              return credentials.password; // Retorna a chave privada
          } else {
              console.log('Nenhuma chave privada encontrada.');
              return null;
          }
      } catch (error) {
          console.error('Erro ao recuperar a chave privada:', error);
      }
  };

  const getContactPublicKey = async (contactEmail) => {
      const usersRef = collection(db, 'users'); 
      const q = query(usersRef, where('email', '==', contactEmail)); 
      const querySnapshot = await getDocs(q); 
      let recipientPublicKey = null;

      if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          recipientPublicKey = userDoc.data().publicKey; 
          return recipientPublicKey;
      } else {
          console.log("Nenhum usuário encontrado com esse e-mail.");
          return null; 
      }
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

              <TouchableOpacity onPress={leaveGroup}>
                <Text style={styles.chatUpBarDropdownMenuItem}>Sair/Excluir</Text>
              </TouchableOpacity>
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
