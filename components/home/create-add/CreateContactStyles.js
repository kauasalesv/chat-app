import { StyleSheet, StatusBar } from 'react-native';

export default StyleSheet.create({
    createContactContainer: {
      flex: 1,
      backgroundColor: '#373737',
      position: 'absolute,'
    },

    createContactHead: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',     
        height: 100,         
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 1,                   
        paddingTop: StatusBar.currentHeight || 0, 
    },

    createContactReturnImage: {
        width: 30,
        height: 30,
        marginLeft: 20,
    },

    createContactTittle: {
        color: '#fff',
        fontSize: 18,
        marginLeft: 10
    },

    createContactInfoContainer: {
        alignItems: 'center',
        flex: 1,
        marginBottom: 50,
    },

    createContactInfo: {
        width: '80%',
        height: 250,
        backgroundColor: 'rgba(89, 107, 178, 0.41)',
        borderRadius: 10,
        marginTop: 50,
    },

    createContactInfoTittle: {
        color: '#fff',
        fontSize: 18,
        padding: 20
    },

    createContactInfoInput: {
        width: '88%',
        alignSelf: 'center',
        color: '#fff',
        fontSize: 16,
        borderBottomWidth: 1, 
        borderBottomColor: '#B3B3B3',    
    },

    createContactButtonContainer: {
        alignSelf: 'center',
        width: '80%',
        height: 65,
        bottom: 0,
    },

    createContactButton: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: 120,
        height: 40,
        backgroundColor: 'rgba(89, 107, 178, 0.41)',
        marginLeft: 'auto',
        borderRadius: 10,
    },

    createContactInfoTittle: {
        color: '#fff',
        fontSize: 18,
        padding: 20,
    },

    createContactButtonTittle: {
        color: '#fff',
        fontSize: 18,
        alignSelf: 'center',
    }
});