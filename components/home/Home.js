import React, { useState } from 'react';
import { View } from 'react-native';
import { auth, db } from '../../config/firebase'; 
import styles from "./HomeStyles";

import HomeUpBar from "../layout/HomeUpBar";
import HomeChats from "./HomeChats";
import HomeBottomBar from "../layout/HomeBottomBar";
import HomeGroups from './HomeGroups';

const Home = ( { route } ) => {
  const [activeButton, setActiveButton] = useState('chats');
  const [searchTerm, setSearchTerm] = useState(''); 
  const userEmail = auth.currentUser.email; // Obtenha o email do usuário autenticado
  const userId = auth.currentUser.uid; // Obtenha o ID do usuário autenticado  
  return (
    <View style={styles.homeContainer}>
      <HomeUpBar 
        setSearchTerm={setSearchTerm}
        activeButton={activeButton}
        userEmail={userEmail}
        userId={userId}
      /> 
      
      {activeButton === 'chats' && <HomeChats searchTerm={searchTerm} userEmail={userEmail} userId={userId} />}
      {activeButton === 'groups' && <HomeGroups searchTerm={searchTerm} userEmail={userEmail} userId={userId} />} 

      <HomeBottomBar 
        activeButton={activeButton} 
        setActiveButton={setActiveButton} 
        userEmail={userEmail}
        userId={userId}
      />
    </View>
  );
};

export default Home;
