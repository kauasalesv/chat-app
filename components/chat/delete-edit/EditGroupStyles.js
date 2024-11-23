import { StyleSheet, StatusBar } from 'react-native';

export default StyleSheet.create({
    editGroupContainer: {
      flex: 1,
      backgroundColor: '#373737',
      position: 'absolute,'
    },

    editGroupReturn: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',     
        height: 100,         
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 1,                   
        paddingTop: StatusBar.currentHeight || 0, 
    },

    editGroupHead:{
        width: 200,
        height: 100,
        alignSelf: 'center',
        gap: 8,
    },

    editGroupHeadTittle: {
        color: '#fff',
        fontSize: 20,
        alignSelf: 'center',
        textAlign: 'center'
    },

    editGroupHeadUserImage: {
        width: 90,
        height: 90,
        alignSelf: 'center'
    },

    editGroupReturnImage: {
        width: 30,
        height: 30,
        marginLeft: 20,
        marginRight: 'auto'
    },

    editGroupContactsContainer: {
        alignItems: 'center',
        flex: 1,
        marginBottom: 50,
    },

    editGroupContacts: {
        width: '80%',
        height: '95%',
        backgroundColor: 'rgba(89, 107, 178, 0.41)',
        borderRadius: 10,
        marginTop: 50,
    },

    editGroupContactsAddButton:{
        color: '#B3B3B3',
        alignSelf: 'flex-end',
        fontSize: 12,
        marginRight: 18,
        marginTop: 10,
        marginBottom: 10
    },

    editGroupContactsContact: {
        display: 'flex',
        flexDirection: 'row',
        width: '93%', 
        height: 60,
        marginVertical: 5, 
        alignSelf: 'center',
        alignItems: 'center',
    },

    editGroupContactsUserImage: {
        width: 55,
        height: 55,    
    },

    editGroupContactsName: {
        color: '#fff',
        fontSize: 18,
        marginLeft: 20
    },

    editGroupContactsRemoveButton: {
        color: '#B3B3B3',
        fontSize: 12,
        marginLeft: 'auto'
    },

    editGroupButtonContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'center',
        gap: 20,
        width: '80%',
        height: 65,
        bottom: 0,
    },

    editGroupSaveButton: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: 120,
        height: 40,
        borderRadius: 10,
    },

    editGroupButtonTittle: {
        color: '#fff',
        fontSize: 18,
        alignSelf: 'center',
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
    },

    editGroupNewMemebrsTittle:{
        color: '#B3B3B3',
        fontSize: 12,
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
    },
});