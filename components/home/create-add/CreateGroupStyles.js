import { StyleSheet, StatusBar } from 'react-native';

export default StyleSheet.create({
    createGroupContainer: {
      flex: 1,
      backgroundColor: '#373737',
      position: 'absolute,'
    },

    createGroupReturn: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',     
        height: 100,         
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 1,                   
        paddingTop: StatusBar.currentHeight || 0, 
    },

    createGroupHead:{
        width: 200,
        height: 100,
        alignSelf: 'center',
        gap: 8,
    },

    createGroupHeadTittle: {
        color: '#fff',
        fontSize: 20,
        alignSelf: 'center',
        textAlign: 'center'
    },

    createGroupHeadUserImage: {
        width: 90,
        height: 90,
        alignSelf: 'center'
    },

    createGroupReturnImage: {
        width: 30,
        height: 30,
        marginLeft: 20,
        marginRight: 'auto'
    },

    createGroupContactsContainer: {
        alignItems: 'center',
        flex: 1,
        marginBottom: 50,
    },

    createGroupContacts: {
        width: '80%',
        height: '95%',
        backgroundColor: 'rgba(89, 107, 178, 0.41)',
        borderRadius: 10,
        marginTop: 50,
    },

    createGroupContactsAddButton:{
        color: '#B3B3B3',
        alignSelf: 'flex-end',
        fontSize: 12,
        marginRight: 18,
        marginTop: 10,
        marginBottom: 10
    },

    createGroupContactsContact: {
        display: 'flex',
        flexDirection: 'row',
        width: '93%', 
        height: 60,
        backgroundColor: 'transparent',
        marginVertical: 5, 
        alignSelf: 'center',
        alignItems: 'center',
    },

    createGroupContactsUserImage: {
        width: 55,
        height: 55,    
    },

    createGroupContactsName: {
        color: '#fff',
        fontSize: 18,
        marginLeft: 20
    },

    createGroupContactsRemoveButton: {
        color: '#B3B3B3',
        marginLeft: 'auto',
        fontSize: 12,
    },

    createGroupButtonContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'flex-end',
        gap: 20,
        width: '80%',
        height: 65,
        bottom: 0,
    },

    createGroupSaveButton: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: 120,
        height: 40,
        backgroundColor: 'rgba(89, 107, 178, 0.41)',
        borderRadius: 10,
    },

    createGroupButtonTittle: {
        color: '#fff',
        fontSize: 18,
        alignSelf: 'center',
    }
});