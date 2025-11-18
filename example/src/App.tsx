import { Text, View, StyleSheet } from 'react-native';
import { setAssetRegistry } from 'react-native-smart-assets';
import * as Assets from '../assets';

setAssetRegistry(Assets.ASSETS);
import { Asset } from 'react-native-smart-assets';
import type { AssetName } from '../assets';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Smart Assets Example</Text>
      <Asset<AssetName> name="adaptive-icon" size={48} />
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
