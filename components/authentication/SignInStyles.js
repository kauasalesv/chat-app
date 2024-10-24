import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    signInContainer: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#373737',
    },

    signInHeadTittle: {
        color: '#fff',
        alignSelf: 'center',
        fontSize: 30,
        fontWeight: '900',
        marginTop: 150,
    },

    signInUserInfoContainer: {
        alignItems: 'center',
        flex: 1,
        marginBottom: 50,
        marginTop: 50,
    },

    signInUserInfo: {
        width: '80%',
        height: 300,
        backgroundColor: '#596BA2',
        borderRadius: 10,
        marginTop: 50,
    },

    signInUserInfoTittle: {
        color: '#fff',
        fontSize: 18,
        padding: 20
    },

    signInUserInfoInput: {
        width: '88%',
        alignSelf: 'center',
        color: '#fff',
        fontSize: 16,
        borderBottomWidth: 1, 
        borderBottomColor: '#B3B3B3',    
    },

    signInUserLoginButton: {
        color: '#fff',
        fontSize: 18,
        padding: 20,
        marginTop: 50,
        alignSelf: 'flex-end',
        fontWeight: '900',
    },

    signInSingUpButtonContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'center',
        gap: 20,
        width: '80%',
        height: 65,
        bottom: 0,
    },

    signInSingUpButton: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: 120,
        height: 40,
        borderRadius: 10,
    },

    signInSingUpButtonTittle: {
        color: '#fff',
        fontSize: 18,
        alignSelf: 'center',
    },

    signInErrorContainer: {
        backgroundColor: '#A2595E',
        borderRadius: 10,
    },

    signInErrorMessage: {
        color: '#fff',
        fontSize: 18,
        padding: 20
    }
});