import { type ReactNode, Children, isValidElement } from 'react';

export interface TocEntry {
  level: number;
  text: string;
  id: string;
}

/** Recursively extract plain text from React children. */
export function extractTextFromNode(children: ReactNode): string {
  let text = '';

  Children.forEach(children, (child) => {
    if (typeof child === 'string') {
      text += child;
    } else if (typeof child === 'number') {
      text += String(child);
    } else if (isValidElement<{ children?: ReactNode }>(child) && child.props?.children) {
      text += extractTextFromNode(child.props.children);
    }
  });

  return text;
}

/** Generate a URL-safe heading ID from text. */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Parse headings from raw markdown content (h1–h4). */
export function parseHeadingsFromMarkdown(content: string): TocEntry[] {
  const headings: TocEntry[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[*_`~\[\]]/g, '').trim();
      headings.push({ level, text, id: generateHeadingId(text) });
    }
  }

  return headings;
}
