import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ToastAndroid, ScrollView, Alert, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Importação para navegação
import { signInWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import { auth, db } from '../../config/firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import styles from './SignInStyles';

const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation(); // Inicializando a navegação

    // Interceptando o botão de voltar para fechar o aplicativo
    useEffect(() => {
        const backAction = () => {
            BackHandler.exitApp(); // Fecha o aplicativo
            return true; // Impede o comportamento padrão (voltar para a tela anterior)
        };

        // Adiciona o listener para o evento de voltar
        BackHandler.addEventListener('hardwareBackPress', backAction);

        // Remove o listener quando o componente for desmontado
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', backAction);
        };
    }, []);

    const loginFirebase = async () => {
        try{
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Fazendo a requisição para o servidor
            const response = await axios.post('http://192.168.1.7:3000/generate-code', { email });
            // const response = await axios.post('http://192.168.162.206:3000/generate-code', { email });
            //console.log('response',response)
            if(response.status === 200){
                navigation.navigate('ConfirmCode', { userEmail: user.email, userPassword: user.password });
            }

        } catch(error) {
            console.warn("Falha no login:", error);
            ToastAndroid.show("Falha na autenticação.", ToastAndroid.SHORT);

            // Exibe um alerta com a mensagem de erro
            Alert.alert(
                "Atenção", // Título do alerta
                "E-mail ou senha inválidos", // Mensagem do alerta
                [{ text: "OK" }] // Botão do alerta
            );
        };
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
