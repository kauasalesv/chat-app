import { StyleSheet, StatusBar } from 'react-native';

export default StyleSheet.create({
  chatUpBarContainer: {
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
    backgroundColor: 'rgba(89, 107, 178, 0.41)',
    borderBottomLeftRadius: 20, 
    borderBottomRightRadius: 20, 
  },

  chatUpBarReturnImage: {
    width: 30,
    height: 30,
    marginLeft: 20,
  },

  chatUpBarContact: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },

  chatUpBarUserImage: {
    width: 45,
    height: 45,
    alignSelf: 'center',
    marginLeft: 20,
  },

  chatUpBarName: {
    color: '#fff',
    fontSize: 18,
    marginRight: 'auto',
    marginLeft: 20,
  },
  
  chatUpBarMenuImage: {
    width: 35,
    height: 35,
    marginRight: 20,
  },

  chatUpBarDropdownMenu: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: '#565656',
    borderRadius: 10,
    padding: 15,
    zIndex: 10,
    gap: 20
  },
  
  chatUpBarDropdownMenuItem: {
    color: '#fff',
    fontSize: 15,
    padding: 10
  },
});
