import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ToastAndroid, ScrollView, Alert, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Importação para navegação
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase'; 
import Rsa from 'react-native-rsa-native';
import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import styles from './SignUpStyles';

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigation = useNavigation(); // Inicializando navegação

    useEffect(() => {
        // Intercepta o botão de voltar para fechar a aplicação
        const backAction = () => {
            BackHandler.exitApp(); // Fecha o aplicativo
            return true; // Previne a navegação para a tela anterior
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        // Limpa o evento ao sair da tela
        return () => backHandler.remove();
    }, []);

    const signUpFirebase = () => {
        if (password !== confirmPassword) {
            Alert.alert("Atenção", "As senhas são diferentes");
            return;
        }
    
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                // console.log("\n\n");
                // console.log("\x1b[33m", "Cadastro bem-sucedido:");
                // console.log(user);
                
                const { publicKey, privateKey } = await generateKeys();
                await savePrivateKey(user.uid, privateKey);

                const userDoc = {
                    email: user.email,
                    publicKey: publicKey,
                    contacts: [] // Inicializa como um array vazio
                };
    
                const userRef = doc(db, 'users', user.uid);
                await setDoc(userRef, userDoc)
                    .then(() => {
                        // console.log("\x1b[33m", "Usuário autenticado com sucesso!");
                        // console.log("\x1b[33m", "Chave Pública:")
                        // console.log(publicKey);
                        // console.log("\x1b[33m", "Chave Privada:")
                        // console.log(privateKey);
                        // console.log("\n\n");
                    })
                    .catch((error) => {
                        console.error("Erro ao salvar usuário:", error);
                    });
    
                // Substitui a tela de cadastro pela tela "Home"
                //navigation.replace('Home', { userEmail: user.email, userId: user.uid });

                // const response = await axios.post('http://192.168.1.7:3000/generate-code', { email });
                const response = await axios.post('http://192.168.171.206:3000/generate-code', { email });

                //console.log('response',response)
                if(response.status===200){
                    navigation.navigate('ConfirmCode', { userEmail: user.email, userPassword: user.password });
                }
            })
            .catch((error) => {
                console.warn("Falha no cadastro:", error);
                ToastAndroid.show("Falha no cadastro.", ToastAndroid.SHORT);
                Alert.alert("Atenção", "E-mail inválido");
            });
    };
        
    // Função para gerar chaves RSA
    const generateKeys = async () => {
        try {
        const keys = await Rsa.generateKeys(2048);
        return {
            publicKey: keys.public,
            privateKey: keys.private,
        };
        } catch (error) {
        console.error('Erro ao gerar chaves RSA:', error);
        }
    };

    const savePrivateKey = async (userId, privateKey) => {
        try {
            await Keychain.setGenericPassword(`privateKey_${userId}`, privateKey, {
                service: `privateKey_${userId}`, // Adicione o serviço aqui
            });
            //console.log("\x1b[33m", 'Chave privada salva com sucesso!');

        } catch (error) {
            console.error('Erro ao salvar a chave privada:', error);
        }
    };    
    
    return (
        <ScrollView style={styles.signUpContainer}>
            <Text style={styles.signUpHeadTittle}> CADASTRO </Text>

            <View style={styles.signUpUserInfoContainer}>
                <View style={styles.signUpUserInfo}>
                    <Text style={styles.signUpUserInfoTittle}>Email</Text>
                    <TextInput 
                        style={styles.signUpUserInfoInput} 
                        value={email} 
                        onChangeText={setEmail}
                        keyboardType="email-address" 
                        autoCapitalize="none" 
                    />

                    <Text style={styles.signUpUserInfoTittle}>Senha</Text>
                    <TextInput 
                        style={styles.signUpUserInfoInput} 
                        value={password} 
                        onChangeText={setPassword} 
                        secureTextEntry 
                    />

                    <Text style={styles.signUpUserInfoTittle}>Confirmar senha</Text>
                    <TextInput 
                        style={styles.signUpUserInfoInput} 
                        value={confirmPassword} 
                        onChangeText={setConfirmPassword} 
                        secureTextEntry 
                    />

                    <TouchableOpacity onPress={signUpFirebase}>
                        <Text style={styles.signUpUserLoginButton}>Cadastre-se</Text>
                    </TouchableOpacity>                
                </View>
            </View>

            <View style={styles.signUpSingUpButtonContainer}>
                <TouchableOpacity 
                    style={styles.signUpSingUpButton} 
                    onPress={() => navigation.navigate('SignIn')} // Navegação para SignIn
                >
                    <Text style={styles.signUpSingUpButtonTittle}>Login</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default SignUp;
