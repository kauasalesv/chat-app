import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  homeBottomBarContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',     
    height: 65,         
    backgroundColor: 'transparent', 
    alignItems: 'flex-start',
    justifyContent: 'center',
    position: 'absolute',        
    bottom: 0,                      
    zIndex: 1,  
  },

  homeBottomBarChatsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
    height: '90%',
    backgroundColor: 'transparent',
  },

  homeBottomBarGroupsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
    height: '90%',
    backgroundColor: 'transparent',
  },

  homeBottomBarChatsImage: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center'
  },

  homeBottomBarGroupsImage: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center'
  },

  homeBottomBarChatIcon: {
    width: 30,
    height: 30,
    marginLeft: 30,
  },

  homeBottomBarGroupIcon: {
    width: 35,
    height: 35,
    marginLeft: 50,
  },

  homeBottomBarGroupText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 20
  },

  homeBottomBarChatText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 20
  }
});
