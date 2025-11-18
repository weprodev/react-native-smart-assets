import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ImageStyle } from 'react-native';
import type { ComponentType, ReactElement } from 'react';
import type { AssetSource } from '../types';

interface SvgIconProps {
  source: AssetSource;
  width?: number;
  height?: number;
  tintColor?: string;
  color?: string;
  style?: ImageStyle;
  testID?: string;
}

function isSvgComponent(source: AssetSource): source is ComponentType<{
  width?: number;
  height?: number;
  fill?: string;
  color?: string;
}> {
  return typeof source === 'function';
}

function getSvgComponent(source: AssetSource): ComponentType<{
  width?: number;
  height?: number;
  fill?: string;
  color?: string;
}> | null {
  if (isSvgComponent(source)) {
    return source;
  }

  if (
    typeof source === 'object' &&
    source !== null &&
    'default' in source &&
    typeof (source as { default: unknown }).default === 'function'
  ) {
    return (
      source as {
        default: ComponentType<{
          width?: number;
          height?: number;
          fill?: string;
          color?: string;
        }>;
      }
    ).default;
  }

  return null;
}

function applyFillToChildren(
  element: ReactElement,
  fillColor: string
): ReactElement {
  if (!React.isValidElement(element)) {
    return element;
  }

  const elementProps = element.props as {
    children?: unknown;
    fill?: string;
    [key: string]: unknown;
  };

  const processedChildren = elementProps.children
    ? React.Children.map(elementProps.children, (child) => {
        if (React.isValidElement(child)) {
          return applyFillToChildren(child, fillColor);
        }
        return child;
      })
    : undefined;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { fill: _oldFill, children: _oldChildren, ...restProps } = elementProps;

  const newProps = {
    ...restProps,
    fill: fillColor,
    ...(processedChildren && { children: processedChildren }),
  };

  return React.cloneElement(element, newProps as Partial<unknown>);
}

export function SvgIcon({
  source,
  width,
  height,
  tintColor,
  color,
  style,
  testID,
}: SvgIconProps): React.ReactElement | null {
  const SvgComponent = getSvgComponent(source);

  if (!SvgComponent) {
    if (__DEV__) {
      console.warn('SvgIcon: source is not a valid SVG component', source);
    }
    return null;
  }

  const size = width || height || 24;
  const svgColor = color || tintColor;

  const svgElement = svgColor ? (
    <SvgComponent
      width={width || size}
      height={height || size}
      fill={svgColor}
      color={svgColor}
    />
  ) : (
    <SvgComponent width={width || size} height={height || size} />
  );

  const coloredSvg = svgColor
    ? applyFillToChildren(svgElement, svgColor)
    : svgElement;

  return (
    <View
      style={[
        styles.container,
        { width: width || size, height: height || size },
        style,
      ]}
      testID={testID}
    >
      {coloredSvg}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
