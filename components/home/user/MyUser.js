import React, { useEffect, useState } from 'react';
import { View, Image, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../../config/firebase'; 
import { signOut, deleteUser } from 'firebase/auth'; // Importe deleteUser para excluir o usuário
import { doc, deleteDoc } from 'firebase/firestore'; // Importe as funções do Firestore
import { db } from '../../../config/firebase'; // Importe sua configuração do Firestore
import styles from "./MyUserStyles";

const MyUser = () => {
    const navigation = useNavigation();
    const [userEmail, setUserEmail] = useState('');

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleLogout = async () => {
        try {
            await signOut(auth); // Desconecta o usuário
            navigation.replace('SignIn'); // Navega para a tela de login
        } catch (error) {
            console.error("Erro ao sair:", error);
            // Aqui você pode adicionar um alerta para o usuário se desejar
        }
    };

    const handleDeleteAccount = async () => {
        const user = auth.currentUser;
    
        if (user) {
            Alert.alert(
                "Atenção",
                "Você realmente deseja excluir sua conta? Esta ação não pode ser desfeita e você perderá seus contatos, grupos e conversas (seus contatos também perderão).",
                [
                    {
                        text: "Cancelar",
                        style: "cancel"
                    },
                    {
                        text: "Excluir",
                        onPress: async () => {
                            try {
                                // Exclui os dados do usuário do Firestore
                                const userDocRef = doc(db, 'users', user.uid); // Ajuste o caminho conforme necessário
                                await deleteDoc(userDocRef);
    
                                // Exclui o usuário do Firebase Authentication
                                await deleteUser(user);
                                
                                Alert.alert("Conta excluída", "Sua conta foi excluída com sucesso.");
                                handleLogout(); // Faz logout após a exclusão
                            } catch (error) {
                                console.error("Erro ao excluir a conta:", error);
                                Alert.alert("Erro", "Não foi possível excluir sua conta. Tente novamente.");
                            }
                        }
                    }
                ],
                { cancelable: false }
            );
        }
    };    

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            setUserEmail(user.email);
        }
    }, []);

    return (
        <View style={styles.myUserContainer}>
            <View style={styles.myUserReturn}>
                <TouchableOpacity onPress={handleGoBack}>
                    <Image 
                        source={require('../../../assets/returnImage.png')}
                        style={styles.myUserReturnImage} 
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.myUserHead}>
                <Image 
                    source={require('../../../assets/userImage.png')}
                    style={styles.myUserHeadUserImage} 
                />
                <Text style={styles.myUserHeadTittle}>Meu User</Text>
            </View>

            <View style={styles.myUserInfoContainer}>
                <View style={styles.myUserInfo}>
                    <Text style={styles.myUserInfoTittle}>E-mail</Text>
                    <Text style={styles.myUserInfoInput}>{userEmail}</Text>

                    <TouchableOpacity style={styles.myUserDeleteButton} onPress={handleDeleteAccount}>
                        <Text style={styles.myUserDeleteButton}>Excluir Conta</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.myUserButtonContainer}>
                <TouchableOpacity style={styles.myUserLogoutButton} onPress={handleLogout}>
                    <Text style={styles.myUserButtonTittle}>Sair</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default MyUser;
