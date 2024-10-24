import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  chatBottomBarContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',     
    height: 50,         
    backgroundColor: 'transparent', 
    position: 'absolute',        
    bottom: 0,                      
    zIndex: 1,  
    alignItems: 'center',
  },

  chatBottomBarWriteMessageContainer: {
    alignItems: 'center',
    width: '80%',
    marginLeft: 20,
    backgroundColor: 'rgba(89, 107, 178, 0.41)',
    borderRadius: 16,
  },

  chatBottomBarWriteMessageInput: {
    width: '95%',
    height: '70%',
    borderRadius: 10,
    color: 'white'
  },

  chatBottomBarWriteMessageImage: {
    width: 45,
    height: 45
  }

});
