import { StyleSheet, StatusBar } from 'react-native';

export default StyleSheet.create({
    contactsContainer: {
      flex: 1,
      backgroundColor: '#373737',
      position: 'absolute,'
    },

    contactsHead: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',     
        height: 100,         
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 1,                   
        paddingTop: StatusBar.currentHeight || 0, 
    },

    contactsHeadReturnImage: {
        width: 30,
        height: 30,
        marginLeft: 20,
        marginRight: 'auto'
    },

    contactsSearchContainer: {
        backgroundColor: 'rgba(89, 107, 178, 0.41)',
        display: 'flex',
        flexDirection: 'row',
        width: '80%',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        height: 35,
        marginLeft: 20,
    },

    contactsSearchImage: {
        width: 20,
        height: 20,
        marginRight: 10,
    },

    contactsSearchInput: {
        width: '85%',
        backgroundColor: 'transparent',
        color: 'white',
    },

    contactsContactsContainer: {
        alignItems: 'center',
        flex: 1,
    },

    contactsContacts: {
        width: '80%',
        height: '95%',
        backgroundColor: '#596BA2',
        borderRadius: 10,
        marginTop: 50,
    },

    contactsContactsAddButton:{
        color: '#B3B3B3',
        alignSelf: 'flex-start',
        fontSize: 12,
        marginLeft: 18,
        marginTop: 10,
        marginBottom: 10
    },

    contactsContactsContact: {
        display: 'flex',
        flexDirection: 'row',
        width: '98%', 
        height: 65,
        backgroundColor: 'transparent',
        marginVertical: 5, 
        alignSelf: 'center',
        alignItems: 'center',
        borderRadius: 30,
    },

    contactsContactsUserImage: {
        width: 55,
        height: 55,  
        marginLeft: 10  
    },

    contactsContactsName: {
        color: '#fff',
        fontSize: 18,
        marginLeft: 20,
        marginRight: 'auto',
        marginLeft: 20
    },

    contactsButtonContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'flex-end',
        alignContent: 'center',
        width: '88%',
        height: 65,
        bottom: 0,
    },

    contactsSaveButton: {
        display: 'flex',
        flexDirection: 'column',
        alignSelf: 'center',
        justifyContent: 'center',
        width: 120,
        height: 40,
        backgroundColor: '#596BA2',
        borderRadius: 10,
    },

    contactsButtonTittle: {
        color: '#fff',
        fontSize: 18,
        alignSelf: 'center',
    },

    contactsContactsAddButtonText: {
        color: '#B3B3B3',
        fontSize: 12,
    },

    contactsNoResultsText: {
        color: 'white'
    }
});