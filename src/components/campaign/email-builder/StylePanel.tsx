import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GlobalStyles, EmailSection } from "./types";

interface StylePanelProps {
  globalStyles: GlobalStyles;
  onGlobalStylesChange: (styles: GlobalStyles) => void;
  sections: EmailSection[];
  onSectionStyleChange: (sectionId: string, key: string, value: string) => void;
}

const FONT_OPTIONS = [
  "Arial, sans-serif",
  "Helvetica, sans-serif",
  "Georgia, serif",
  "Times New Roman, serif",
  "Verdana, sans-serif",
  "Courier New, monospace",
  "Trebuchet MS, sans-serif",
  "Tahoma, sans-serif",
];

export default function StylePanel({
  globalStyles,
  onGlobalStylesChange,
  sections,
  onSectionStyleChange,
}: StylePanelProps) {
  return (
    <div className="space-y-4">
      {/* Section Styles */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          Section Styles
        </h4>
        {sections.map((section) => (
          <div key={section.id} className="space-y-1.5 border-b pb-2">
            <p className="text-xs font-medium">{section.label}</p>
            <div className="flex gap-1.5 items-center">
              <Label className="text-[10px] w-12 shrink-0">BG</Label>
              <input
                type="color"
                value={section.styles.backgroundColor || "#ffffff"}
                onChange={(e) => onSectionStyleChange(section.id, "backgroundColor", e.target.value)}
                className="w-6 h-6 rounded border cursor-pointer"
              />
              <Input
                className="h-7 text-[11px] flex-1"
                value={section.styles.backgroundColor || ""}
                onChange={(e) => onSectionStyleChange(section.id, "backgroundColor", e.target.value)}
              />
            </div>
            <div className="flex gap-1.5 items-center">
              <Label className="text-[10px] w-12 shrink-0">Padding</Label>
              <Input
                className="h-7 text-[11px] flex-1"
                value={section.styles.padding || "20px"}
                onChange={(e) => onSectionStyleChange(section.id, "padding", e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Global Styles */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          Global Styles
        </h4>

        <div>
          <Label className="text-xs">Page Background</Label>
          <div className="flex gap-1.5">
            <input type="color" value={globalStyles.backgroundColor} onChange={(e) => onGlobalStylesChange({ ...globalStyles, backgroundColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
            <Input className="h-8 text-xs flex-1" value={globalStyles.backgroundColor} onChange={(e) => onGlobalStylesChange({ ...globalStyles, backgroundColor: e.target.value })} />
          </div>
        </div>

        <div>
          <Label className="text-xs">Content Width</Label>
          <Input className="h-8 text-xs" value={globalStyles.contentWidth} onChange={(e) => onGlobalStylesChange({ ...globalStyles, contentWidth: e.target.value })} />
        </div>

        <div>
          <Label className="text-xs">Font Family</Label>
          <Select value={globalStyles.fontFamily} onValueChange={(v) => onGlobalStylesChange({ ...globalStyles, fontFamily: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f.split(",")[0]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Base Font Size</Label>
          <Input className="h-8 text-xs" value={globalStyles.fontSize} onChange={(e) => onGlobalStylesChange({ ...globalStyles, fontSize: e.target.value })} />
        </div>

        <div>
          <Label className="text-xs">Text Color</Label>
          <div className="flex gap-1.5">
            <input type="color" value={globalStyles.textColor} onChange={(e) => onGlobalStylesChange({ ...globalStyles, textColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
            <Input className="h-8 text-xs flex-1" value={globalStyles.textColor} onChange={(e) => onGlobalStylesChange({ ...globalStyles, textColor: e.target.value })} />
          </div>
        </div>

        <div>
          <Label className="text-xs">Heading Color</Label>
          <div className="flex gap-1.5">
            <input type="color" value={globalStyles.headingColor} onChange={(e) => onGlobalStylesChange({ ...globalStyles, headingColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
            <Input className="h-8 text-xs flex-1" value={globalStyles.headingColor} onChange={(e) => onGlobalStylesChange({ ...globalStyles, headingColor: e.target.value })} />
          </div>
        </div>

        <div>
          <Label className="text-xs">Link Color</Label>
          <div className="flex gap-1.5">
            <input type="color" value={globalStyles.linkColor} onChange={(e) => onGlobalStylesChange({ ...globalStyles, linkColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
            <Input className="h-8 text-xs flex-1" value={globalStyles.linkColor} onChange={(e) => onGlobalStylesChange({ ...globalStyles, linkColor: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
}
