import { render } from '@testing-library/react-native';
import { Asset } from '../components/Asset';
import { setAssetRegistry } from '../utils/assetRegistry';

// Suppress console warnings in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});

describe('Asset', () => {
  beforeEach(() => {
    setAssetRegistry({});
  });

  it('renders null when asset is not found', () => {
    const { queryByTestId } = render(
      <Asset name="nonexistent" testID="asset" />
    );
    expect(queryByTestId('asset')).toBeNull();
  });

  it('renders image asset correctly', () => {
    const mockAsset = { uri: 'test-image.png' };
    setAssetRegistry({
      'test-image': mockAsset,
    });

    const { getByTestId } = render(
      <Asset name="test-image" size={100} testID="asset" />
    );
    const image = getByTestId('asset');
    expect(image).toBeTruthy();
  });

  it('handles size prop as number', () => {
    const mockAsset = { uri: 'test.png' };
    setAssetRegistry({
      test: mockAsset,
    });

    const { getByTestId } = render(
      <Asset name="test" size={50} testID="asset" />
    );
    const image = getByTestId('asset');
    const style = Array.isArray(image.props.style)
      ? image.props.style[0]
      : image.props.style;
    expect(style).toMatchObject({
      width: 50,
      height: 50,
    });
  });

  it('handles size prop as object', () => {
    const mockAsset = { uri: 'test.png' };
    setAssetRegistry({
      test: mockAsset,
    });

    const { getByTestId } = render(
      <Asset name="test" size={{ width: 100, height: 200 }} testID="asset" />
    );
    const image = getByTestId('asset');
    const style = Array.isArray(image.props.style)
      ? image.props.style[0]
      : image.props.style;
    expect(style).toMatchObject({
      width: 100,
      height: 200,
    });
  });

  it('handles remote URLs', () => {
    const { getByTestId } = render(
      <Asset name="https://example.com/image.png" size={100} testID="asset" />
    );
    const image = getByTestId('asset');
    expect(image.props.source.uri).toBe('https://example.com/image.png');
  });
});
