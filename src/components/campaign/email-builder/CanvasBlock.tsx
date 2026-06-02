import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Check, X, Plus, GripVertical, AlignLeft, AlignCenter, AlignRight, Bold, Italic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textArea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BlockData, BlockContent, BlockStyles, SocialLink } from "./types";
import { SOCIAL_PLATFORMS } from "./types";

interface CanvasBlockProps {
  block: BlockData;
  onUpdate: (content: Partial<BlockContent>) => void;
  onUpdateStyles: (styles: Partial<BlockStyles>) => void;
  onRemove: () => void;
  globalStyles: { fontFamily: string; fontSize: string; textColor: string; headingColor: string; linkColor: string };
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}

export default function CanvasBlock({
  block,
  onUpdate,
  onUpdateStyles,
  onRemove,
  globalStyles,
  isEditing,
  onStartEdit,
  onStopEdit,
}: CanvasBlockProps) {
  const [draft, setDraft] = useState<Partial<BlockContent>>({});
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const startEdit = () => {
    setDraft({ ...block.content });
    onStartEdit();
  };

  const saveEdit = () => {
    onUpdate(draft);
    onStopEdit();
    setDraft({});
  };

  const cancelEdit = () => {
    onStopEdit();
    setDraft({});
  };

  const updateDraft = (changes: Partial<BlockContent>) => {
    setDraft((prev) => ({ ...prev, ...changes }));
  };

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: "relative" as const,
  };

  // Build a live preview block from draft content + current styles
  const previewBlock: BlockData = isEditing
    ? { ...block, content: { ...block.content, ...draft } }
    : block;

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={sortableStyle} className="border border-primary/30 rounded bg-background shadow-lg">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/60 border-b">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Edit {BLOCK_LABELS[block.type]}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              title="Delete block"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-green-600" onClick={saveEdit} title="Save">
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={cancelEdit} title="Close">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Live preview */}
        <div className="border-b p-2 bg-white">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">Preview</p>
          <BlockPreview block={previewBlock} globalStyles={globalStyles} />
        </div>

        <div className="p-3 space-y-3">
          <BlockEditor type={block.type} draft={draft} onChange={updateDraft} />

          {/* Common style controls for all blocks */}
          <div className="border-t pt-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Style</p>

            {/* Alignment */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground w-14 shrink-0">Align</span>
              {(["left", "center", "right"] as const).map((a) => (
                <Button
                  key={a}
                  variant={block.styles.textAlign === a ? "default" : "outline"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onUpdateStyles({ textAlign: a })}
                >
                  {a === "left" && <AlignLeft className="h-3.5 w-3.5" />}
                  {a === "center" && <AlignCenter className="h-3.5 w-3.5" />}
                  {a === "right" && <AlignRight className="h-3.5 w-3.5" />}
                </Button>
              ))}
            </div>

            {/* Font Size + Bold + Italic — for blocks with text */}
            {["text", "heading", "button", "image-text", "logo"].includes(block.type) && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-14 shrink-0">Font</span>
                <Input
                  className="h-7 text-[10px] w-16 shrink-0"
                  value={block.styles.fontSize || ""}
                  onChange={(e) => onUpdateStyles({ fontSize: e.target.value })}
                  placeholder="14px"
                />
                <Button
                  variant={block.styles.fontWeight === "bold" ? "default" : "outline"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onUpdateStyles({ fontWeight: block.styles.fontWeight === "bold" ? "" : "bold" })}
                  title="Bold"
                >
                  <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={block.styles.fontStyle === "italic" ? "default" : "outline"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onUpdateStyles({ fontStyle: block.styles.fontStyle === "italic" ? "" : "italic" })}
                  title="Italic"
                >
                  <Italic className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Text Color — for blocks with text */}
            {["text", "heading", "button", "image-text", "logo"].includes(block.type) && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-14 shrink-0">Text</span>
                <input
                  type="color"
                  value={block.styles.color || globalStyles.textColor}
                  onChange={(e) => onUpdateStyles({ color: e.target.value })}
                  className="w-6 h-6 rounded border cursor-pointer"
                />
                <Input
                  className="h-7 text-[10px] flex-1"
                  value={block.styles.color || ""}
                  onChange={(e) => onUpdateStyles({ color: e.target.value })}
                  placeholder="inherit"
                />
                {block.styles.color && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUpdateStyles({ color: "" })} title="Clear">
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}

            {/* Background Color */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-14 shrink-0">BG Color</span>
              <input
                type="color"
                value={block.styles.backgroundColor || "#ffffff"}
                onChange={(e) => onUpdateStyles({ backgroundColor: e.target.value === "#ffffff" ? "" : e.target.value })}
                className="w-6 h-6 rounded border cursor-pointer"
              />
              <Input
                className="h-7 text-[10px] flex-1"
                value={block.styles.backgroundColor || ""}
                onChange={(e) => onUpdateStyles({ backgroundColor: e.target.value })}
                placeholder="transparent"
              />
              {block.styles.backgroundColor && (
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUpdateStyles({ backgroundColor: "" })} title="Clear">
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Padding */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-14 shrink-0">Padding</span>
              <input
                type="range"
                min={0}
                max={40}
                value={parseInt(block.styles.padding || "0") || 0}
                onChange={(e) => onUpdateStyles({ padding: `${e.target.value}px` })}
                className="flex-1 h-1.5 accent-primary cursor-pointer"
              />
              <span className="text-[10px] text-muted-foreground w-8 text-right">{parseInt(block.styles.padding || "0") || 0}px</span>
            </div>

            {/* Border */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-14 shrink-0">Border</span>
              <input
                type="range"
                min={0}
                max={5}
                value={parseInt(block.styles.border || "0") || 0}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onUpdateStyles({ border: v > 0 ? `${v}px` : "" });
                }}
                className="flex-1 h-1.5 accent-primary cursor-pointer"
              />
              <input
                type="color"
                value={block.styles.borderColor || "#dddddd"}
                onChange={(e) => onUpdateStyles({ borderColor: e.target.value })}
                className="w-6 h-6 rounded border cursor-pointer shrink-0"
              />
            </div>

            {/* Border Radius */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-14 shrink-0">Corners</span>
              <input
                type="range"
                min={0}
                max={24}
                value={parseInt(block.styles.borderRadius || "0") || 0}
                onChange={(e) => onUpdateStyles({ borderRadius: `${e.target.value}px` })}
                className="flex-1 h-1.5 accent-primary cursor-pointer"
              />
              <span className="text-[10px] text-muted-foreground w-8 text-right">{parseInt(block.styles.borderRadius || "0") || 0}px</span>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Preview mode — click to edit, hover shows drag handle
  return (
    <div ref={setNodeRef} style={sortableStyle} className="relative group cursor-pointer" onClick={startEdit}>
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-muted rounded p-0.5 shadow-sm cursor-grab active:cursor-grabbing">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <BlockPreview block={block} globalStyles={globalStyles} />
    </div>
  );
}

// ─── Labels ─────────────────────────────────────────

const BLOCK_LABELS: Record<string, string> = {
  text: "Text",
  heading: "Heading",
  logo: "Logo",
  image: "Image",
  "image-text": "Image + Text",
  button: "Button",
  video: "Video",
  divider: "Divider",
  spacer: "Spacer",
  social: "Social Links",
  code: "HTML Code",
};

// ─── Preview Renderers ──────────────────────────────

function BlockPreview({ block, globalStyles }: { block: BlockData; globalStyles: CanvasBlockProps["globalStyles"] }) {
  const align = block.styles.textAlign || "left";
  const pad = block.styles.padding || "0";
  const bg = block.styles.backgroundColor || "transparent";
  const color = block.styles.color || globalStyles.textColor;
  const fontSize = block.styles.fontSize || globalStyles.fontSize;
  const fontFamily = globalStyles.fontFamily;

  const borderWidth = parseInt(block.styles.border || "0") || 0;
  const borderColor = block.styles.borderColor || "#dddddd";
  const borderRadius = parseInt(block.styles.borderRadius || "0") || 0;

  const style: React.CSSProperties = {
    textAlign: align,
    padding: pad === "0" ? undefined : pad,
    backgroundColor: bg === "transparent" ? undefined : bg,
    color,
    fontSize,
    fontFamily,
    fontWeight: block.styles.fontWeight || undefined,
    fontStyle: block.styles.fontStyle || undefined,
    borderRadius: borderRadius > 0 ? borderRadius : undefined,
    border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined,
    overflow: borderRadius > 0 ? "hidden" : undefined,
  };

  switch (block.type) {
    case "text":
      return (
        <div style={style}>
          <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {block.content.text || "\u00A0"}
          </p>
        </div>
      );

    case "heading": {
      const level = block.content.level || 2;
      const sizes: Record<number, string> = { 1: "28px", 2: "24px", 3: "20px", 4: "18px", 5: "16px", 6: "14px" };
      return (
        <div style={style}>
          <div style={{ margin: 0, fontSize: sizes[level], fontWeight: 700, color: globalStyles.headingColor, lineHeight: 1.3 }}>
            {block.content.text || "Heading"}
          </div>
        </div>
      );
    }

    case "logo":
      return (
        <div style={{ ...style, textAlign: align }}>
          {block.content.src ? (
            <img src={block.content.src} alt={block.content.alt || "Logo"} style={{ maxHeight: 60, height: "auto", display: "inline-block" }} />
          ) : (
            <div style={{ border: "2px dashed #ddd", borderRadius: 6, padding: "12px 20px", textAlign: "center", color: "#999", fontSize: 12, display: "inline-block" }}>
              Logo
            </div>
          )}
        </div>
      );

    case "image":
      return (
        <div style={style}>
          {block.content.src ? (
            <img src={block.content.src} alt={block.content.alt || ""} style={{ maxWidth: "100%", height: "auto", display: "inline-block" }} />
          ) : (
            <div style={{ border: "2px dashed #ddd", borderRadius: 6, padding: "30px 10px", textAlign: "center", color: "#999", fontSize: 12 }}>
              No image set
            </div>
          )}
        </div>
      );

    case "image-text": {
      const pos = block.content.imagePosition || "left";
      const imgEl = block.content.src ? (
        <img src={block.content.src} alt={block.content.alt || ""} style={{ maxWidth: "100%", height: "auto" }} />
      ) : (
        <div style={{ border: "2px dashed #ddd", borderRadius: 6, padding: "20px 10px", textAlign: "center", color: "#999", fontSize: 12, minHeight: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          Image
        </div>
      );
      const textEl = <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{block.content.text || "\u00A0"}</p>;
      if (pos === "center") {
        return (
          <div style={{ ...style, textAlign: "center" }}>
            <div style={{ marginBottom: 8 }}>{imgEl}</div>
            {textEl}
          </div>
        );
      }
      const imgLeft = pos === "left";
      return (
        <div style={{ ...style, display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>{imgLeft ? imgEl : textEl}</div>
          <div style={{ flex: 1 }}>{imgLeft ? textEl : imgEl}</div>
        </div>
      );
    }

    case "button": {
      const shapeRadius = { square: 0, round: 6, pill: 999 }[block.content.buttonShape || "round"];
      return (
        <div style={style}>
          <a
            href={block.content.href || "#"}
            onClick={(e) => e.preventDefault()}
            style={{
              display: "inline-block",
              backgroundColor: block.content.buttonColor || "#1a73e8",
              color: block.content.buttonTextColor || "#ffffff",
              fontWeight: 600,
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: shapeRadius,
              fontSize: 13,
              fontFamily,
            }}
          >
            {block.content.text || "Button"}
          </a>
        </div>
      );
    }

    case "video":
      return (
        <div style={{ ...style, textAlign: "center" }}>
          {block.content.videoUrl ? (
            <a href={block.content.videoUrl} onClick={(e) => e.preventDefault()} style={{ display: "inline-block", position: "relative" }}>
              {block.content.videoThumbnail ? (
                <img src={block.content.videoThumbnail} alt="Video" style={{ maxWidth: "100%", height: "auto", display: "block" }} />
              ) : (
                <div style={{ width: "100%", minHeight: 200, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 0, height: 0, borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderLeft: "20px solid #333", marginLeft: 4 }} />
                  </div>
                </div>
              )}
            </a>
          ) : (
            <div style={{ border: "2px dashed #ddd", borderRadius: 6, padding: "30px 10px", textAlign: "center", color: "#999", fontSize: 12 }}>
              No video set
            </div>
          )}
        </div>
      );

    case "divider": {
      const thickness = block.content.dividerThickness || 1;
      const divColor = block.content.dividerColor || "#dddddd";
      return (
        <div style={{ ...style, padding: `${pad} ${pad}` }}>
          <hr style={{ border: 0, borderTop: `${thickness}px solid ${divColor}`, margin: 0 }} />
        </div>
      );
    }

    case "spacer": {
      const height = block.content.spacerHeight || 30;
      return <div style={{ height }} />;
    }

    case "social": {
      const links = block.content.socialLinks || [];
      if (links.length === 0) {
        return (
          <div style={{ ...style, textAlign: "center", color: "#999", fontSize: 12 }}>
            No social links — click to add
          </div>
        );
      }
      return (
        <div style={{ ...style, textAlign: "center" }}>
          {links.map((link, i) => (
            <a
              key={i}
              href={link.url || "#"}
              onClick={(e) => e.preventDefault()}
              style={{
                display: "inline-block",
                margin: "0 8px",
                color: globalStyles.linkColor,
                textDecoration: "none",
                fontSize: 13,
                fontFamily,
              }}
            >
              {link.platform}
            </a>
          ))}
        </div>
      );
    }

    case "code":
      return (
        <div style={style}>
          {block.content.html ? (
            <div dangerouslySetInnerHTML={{ __html: block.content.html }} />
          ) : (
            <div style={{ color: "#999", fontSize: 12, textAlign: "center", padding: 10 }}>
              Empty HTML block — click to edit
            </div>
          )}
        </div>
      );

    default:
      return <div style={style}>Unknown block</div>;
  }
}

// ─── Edit Forms ─────────────────────────────────────

function BlockEditor({ type, draft, onChange }: { type: BlockType; draft: Partial<BlockContent>; onChange: (c: Partial<BlockContent>) => void }) {
  switch (type) {
    case "text":
      return (
        <div className="space-y-2">
          <Label className="text-xs">Text Content</Label>
          <Textarea
            value={draft.text || ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Type your text here..."
            rows={4}
            className="text-sm"
          />
        </div>
      );

    case "heading":
      return (
        <div className="space-y-2">
          <Label className="text-xs">Heading Text</Label>
          <div className="flex gap-2 items-center">
            <Select
              value={String(draft.level || 2)}
              onValueChange={(v) => onChange({ level: Number(v) as 1 | 2 | 3 | 4 | 5 | 6 })}
            >
              <SelectTrigger className="h-9 text-xs w-20 shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((l) => <SelectItem key={l} value={String(l)}>H{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={draft.text || ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Heading" className="h-9 text-sm flex-1" />
          </div>
        </div>
      );

    case "logo":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Logo URL</Label>
            <Input value={draft.src || ""} onChange={(e) => onChange({ src: e.target.value })} placeholder="https://example.com/logo.png" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Link URL</Label>
            <Input value={draft.href || ""} onChange={(e) => onChange({ href: e.target.value })} placeholder="https://yoursite.com" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Alt Text</Label>
            <Input value={draft.alt || ""} onChange={(e) => onChange({ alt: e.target.value })} placeholder="Company Name" className="h-8 text-xs" />
          </div>
          {draft.src && <img src={draft.src} alt={draft.alt || ""} className="max-h-16 object-contain mt-1" />}
        </div>
      );

    case "image":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Image URL</Label>
            <Input value={draft.src || ""} onChange={(e) => onChange({ src: e.target.value })} placeholder="https://example.com/image.jpg" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Alt Text</Label>
            <Input value={draft.alt || ""} onChange={(e) => onChange({ alt: e.target.value })} placeholder="Image description" className="h-8 text-xs" />
          </div>
          {draft.src && <img src={draft.src} alt={draft.alt || ""} className="max-w-full h-auto rounded mt-1 max-h-32 object-contain" />}
        </div>
      );

    case "image-text":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Layout</Label>
            <Select value={draft.imagePosition || "left"} onValueChange={(v) => onChange({ imagePosition: v as "left" | "right" | "center" })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Image Left</SelectItem>
                <SelectItem value="right">Image Right</SelectItem>
                <SelectItem value="center">Image Top, Text Below</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Image URL</Label>
            <Input value={draft.src || ""} onChange={(e) => onChange({ src: e.target.value })} placeholder="https://example.com/image.jpg" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Alt Text</Label>
            <Input value={draft.alt || ""} onChange={(e) => onChange({ alt: e.target.value })} placeholder="Image description" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Text Content</Label>
            <Textarea value={draft.text || ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Your text here..." rows={3} className="text-sm" />
          </div>
        </div>
      );

    case "button":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Button Text</Label>
            <Input value={draft.text || ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Click Here" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Link URL</Label>
            <Input value={draft.href || ""} onChange={(e) => onChange({ href: e.target.value })} placeholder="https://example.com" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Shape</Label>
            <div className="flex gap-1.5">
              {(["square", "round", "pill"] as const).map((s) => (
                <button
                  key={s}
                  className={`flex-1 text-[10px] py-1.5 rounded border transition-colors ${
                    (draft.buttonShape || "round") === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/30"
                  }`}
                  onClick={() => onChange({ buttonShape: s })}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Button Color</Label>
              <div className="flex gap-1">
                <input type="color" value={draft.buttonColor || "#1a73e8"} onChange={(e) => onChange({ buttonColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                <Input className="h-8 text-xs flex-1" value={draft.buttonColor || "#1a73e8"} onChange={(e) => onChange({ buttonColor: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Text Color</Label>
              <div className="flex gap-1">
                <input type="color" value={draft.buttonTextColor || "#ffffff"} onChange={(e) => onChange({ buttonTextColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                <Input className="h-8 text-xs flex-1" value={draft.buttonTextColor || "#ffffff"} onChange={(e) => onChange({ buttonTextColor: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
      );

    case "video":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Video URL</Label>
            <Input value={draft.videoUrl || ""} onChange={(e) => onChange({ videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." className="h-8 text-xs" />
            <p className="text-[10px] text-muted-foreground mt-0.5">YouTube or Vimeo link</p>
          </div>
          <div>
            <Label className="text-xs">Thumbnail URL (optional)</Label>
            <Input value={draft.videoThumbnail || ""} onChange={(e) => onChange({ videoThumbnail: e.target.value })} placeholder="https://img.youtube.com/vi/.../0.jpg" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Link URL</Label>
            <Input value={draft.href || ""} onChange={(e) => onChange({ href: e.target.value })} placeholder="https://youtube.com/watch?v=..." className="h-8 text-xs" />
            <p className="text-[10px] text-muted-foreground mt-0.5">Where to go when clicked</p>
          </div>
        </div>
      );

    case "divider":
      return (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">Thickness</Label>
              <span className="text-[11px] text-muted-foreground">{draft.dividerThickness || 1}px</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={draft.dividerThickness || 1}
              onChange={(e) => onChange({ dividerThickness: Number(e.target.value) })}
              className="w-full h-1.5 accent-primary cursor-pointer"
            />
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <div className="flex gap-1.5 mt-1">
              <input
                type="color"
                value={draft.dividerColor || "#dddddd"}
                onChange={(e) => onChange({ dividerColor: e.target.value })}
                className="w-8 h-8 rounded border cursor-pointer"
              />
              <Input className="h-8 text-xs flex-1" value={draft.dividerColor || "#dddddd"} onChange={(e) => onChange({ dividerColor: e.target.value })} />
            </div>
          </div>
          {/* Live preview */}
          <hr style={{ border: 0, borderTop: `${draft.dividerThickness || 1}px solid ${draft.dividerColor || "#dddddd"}`, margin: "4px 0" }} />
        </div>
      );

    case "spacer":
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs">Height</Label>
            <span className="text-[11px] text-muted-foreground">{draft.spacerHeight || 30}px</span>
          </div>
          <input
            type="range"
            min={5}
            max={120}
            value={draft.spacerHeight || 30}
            onChange={(e) => onChange({ spacerHeight: Number(e.target.value) })}
            className="w-full h-1.5 accent-primary cursor-pointer"
          />
          {/* Live preview */}
          <div className="border border-dashed border-muted-foreground/20 rounded" style={{ height: draft.spacerHeight || 30 }} />
        </div>
      );

    case "social":
      return <SocialEditor links={draft.socialLinks || []} onChange={(socialLinks) => onChange({ socialLinks })} />;

    case "code":
      return (
        <div className="space-y-2">
          <Label className="text-xs">Custom HTML</Label>
          <Textarea value={draft.html || ""} onChange={(e) => onChange({ html: e.target.value })} placeholder="<table>...</table>" rows={8} className="font-mono text-xs" spellCheck={false} />
        </div>
      );

    default:
      return null;
  }
}

// ─── Social Editor with Custom Links ────────────────

function SocialEditor({ links, onChange }: { links: SocialLink[]; onChange: (links: SocialLink[]) => void }) {
  const addLink = () => {
    onChange([...links, { platform: "", url: "" }]);
  };

  const updateLink = (idx: number, changes: Partial<SocialLink>) => {
    const updated = links.map((l, i) => (i === idx ? { ...l, ...changes } : l));
    onChange(updated);
  };

  const removeLink = (idx: number) => {
    onChange(links.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Social Links</Label>
      {links.map((link, idx) => (
        <div key={idx} className="flex gap-1.5 items-end">
          <div className="flex-1">
            {idx === 0 && <Label className="text-[10px] text-muted-foreground">Platform</Label>}
            <Select value={link.platform || "__custom"} onValueChange={(v) => updateLink(idx, { platform: v === "__custom" ? "" : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {SOCIAL_PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                <SelectItem value="__custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(link.platform === "" || !SOCIAL_PLATFORMS.some((p) => p.value === link.platform)) && (
            <div className="w-24">
              {idx === 0 && <Label className="text-[10px] text-muted-foreground">Name</Label>}
              <Input value={link.platform} onChange={(e) => updateLink(idx, { platform: e.target.value })} placeholder="Name" className="h-8 text-xs" />
            </div>
          )}
          <div className="flex-1">
            {idx === 0 && <Label className="text-[10px] text-muted-foreground">URL</Label>}
            <Input value={link.url} onChange={(e) => updateLink(idx, { url: e.target.value })} placeholder="https://..." className="h-8 text-xs" />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => removeLink(idx)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full text-xs" onClick={addLink}>
        <Plus className="h-3 w-3 mr-1" />
        Add Social Link
      </Button>
    </div>
  );
}
