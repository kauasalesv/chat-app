import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 
import { auth, db } from '../../config/firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import * as Keychain from 'react-native-keychain';
import axios from 'axios';

const ConfirmCode = ({ route }) => {
  const { userEmail, userPassword, userId } = route.params;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    // Limpar o campo de input ao sair da tela
    const unsubscribe = navigation.addListener('blur', () => {
      setCode(''); // Limpa o código quando a tela for desfocada
    });

    // Retorna uma função para limpar o listener quando o componente for desmontado
    return unsubscribe;
  }, [navigation]);

  const handleVerifyCode = async () => {
    if (!code) {
      Alert.alert('Erro', 'Por favor, insira o código de verificação.');
      return;
    }

    setLoading(true);

    try {
      // const response = await axios.post('http://192.168.1.7:3000/verificar-codigo', { email: userEmail, code });
      const response = await axios.post('http://192.168.119.206:3000/verificar-codigo', { email: userEmail, code });

      if (response.status === 200) {
        const publicKey = await getMyPublicKey();
        const privateKey = await getPrivateKey();

        console.log("\n\n");
        console.log("\x1b[33m", "Usuário autenticado com sucesso!");
        console.log(userEmail);
        console.log("\x1b[33m", "Código de confirmação:");
        console.log(code);
        console.log("\x1b[33m", "Chave Pública: ");
        console.log(publicKey);
        console.log("\x1b[33m", "Chave Privada: ");
        console.log(privateKey);
        console.log("\n\n");

        navigation.navigate('Home', { userEmail: userEmail, userId: userId });
      }
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.message || 'Ocorreu um erro ao verificar o código.');
    } finally {
      setLoading(false);
    }
  };

  const getMyPublicKey = async () => {
    try {
      const userId = auth.currentUser.uid;
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return userDoc.data().publicKey;
      } else {
        console.log("Documento do usuário não encontrado.");
        return null;
      }
    } catch (error) {
      console.error("Erro ao buscar minha chave pública:", error);
      return null;
    }
  };

  const getPrivateKey = async () => {
    try {
      const userId = auth.currentUser.uid;
      const credentials = await Keychain.getGenericPassword({
        service: `privateKey_${userId}`,
      });
      if (credentials) {
        return credentials.password;
      } else {
        console.log('Nenhuma chave privada encontrada.');
        return null;
      }
    } catch (error) {
      console.error('Erro ao recuperar a chave privada:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificar Código</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite o código de verificação"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
      />
      <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyCode} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verificar</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Cancelar</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#373737',
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  verifyButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#596BA2',
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#E15242',
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ConfirmCode;
