import { StyleSheet } from 'react-native';

export default StyleSheet.create({ 
    signUpContainer: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1, // Isso garante que o container ocupe 100% do espaço disponível
        height: '100%', // Isso pode ser mantido, mas geralmente não é necessário se você estiver usando flex
        backgroundColor: '#373737',
    },

    signUpHeadTittle: {
        color: '#fff',
        alignSelf: 'center',
        fontSize: 30,
        fontWeight: '900',
        marginTop: 150,
    },

    signUpUserInfoContainer: {
        alignItems: 'center',
        flex: 1,
        marginBottom: 50,
        marginTop: 50,
    },

    signUpUserInfo: {
        width: '80%',
        height: 400,
        backgroundColor: '#596BA2',
        borderRadius: 10,
        marginTop: 50,
    },

    signUpUserInfoTittle: {
        color: '#fff',
        fontSize: 18,
        padding: 20
    },

    signUpUserInfoInput: {
        width: '88%',
        alignSelf: 'center',
        color: '#fff',
        fontSize: 16,
        borderBottomWidth: 1, 
        borderBottomColor: '#B3B3B3',    
    },

    signUpUserLoginButton: {
        color: '#fff',
        fontSize: 18,
        padding: 20,
        marginTop: 50,
        alignSelf: 'flex-end',
        fontWeight: '900',
    },

    signUpSingUpButtonContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'center',
        gap: 20,
        width: '80%',
        height: 65,
        bottom: 0,
    },

    signUpSingUpButton: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: 120,
        height: 40,
        borderRadius: 10,
    },

    signUpSingUpButtonTittle: {
        color: '#fff',
        fontSize: 18,
        alignSelf: 'center',
    },

    signUpErrorContainer: {
        backgroundColor: '#A2595E',
        borderRadius: 10,
    },

    signUpErrorMessage: {
        color: '#fff',
        fontSize: 18,
        padding: 20
    }
});