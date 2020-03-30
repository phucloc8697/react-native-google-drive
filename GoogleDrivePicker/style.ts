import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column-reverse',
    backgroundColor: '#f2f6fa',
  },
  content: {
    flex: 1,
    backgroundColor: '#f2f6fa',
  },
  listContent: {
    paddingTop: 15,
    paddingBottom: 15,
  },
  loading: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
  },
});

export default styles;

export const headerStyle = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomColor: 'rgba(195, 210, 225, 0.32)',
    borderBottomWidth: 1,
    shadowColor: 'rgba(195, 210, 225, 0.32)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowRadius: 10,
    shadowOpacity: 1,
    elevation: 1,
  },
  backButton: {
    position: 'relative',
    top: 0,
    left: 0,
  },
  signOut: {
    fontSize: 18,
    color: '#8093a7',
  },
});

export const itemStyle = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  right: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 40,
  },
  text: {
    fontSize: 12,
  },
  divider: {
    position: 'absolute',
    height: 1,
    width: '100%',
    bottom: 0,
    backgroundColor: '#c1d1e0',
  },
});
