import { Text, View, StyleSheet } from 'react-native';
import { setAssetRegistry, Asset } from '@weprodev/react-native-smart-assets';
import * as Assets from '../assets';
import type { AssetName } from '../assets';

setAssetRegistry(Assets.ASSETS, Assets.ASSET_METADATA);

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Smart Assets Example</Text>
      <Asset<AssetName>
        name="support"
        size={48}
        style={{ backgroundColor: 'red' }}
      />
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
