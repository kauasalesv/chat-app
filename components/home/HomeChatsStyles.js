import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    homeChatsContainer: {
        width: '100%',
        flex: 1,        
        backgroundColor: '#373737',
        marginTop: 100,
        marginBottom: 72,
    },

    homeChatsChats: {
        display: 'flex',
        flexDirection: 'row',
        width: '90%', 
        height: 60,
        backgroundColor: 'transparent',
        marginVertical: 5, 
        alignSelf: 'center',
        alignItems: 'center',
        borderTopWidth: 1, 
        borderTopColor: '#565656',
    },

    homeChatsUserImage: {
        width: 45,
        height: 45,    
    },

    homeChatsName: {
        color: '#fff',
        fontSize: 18,
        marginLeft: 20
    },

    homeChatsOnlineImage: {
        width: 10,
        height: 10,
        marginLeft: 'auto',
        marginRight: 20,
    },

    homeChatsNotificationContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent'
    },

    homeChatsNotificationText: {
        color: 'white', 
        fontWeight: 'bold',
        fontSize: 10,
        alignSelf: 'center',
    }
});