import type { ImageStyle } from 'react-native';

export interface SvgProps {
  width?: number;
  height?: number;
  tintColor?: string;
  style?: ImageStyle;
}

export function parseSvgContent(svgContent: string): string {
  if (!svgContent || typeof svgContent !== 'string') {
    return '';
  }

  let parsed = svgContent.trim();

  if (!parsed.startsWith('<svg')) {
    return '';
  }

  return parsed;
}

export function injectSvgProps(svgContent: string, props: SvgProps): string {
  if (!svgContent) {
    return '';
  }

  let modified = svgContent;

  if (props.width) {
    modified = modified.replace(/<svg([^>]*)>/, (match, attrs) => {
      if (!attrs.includes('width=')) {
        return `<svg${attrs} width="${props.width}">`;
      }
      return match.replace(/width="[^"]*"/, `width="${props.width}"`);
    });
  }

  if (props.height) {
    modified = modified.replace(/<svg([^>]*)>/, (match, attrs) => {
      if (!attrs.includes('height=')) {
        return `<svg${attrs} height="${props.height}">`;
      }
      return match.replace(/height="[^"]*"/, `height="${props.height}"`);
    });
  }

  if (props.tintColor) {
    modified = modified.replace(/<svg([^>]*)>/, (match, attrs) => {
      if (!attrs.includes('fill=')) {
        return `<svg${attrs} fill="${props.tintColor}">`;
      }
      return match.replace(/fill="[^"]*"/g, `fill="${props.tintColor}"`);
    });
  }

  return modified;
}
