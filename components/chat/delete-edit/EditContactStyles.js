import { StyleSheet, StatusBar } from 'react-native';

export default StyleSheet.create({
    editContactContainer: {
      flex: 1,
      backgroundColor: '#373737',
      position: 'absolute,'
    },

    editContactReturn: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',     
        height: 100,         
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,                   
        paddingTop: StatusBar.currentHeight || 0, 
    },

    editContactReturnImage: {
        width: 30,
        height: 30,
        marginLeft: 20,
    },

    editContactHead:{
        width: 100,
        height: 60,
        alignSelf: 'center',
        gap: 8
    },

    editContactHeadTittle: {
        color: '#fff',
        fontSize: 20,
        alignSelf: 'center',
    },

    editContactHeadUserImage: {
        width: 90,
        height: 90,
        alignSelf: 'center'
    },

    editContactTittle: {
        color: '#fff',
        fontSize: 18,
        marginRight: 'auto',
        marginLeft: 10
    },

    editContactInfoContainer: {
        alignItems: 'center',
        flex: 1,
        marginBottom: 50,
    },

    editContactInfo: {
        width: '80%',
        height: 400,
        backgroundColor: 'rgba(89, 107, 178, 0.41)',
        borderRadius: 10,
        marginTop: 50,
    },

    editContactInfoTittle: {
        color: '#fff',
        fontSize: 18,
        padding: 20
    },

    editContactInfoInput: {
        width: '88%',
        alignSelf: 'center',
        color: '#fff',
        fontSize: 16,
        borderBottomWidth: 1, 
        borderBottomColor: '#B3B3B3',    
    },

    editContactButtonContainer: {
        alignSelf: 'center',
        width: '80%',
        height: 100,
        bottom: 0,
        marginTop: 100,
        alignItems: 'center',
    },

    editContactButton: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: 120,
        height: 40,
        borderRadius: 10,
    },

    editContactInfoTittle: {
        color: '#fff',
        fontSize: 18,
        padding: 20,
    },

    editContactButtonTittle: {
        color: '#B3B3B3',
        fontSize: 18,
        alignSelf: 'center',
    },

    editContactButtonSaveTittle: {
        color: '#fff',
        fontSize: 18,
        alignSelf: 'center',
    },

    editContactButtonChatup: {
        color: 'white',
        fontSize: 20,
        alignSelf: 'center',
        marginTop: 'auto',
        marginBottom: 40,
    }
});