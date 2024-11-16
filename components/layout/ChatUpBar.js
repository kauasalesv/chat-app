import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Importa useNavigation
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../../config/firebase'; 
import styles from './ChatUpBarStyles';

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
    } finally {
        setLoading(false); // Para de exibir o indicador de carregamento
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
            console.log("Grupo não encontrado.");
            return null;
        }
    } catch (error) {
        console.error("Grupo não encontrado.", error);
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
