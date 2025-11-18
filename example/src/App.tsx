import { Text, View, StyleSheet } from 'react-native';
import { Asset } from 'react-native-smart-assets';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Smart Assets Example</Text>
      <Asset name="icon" size={48} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
