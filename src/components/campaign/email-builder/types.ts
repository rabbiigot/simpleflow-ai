// ─── Block Types ────────────────────────────────────

export type BlockType =
  | "text"
  | "heading"
  | "logo"
  | "image"
  | "image-text"
  | "button"
  | "video"
  | "divider"
  | "spacer"
  | "social"
  | "code";

export interface BlockData {
  id: string;
  type: BlockType;
  content: BlockContent;
  styles: BlockStyles;
}

export interface BlockContent {
  html?: string;
  text?: string;
  src?: string;
  alt?: string;
  href?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  buttonColor?: string;
  buttonTextColor?: string;
  imagePosition?: "left" | "right" | "center";
  socialLinks?: SocialLink[];
  dividerColor?: string;
  dividerThickness?: number;
  spacerHeight?: number;
  buttonShape?: "square" | "round" | "pill";
  videoUrl?: string;
  videoThumbnail?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface BlockStyles {
  textAlign?: "left" | "center" | "right";
  backgroundColor?: string;
  padding?: string;
  fontSize?: string;
  color?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  borderRadius?: string;
  width?: string;
  border?: string;
  borderColor?: string;
}

// ─── Row / Column Layout ────────────────────────────

export type ColumnCount = 1 | 2 | 3 | 4;

export interface SectionRow {
  id: string;
  columns: ColumnCount;
  blocks: BlockData[]; // length matches columns (empty slots filled with null-like empty block)
}

// ─── Section Types ──────────────────────────────────

export interface EmailSection {
  id: string;
  label: string;
  columns: ColumnCount;
  rows: SectionRow[];
  styles: SectionStyles;
}

export interface SectionStyles {
  backgroundColor?: string;
  padding?: string;
  borderBottom?: string;
}

// ─── Global Styles ──────────────────────────────────

export interface GlobalStyles {
  backgroundColor: string;
  contentWidth: string;
  fontFamily: string;
  fontSize: string;
  textColor: string;
  linkColor: string;
  headingColor: string;
}

// ─── Template Data ──────────────────────────────────

export interface TemplateBuilderData {
  name: string;
  subject: string;
  preheader: string;
  sections: EmailSection[];
  globalStyles: GlobalStyles;
}

export const DEFAULT_GLOBAL_STYLES: GlobalStyles = {
  backgroundColor: "#f0f0f0",
  contentWidth: "600px",
  fontFamily: "Arial, sans-serif",
  fontSize: "14px",
  textColor: "#333333",
  linkColor: "#1a73e8",
  headingColor: "#111111",
};

export const DEFAULT_SECTIONS: EmailSection[] = [
  {
    id: "header",
    label: "Header",
    columns: 1,
    rows: [],
    styles: { backgroundColor: "transparent", padding: "20px" },
  },
  {
    id: "body",
    label: "Body",
    columns: 1,
    rows: [],
    styles: { backgroundColor: "transparent", padding: "20px" },
  },
  {
    id: "footer",
    label: "Footer",
    columns: 1,
    rows: [],
    styles: { backgroundColor: "transparent", padding: "20px" },
  },
];

// ─── Block Definitions for Palette ──────────────────

export interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  { type: "text", label: "Text", description: "Text content", icon: "Type" },
  { type: "heading", label: "Heading", description: "H1-H6 heading", icon: "Heading" },
  { type: "logo", label: "Logo", description: "Logo image", icon: "Crown" },
  { type: "image", label: "Image", description: "Single image", icon: "Image" },
  { type: "image-text", label: "Image + Text", description: "Split layout", icon: "Columns2" },
  { type: "button", label: "Button", description: "CTA button", icon: "MousePointerClick" },
  { type: "video", label: "Video", description: "Video embed", icon: "Play" },
  { type: "divider", label: "Divider", description: "Horizontal line", icon: "Minus" },
  { type: "spacer", label: "Spacer", description: "Vertical space", icon: "MoveVertical" },
  { type: "social", label: "Social", description: "Social media links", icon: "Share2" },
  { type: "code", label: "Code", description: "Custom HTML", icon: "Code" },
];

export const SOCIAL_PLATFORMS = [
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "X (Twitter)" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "pinterest", label: "Pinterest" },
  { value: "github", label: "GitHub" },
  { value: "website", label: "Website" },
];

export function createBlock(type: BlockType): BlockData {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const defaults: Record<BlockType, Partial<BlockContent>> = {
    text: { text: "Your text here..." },
    heading: { text: "Heading", level: 2 },
    logo: { src: "", alt: "Logo", href: "" },
    image: { src: "", alt: "Image" },
    "image-text": { src: "", alt: "Image", text: "Your text here...", imagePosition: "left" },
    button: { text: "Click Here", href: "#", buttonColor: "#1a73e8", buttonTextColor: "#ffffff", buttonShape: "round" },
    video: { videoUrl: "", videoThumbnail: "", href: "" },
    divider: { dividerColor: "#dddddd", dividerThickness: 1 },
    spacer: { spacerHeight: 30 },
    social: { socialLinks: [] },
    code: { html: "" },
  };

  return {
    id,
    type,
    content: defaults[type] as BlockContent,
    styles: {
      textAlign: type === "button" || type === "social" ? "center" : "left",
      padding: "0",
    },
  };
}


export function createSection(label: string): EmailSection {
  const id = `section-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    label,
    columns: 1,
    rows: [],
    styles: { backgroundColor: "transparent", padding: "20px" },
  };
}

/** Redistribute flat blocks into rows based on column count */
export function redistributeBlocks(section: EmailSection, newColumns: ColumnCount): SectionRow[] {
  const allBlocks = section.rows.flatMap((r) => r.blocks);
  const rows: SectionRow[] = [];
  for (let i = 0; i < allBlocks.length; i += newColumns) {
    const chunk = allBlocks.slice(i, i + newColumns);
    rows.push(createRow(newColumns, chunk));
  }
  return rows;
}

export function createRow(columns: ColumnCount = 1, blocks: BlockData[] = []): SectionRow {
  const id = `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return { id, columns, blocks };
}
