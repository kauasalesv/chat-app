import React, { useState } from 'react';
import { View, Image, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, updateDoc, arrayUnion, getDoc, collection, query, where, getDocs } from 'firebase/firestore'; 
import { auth, db } from '../../../config/firebase'; 
import styles from "./CreateContactStyles";

const CreateContact = () => {
    const navigation = useNavigation();

    // Estados para armazenar o nome e o e-mail
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleGoBack = () => {
        navigation.goBack(); // Navega para a tela anterior
    };

    // Função para verificar se o e-mail do contato existe
    const checkEmailExists = async (email) => {
        const usersRef = collection(db, 'users'); // Referência à coleção de usuários
        const q = query(usersRef, where('email', '==', email)); // Consulta para verificar o e-mail
        const querySnapshot = await getDocs(q); // Obtém os documentos que correspondem à consulta
        return !querySnapshot.empty; // Retorna verdadeiro se o e-mail já existir
    };

    // Função para verificar se o contato já existe na lista de contatos
    const checkContactExists = async (newEmail) => {
        const userId = auth.currentUser.uid; // Obtém o ID do usuário autenticado
        const userRef = doc(db, 'users', userId); // Referência ao documento do usuário
        const userSnap = await getDoc(userRef); // Corrigido: Use getDoc para obter o documento

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const contacts = userData.contacts || []; // Obtém os contatos existentes

            // Verifica se algum contato já tem o mesmo e-mail
            return contacts.some(contact => contact.email === newEmail);
        }

        return false; // Retorna falso se não houver contatos
    };

    // Função para salvar o contato
    const handleSaveContact = async () => {
        if (name && email) {
            const currentUserEmail = auth.currentUser.email; // Obtém o e-mail do usuário autenticado
            
            // Verifica se o e-mail inserido é o mesmo do usuário autenticado
            if (email === currentUserEmail) {
                Alert.alert(
                    "Atenção",
                    "Você não pode adicionar o seu próprio e-mail como contato.",
                    [
                        { text: "OK", onPress: () => console.log("OK Pressed") }
                    ]
                );
                return;
            }

            // Verifica se o e-mail do contato existe na coleção de usuários
            const emailExists = await checkEmailExists(email);
            if (!emailExists) {
                Alert.alert(
                    "Atenção",
                    "Esse e-mail não utiliza nossos serviços.",
                    [
                        { text: "OK", onPress: () => console.log("OK Pressed") }
                    ]
                );
                return;
            }

            // Verifica se o contato já existe
            const contactExists = await checkContactExists(email);
            if (contactExists) {
                Alert.alert(
                    "Atenção",
                    "Esse contato já está na sua lista de contatos.",
                    [
                        { text: "OK", onPress: () => console.log("OK Pressed") }
                    ]
                );
                return;
            }

            try {
                const userId = auth.currentUser.uid; // Obtém o ID do usuário autenticado
                const userRef = doc(db, 'users', userId); // Referência ao documento do usuário
                await updateDoc(userRef, {
                    contacts: arrayUnion({ 
                        name, 
                        email
                    }) // Adiciona o novo contato ao array
                });
                navigation.goBack(); // Navega de volta após salvar
            } catch (error) {
                console.error("Erro ao salvar o contato:", error);
            }
        } else {
            Alert.alert("Atenção", "Por favor, preencha todos os campos."); // Validação simples
        }
    };

    return (
        <View style={styles.createContactContainer}>
            <View style={styles.createContactHead}>
                <TouchableOpacity onPress={handleGoBack}>
                    <Image 
                        source={require('../../../assets/returnImage.png')}
                        style={styles.createContactReturnImage} 
                    />
                </TouchableOpacity>

                <Text style={styles.createContactTittle}>Adicionar Contato</Text>
            </View>

            <View style={styles.createContactInfoContainer}>
                <View style={styles.createContactInfo}>
                    {/* Campo Nome */}
                    <Text style={styles.createContactInfoTittle}>Nome</Text>
                    <TextInput
                        style={styles.createContactInfoInput}
                        value={name}
                        onChangeText={setName} // Atualiza o estado de nome
                    />

                    {/* Campo Email */}
                    <Text style={styles.createContactInfoTittle}>Email</Text>
                    <TextInput
                        style={styles.createContactInfoInput}
                        value={email}
                        onChangeText={setEmail} // Atualiza o estado de e-mail
                        keyboardType="email-address" // Para facilitar a digitação de e-mails
                    />
                </View>
            </View>

            <View style={styles.createContactButtonContainer}>
                <TouchableOpacity style={styles.createContactButton} onPress={handleSaveContact}>
                    <Text style={styles.createContactButtonTittle}>Salvar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default CreateContact;