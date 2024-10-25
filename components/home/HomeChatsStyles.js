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

    homeChatsLastMessage: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 20
    },

    homeChatsNotificationOnlineContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        marginRight: 10,
        gap: 10
    },

    homeChatsOnlineImage: {
        width: 10,
        height: 10,
    },

    homeChatsNotificationContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },

    homeChatsNotificationText: {
        color: 'white', 
        fontWeight: 'bold',
        fontSize: 10,
    }
});