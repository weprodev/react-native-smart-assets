import { render, fireEvent } from '@testing-library/react-native';
import { Asset } from '../components/Asset';
import { AssetPlaceholder } from '../components/AssetPlaceholder';
import { setAssetRegistry } from '../utils/assetRegistry';

const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});
afterAll(() => {
  console.warn = originalWarn;
});

// ─── AssetPlaceholder unit tests ─────────────────────────────────────────────

describe('AssetPlaceholder', () => {
  it('renders nothing for type "none"', () => {
    const { toJSON } = render(<AssetPlaceholder type="none" testID="ph" />);
    expect(toJSON()).toBeNull();
  });

  it('renders a view for type "color"', () => {
    const { getByTestId } = render(
      <AssetPlaceholder type="color" testID="ph" />
    );
    expect(getByTestId('ph')).toBeTruthy();
  });

  it('renders a view for type "shimmer"', () => {
    const { getByTestId } = render(
      <AssetPlaceholder type="shimmer" testID="ph" />
    );
    expect(getByTestId('ph')).toBeTruthy();
  });

  it('renders a view for type "blur"', () => {
    const { getByTestId } = render(
      <AssetPlaceholder type="blur" testID="ph" />
    );
    expect(getByTestId('ph')).toBeTruthy();
  });

  it('is non-interactive (pointerEvents="none")', () => {
    const { getByTestId } = render(
      <AssetPlaceholder type="shimmer" testID="ph" />
    );
    expect(getByTestId('ph').props.pointerEvents).toBe('none');
  });
});

// ─── Asset + placeholder integration tests ───────────────────────────────────

describe('Asset placeholder', () => {
  beforeEach(() => {
    setAssetRegistry({
      'images/hero': { uri: 'hero.png' },
    });
  });

  afterEach(() => {
    setAssetRegistry({});
  });

  it('does not show a placeholder by default', () => {
    const { queryByTestId } = render(
      <Asset name="images/hero" size={100} testID="asset" />
    );
    expect(queryByTestId('asset-placeholder')).toBeNull();
  });

  it('does not show a placeholder when type is "none"', () => {
    const { queryByTestId } = render(
      <Asset name="images/hero" size={100} placeholder="none" testID="asset" />
    );
    expect(queryByTestId('asset-placeholder')).toBeNull();
  });

  it('shows shimmer placeholder while the image is loading', () => {
    const { getByTestId } = render(
      <Asset
        name="images/hero"
        size={{ width: 300, height: 200 }}
        placeholder="shimmer"
        testID="asset"
      />
    );
    expect(getByTestId('asset-placeholder')).toBeTruthy();
  });

  it('shows blur placeholder while the image is loading', () => {
    const { getByTestId } = render(
      <Asset name="images/hero" size={100} placeholder="blur" testID="asset" />
    );
    expect(getByTestId('asset-placeholder')).toBeTruthy();
  });

  it('shows color placeholder while the image is loading', () => {
    const { getByTestId } = render(
      <Asset name="images/hero" size={100} placeholder="color" testID="asset" />
    );
    expect(getByTestId('asset-placeholder')).toBeTruthy();
  });

  it('hides the placeholder after the image fires onLoad', () => {
    const { getByTestId, queryByTestId } = render(
      <Asset
        name="images/hero"
        size={100}
        placeholder="shimmer"
        testID="asset"
      />
    );

    // Placeholder should be visible before load
    expect(getByTestId('asset-placeholder')).toBeTruthy();

    // Simulate the image finishing loading
    fireEvent(getByTestId('asset'), 'load');

    // Placeholder should be gone
    expect(queryByTestId('asset-placeholder')).toBeNull();
  });

  it('hides the placeholder after the image fires onError', () => {
    const { getByTestId, queryByTestId } = render(
      <Asset
        name="images/hero"
        size={100}
        placeholder="shimmer"
        testID="asset"
      />
    );

    fireEvent(getByTestId('asset'), 'error');
    expect(queryByTestId('asset-placeholder')).toBeNull();
  });

  it('resets the placeholder when the name prop changes', () => {
    setAssetRegistry({
      'images/hero': { uri: 'hero.png' },
      'images/banner': { uri: 'banner.png' },
    });

    const { getByTestId, queryByTestId, rerender } = render(
      <Asset
        name="images/hero"
        size={100}
        placeholder="shimmer"
        testID="asset"
      />
    );

    // Load first image
    fireEvent(getByTestId('asset'), 'load');
    expect(queryByTestId('asset-placeholder')).toBeNull();

    // Switch to a different asset — placeholder should reappear
    rerender(
      <Asset
        name="images/banner"
        size={100}
        placeholder="shimmer"
        testID="asset"
      />
    );
    expect(getByTestId('asset-placeholder')).toBeTruthy();
  });

  it('accepts a custom placeholderColor', () => {
    const { getByTestId } = render(
      <Asset
        name="images/hero"
        size={100}
        placeholder="color"
        placeholderColor="#FF0000"
        testID="asset"
      />
    );
    // The placeholder View should carry the custom color in its style
    const ph = getByTestId('asset-placeholder');
    const flatStyle = Array.isArray(ph.props.style)
      ? Object.assign({}, ...ph.props.style)
      : ph.props.style;
    expect(flatStyle.backgroundColor).toBe('#FF0000');
  });

  it('does not show a placeholder for a missing asset', () => {
    const { queryByTestId } = render(
      <Asset
        name="nonexistent"
        size={100}
        placeholder="shimmer"
        testID="asset"
      />
    );
    // Asset renders null when not found — no placeholder either
    expect(queryByTestId('asset')).toBeNull();
    expect(queryByTestId('asset-placeholder')).toBeNull();
  });
});
