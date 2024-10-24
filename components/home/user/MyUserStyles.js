import { StyleSheet, StatusBar } from 'react-native';

export default StyleSheet.create({
    myUserContainer: {
      flex: 1,
      backgroundColor: '#373737',
      position: 'absolute,'
    },

    myUserReturn: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',     
        height: 100,         
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 1,                   
        paddingTop: StatusBar.currentHeight || 0, 
    },

    myUserHead:{
        width: 100,
        height: 100,
        alignSelf: 'center',
        gap: 8
    },

    myUserHeadTittle: {
        color: '#fff',
        fontSize: 20,
        alignSelf: 'center',
    },

    myUserInfoContainer: {
        alignItems: 'center',
        flex: 1,
        marginBottom: 50,
    },

    myUserInfoContainer: {
        alignItems: 'center',
        flex: 1,
        marginBottom: 50,
    },

    myUserInfo: {
        width: '80%',
        height: '90%',
        backgroundColor: 'rgba(89, 107, 178, 0.41)',
        borderRadius: 10,
        marginTop: 50,
    },

    myUserInfoTittle: {
        color: '#fff',
        fontSize: 18,
        padding: 20
    },

    myUserInfoInput: {
        width: '88%',
        alignSelf: 'center',
        color: '#fff',
        fontSize: 16,
        borderBottomWidth: 1, 
        borderBottomColor: '#B3B3B3',    
    },

    myUserHeadUserImage: {
        width: 90,
        height: 90,
        alignSelf: 'center'
    },

    myUserReturnImage: {
        width: 30,
        height: 30,
        marginLeft: 20,
        marginRight: 'auto'
    },

    myUserButtonContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'center',
        gap: 20,
        width: '80%',
        height: 65,
        bottom: 0,
    },

    myUserDeleteButton: {
        color: '#B3B3B3',
        fontSize: 12,
        marginTop: 'auto',
        alignSelf: 'center',
        marginBottom: 10
    },

    myUserLogoutButton: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: 120,
        height: 40,
        borderRadius: 10,
    },

    myUserButtonTittle: {
        color: '#fff',
        fontSize: 18,
        alignSelf: 'center',
    }
});