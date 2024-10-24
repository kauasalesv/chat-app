import { StyleSheet, StatusBar } from 'react-native';

export default StyleSheet.create({
  homeUpBarContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',     
    height: 100,         
    backgroundColor: '#373737', 
    alignItems: 'center',
    position: 'absolute',        
    top: 0,                      
    zIndex: 1,                   
    paddingTop: StatusBar.currentHeight || 0, 
  },

  homeUpBarSearchContainer: {
    backgroundColor: 'rgba(89, 107, 178, 0.41)',
    display: 'flex',
    flexDirection: 'row',
    width: '60%',
    marginLeft: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 35,
  },

  homeUpBarSearchInput: {
    width: '80%',
    backgroundColor: 'transparent',
    color: 'white',
  },

  homeUpBarUserImage: {
    width: 45,
    height: 45,
    alignSelf: 'center',
    marginRight: 'auto',
    marginLeft: 20,
  },

  homeUpBarSearchImage: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  
  homeUpBarMenuImage: {
    width: 35,
    height: 35,
    marginLeft: 30,
  },

  homeUpBarDropdownMenu: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: '#565656',
    borderRadius: 10,
    padding: 10,
    zIndex: 10,
    gap: 20
  },

  homeUpBarDropdownMenuItem: {
    color: '#fff',
    fontSize: 14,
    padding: 10
  },
});
