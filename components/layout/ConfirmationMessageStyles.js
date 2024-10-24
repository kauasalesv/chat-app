import { StyleSheet, StatusBar } from 'react-native';

export default StyleSheet.create({
    confirmationMessageContainer: {
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        backgroundColor: '#373737',
        alignItems: 'center',
        justifyContent: 'center'
    },

    confirmationMessage: {
        height: 100,
        gap: 30
    },

    confirmationMessageText: {
        color: '#fff',
        fontSize: 20,
        alignSelf: 'center',
    },

    confirmationMessageButtons: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30
    },

    confirmationMessageButtonsButton: {
        backgroundColor: '#596BA2',
        width: 100,
        height: 30,
        borderRadius: 10
    }
});