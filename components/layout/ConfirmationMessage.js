import React, { useState } from 'react';
import { View, Image, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import styles from "./ConfirmationMessageStyles";

const ConfirmationMessage = () => {
    return (
        <View style={styles.confirmationMessageContainer}>
            <View style={styles.confirmationMessage}>
                <Text style={styles.confirmationMessageText}>
                    Deseja confirmar essa ação?
                </Text>

                <View style={styles.confirmationMessageButtons}>
                    <View style={styles.confirmationMessageButtonsButton}>
                        <Text style={styles.confirmationMessageText}>Sim</Text>
                    </View>

                    <View style={styles.confirmationMessageButtonsButton}>
                        <Text style={styles.confirmationMessageText}>Não</Text>                    
                    </View>
                </View>
            </View>
        </View>
    );
};

export default ConfirmationMessage;
