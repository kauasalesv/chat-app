import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ToastAndroid, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Importação para navegação
import { auth } from '../../config/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import styles from './SignInStyles';

const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation(); // Inicializando a navegação

    const loginFirebase = () => {
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("Login bem-sucedido:", user);
    
                // Substitui a tela de autenticação pela tela "Home" e passa o usuário autenticado
                navigation.replace('Home', { userEmail: user.email, userId: user.uid });
            })
            .catch((error) => {
                console.warn("Falha no login:", error);
                ToastAndroid.show("Falha na autenticação.", ToastAndroid.SHORT);
    
                // Exibe um alerta com a mensagem de erro
                Alert.alert(
                    "Atenção", // Título do alerta
                    "E-mail ou senha inválidos", // Mensagem do alerta
                    [{ text: "OK" }] // Botão do alerta
                );
            });
    };    

    return (
        <ScrollView style={styles.signInContainer}>
            <Text style={styles.signInHeadTittle}> LOGIN </Text>

            <View style={styles.signInUserInfoContainer}>
                <View style={styles.signInUserInfo}>
                    <Text style={styles.signInUserInfoTittle}>Email</Text>
                    <TextInput 
                        style={styles.signInUserInfoInput} 
                        value={email} 
                        onChangeText={setEmail} 
                        keyboardType="email-address" 
                        autoCapitalize="none" 
                    />

                    <Text style={styles.signInUserInfoTittle}>Senha</Text>
                    <TextInput 
                        style={styles.signInUserInfoInput} 
                        value={password} 
                        onChangeText={setPassword} 
                        secureTextEntry 
                    />

                    <TouchableOpacity onPress={loginFirebase}>
                        <Text style={styles.signInUserLoginButton}>Entrar</Text>
                    </TouchableOpacity>                
                </View>
            </View>

            <View style={styles.signInSingUpButtonContainer}>
                <TouchableOpacity 
                    style={styles.signInSingUpButton} 
                    onPress={() => navigation.navigate('SignUp')} // Navegação para a tela de SignUp
                >
                    <Text style={styles.signInSingUpButtonTittle}>Cadastre-se</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default SignIn;
