import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  chatMessagesContainer: {
    flex: 1,
    marginTop: 100,
    marginBottom: 50,
    paddingHorizontal: 20,  
  },

  chatMessagesOtherMessage: {
    maxWidth: 300,  
    backgroundColor: '#565656',
    marginTop: 5,
    borderRadius: 10,
    padding: 10, 
    alignSelf: 'flex-start',
  },

  chatMessagesMyMessage: {
    maxWidth: 300, 
    backgroundColor: '#596BA2',
    marginTop: 5,
    borderRadius: 10,
    padding: 10, 
    alignSelf: 'flex-end',  
  },

  chatMessagesMessageText: {
    color: '#fff',  
    fontSize: 16,
  },

  chatMessagesDateText: {
    color: '#fff',  
    fontSize: 16,
    alignSelf: 'center',
    marginTop: 10
  },

  chatMessagesTimestamp: {
    color: '#373737',  
    fontSize: 10,
  }
});
