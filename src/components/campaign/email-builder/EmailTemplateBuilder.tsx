import { useCallback, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ArrowLeft,
  Blocks,
  Paintbrush,
  Code,
  Loader2,
  Save,
  LayoutTemplate,
  Layers,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Columns2,
  Columns3,
  Columns4,
  Square,
  Maximize2,
  Minimize2,
  Copy,
  Eye,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createEmailTemplate,
  updateEmailTemplate,
  type EmailTemplateData,
} from "@/lib/backend-api";

import BlockPalette from "./BlockPalette";
import StylePanel from "./StylePanel";
import CanvasBlock from "./CanvasBlock";
import { isFullHtmlDocument, renderFullHtml, renderPreviewHtml } from "./htmlRenderer";
import {
  createBlock,
  createRow,
  createSection,
  redistributeBlocks,
  DEFAULT_GLOBAL_STYLES,
  DEFAULT_SECTIONS,
  type BlockContent,
  type BlockType,
  type ColumnCount,
  type EmailSection,
  type GlobalStyles,
  type SectionRow,
} from "./types";

interface EmailTemplateBuilderProps {
  template?: EmailTemplateData | null;
  onBack: () => void;
  onSaved: () => void;
}

type MenuTab = "sections" | "blocks" | "style" | "code";

const MENU_TABS: { key: MenuTab; icon: React.ElementType; label: string }[] = [
  { key: "sections", icon: Layers, label: "Sections" },
  { key: "blocks", icon: Blocks, label: "Blocks" },
  { key: "style", icon: Paintbrush, label: "Style" },
  { key: "code", icon: Code, label: "Code" },
];

export default function EmailTemplateBuilder({
  template,
  onBack,
  onSaved,
}: EmailTemplateBuilderProps) {
  const isEditing = !!template;

  const [name, setName] = useState(template?.name || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [preheader, setPreheader] = useState(template?.preheader || "");

  const [sections, setSections] = useState<EmailSection[]>(() => {
    if (template?.blocks && Array.isArray(template.blocks) && template.blocks.length > 0) {
      const first = template.blocks[0] as Record<string, unknown>;
      if (first && "rows" in first) {
        // Ensure columns field exists on loaded sections
        return (template.blocks as unknown as EmailSection[]).map((s) => ({
          ...s,
          columns: s.columns || 1 as ColumnCount,
        }));
      }
      if (first && "type" in first && ["header", "body", "footer"].includes(first.type as string)) {
        return (template.blocks as unknown as Array<{ id: string; type: string; blocks?: unknown[]; styles?: unknown }>).map((s) => ({
          id: s.id,
          label: s.type === "header" ? "Header" : s.type === "footer" ? "Footer" : "Body",
          columns: 1 as ColumnCount,
          rows: (s.blocks || []).map((b: unknown) => ({
            id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            columns: 1 as ColumnCount,
            blocks: [b],
          })) as SectionRow[],
          styles: (s.styles || { backgroundColor: "#ffffff", padding: "20px" }) as EmailSection["styles"],
        }));
      }
    }
    return DEFAULT_SECTIONS.map((s) => ({ ...s, rows: [...s.rows] }));
  });

  const [globalStyles, setGlobalStyles] = useState<GlobalStyles>(
    (template?.globalStyles as GlobalStyles) || { ...DEFAULT_GLOBAL_STYLES }
  );

  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id || "");
  const [activeTab, setActiveTab] = useState<MenuTab>("blocks");
  const [submitting, setSubmitting] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const [codeFullscreen, setCodeFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [pendingColumnChange, setPendingColumnChange] = useState<{ sectionId: string; columns: ColumnCount } | null>(null);
  const [inlinePaletteSection, setInlinePaletteSection] = useState<string | null>(null);

  // DnD sensors — require 5px movement to start drag (prevents accidental drags on click)
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleBlockDragEnd = useCallback((sectionId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        // Flatten blocks, reorder, redistribute into rows
        const allBlocks = s.rows.flatMap((r) => r.blocks);
        const oldIdx = allBlocks.findIndex((b) => b.id === active.id);
        const newIdx = allBlocks.findIndex((b) => b.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return s;
        const reordered = arrayMove(allBlocks, oldIdx, newIdx);
        // Rebuild rows with section column count
        const newRows: SectionRow[] = [];
        for (let i = 0; i < reordered.length; i += s.columns) {
          newRows.push(createRow(s.columns, reordered.slice(i, i + s.columns)));
        }
        return { ...s, rows: newRows };
      })
    );
  }, []);

  const fullHtml = useMemo(
    () => renderFullHtml(sections, globalStyles, subject, preheader),
    [sections, globalStyles, subject, preheader]
  );

  const previewHtml = useMemo(
    () => renderPreviewHtml(sections, globalStyles),
    [sections, globalStyles]
  );

  // ─── Section Operations ───────────────────────────

  const addSection = useCallback((label: string) => {
    const section = createSection(label);
    setSections((prev) => [...prev, section]);
    setActiveSectionId(section.id);
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }, []);

  const moveSectionUp = useCallback((sectionId: string) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === sectionId);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveSectionDown = useCallback((sectionId: string) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === sectionId);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const renameSectionLabel = useCallback((sectionId: string, label: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, label } : s))
    );
  }, []);

  const updateSectionStyle = useCallback((sectionId: string, key: string, value: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, styles: { ...s.styles, [key]: value } } : s
      )
    );
  }, []);

  // ─── Column Layout ─────────────────────────────────

  const changeSectionColumns = useCallback((sectionId: string, columns: ColumnCount) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const hasBlocks = section.rows.some((r) => r.blocks.length > 0);
    if (hasBlocks && columns !== section.columns) {
      setPendingColumnChange({ sectionId, columns });
    } else {
      applySectionColumns(sectionId, columns);
    }
  }, [sections]);

  const applySectionColumns = useCallback((sectionId: string, columns: ColumnCount) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const newRows = redistributeBlocks({ ...s, columns }, columns);
        return { ...s, columns, rows: newRows };
      })
    );
    setPendingColumnChange(null);
  }, []);

  // ─── Block Operations ─────────────────────────────

  const addBlock = useCallback((type: BlockType, targetSectionId?: string) => {
    const block = createBlock(type);
    const sectionId = targetSectionId || activeSectionId;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        // Fill into last row if it has space
        const lastRow = s.rows[s.rows.length - 1];
        if (lastRow && lastRow.blocks.length < s.columns) {
          return {
            ...s,
            rows: s.rows.map((r) =>
              r.id === lastRow.id ? { ...r, blocks: [...r.blocks, block] } : r
            ),
          };
        }
        // New row with the section's column count
        const newRow = createRow(s.columns, [block]);
        return { ...s, rows: [...s.rows, newRow] };
      })
    );
  }, [activeSectionId]);

  const updateBlockContent = useCallback((blockId: string, content: Partial<BlockContent>) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        rows: s.rows.map((r) => ({
          ...r,
          blocks: r.blocks.map((b) =>
            b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b
          ),
        })),
      }))
    );
  }, []);

  const updateBlockStyles = useCallback((blockId: string, styles: Partial<import("./types").BlockStyles>) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        rows: s.rows.map((r) => ({
          ...r,
          blocks: r.blocks.map((b) =>
            b.id === blockId ? { ...b, styles: { ...b.styles, ...styles } } : b
          ),
        })),
      }))
    );
  }, []);

  const removeBlock = useCallback((blockId: string) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        rows: s.rows
          .map((r) => ({ ...r, blocks: r.blocks.filter((b) => b.id !== blockId) }))
          .filter((r) => r.blocks.length > 0),
      }))
    );
  }, []);

  const handleCodeTabActive = useCallback(() => {
    setCodeValue(fullHtml);
  }, [fullHtml]);

  // Apply the Code-tab HTML as the template: a single "code" block holding the
  // pasted markup. Full HTML documents render via iframe in the canvas/preview.
  const applyCustomHtml = useCallback(() => {
    const html = codeValue.trim();
    if (!html) {
      toast.error("Paste some HTML first");
      return;
    }
    const block = createBlock("code");
    block.content = { html };
    const section = createSection("Custom HTML");
    section.rows = [createRow(1, [block])];
    setSections([section]);
    setActiveTab("blocks");
    toast.success("HTML applied — preview updated");
  }, [codeValue]);

  // ─── Save ─────────────────────────────────────────

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Template name is required"); return; }
    if (!subject.trim()) { toast.error("Subject line is required"); return; }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        subject: subject.trim(),
        preheader: preheader.trim() || undefined,
        blocks: sections as unknown as unknown[],
        globalStyles: globalStyles as unknown,
      };

      if (isEditing && template) {
        await updateEmailTemplate(template.id, payload);
        toast.success("Template updated");
      } else {
        await createEmailTemplate(payload);
        toast.success("Template created");
      }
      onSaved();
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <LayoutTemplate className="h-5 w-5 text-muted-foreground shrink-0" />
          <h2 className="text-lg font-semibold truncate">
            {isEditing ? "Edit Template" : "Create Template"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="default" className="flex-1 sm:flex-none px-4 py-2" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button size="default" className="flex-1 sm:flex-none px-4 py-2" onClick={handleSave} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEditing ? "Update" : "Save Template"}
          </Button>
        </div>
      </div>

      {/* Template Meta */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Template Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Welcome Email" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Subject Line *</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Welcome to {{companyName}}!" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Preheader</Label>
              <Input value={preheader} onChange={(e) => setPreheader(e.target.value)} placeholder="Preview text shown in inbox..." className="h-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Top Menu Bar + Connected Panel + Canvas ── */}
      <div>
        {/* Menu bar — equal-width tabs spanning panel width */}
        <div className="flex items-end w-full md:w-80 relative">
          {MENU_TABS.map((tab, idx) => {
            const isActive = activeTab === tab.key;
            const isFirst = idx === 0;
            const isLast = idx === MENU_TABS.length - 1;
            return (
              <button
                key={tab.key}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors
                  rounded-t-lg border border-b-0 relative
                  ${isActive
                    ? tab.key === "code"
                      ? "bg-[#1e1e1e] text-[#cccccc] border-border z-10"
                      : "bg-white text-foreground border-border z-10"
                    : "bg-muted/60 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                  }
                `}
                style={isActive ? { marginBottom: -1 } : undefined}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key === "code") handleCodeTabActive();
                }}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {/* Inverted radius — left arch (skip on first tab) */}
                {isActive && !isFirst && (
                  <span
                    className="absolute -bottom-px -left-2 w-2 h-2 pointer-events-none"
                    style={{
                      background: "transparent",
                      borderBottomRightRadius: 8,
                      boxShadow: `3px 3px 0 0 ${tab.key === "code" ? "#1e1e1e" : "white"}, 4px 4px 0 0 hsl(var(--border))`,
                    }}
                  />
                )}
                {/* Inverted radius — right arch (skip on last tab) */}
                {isActive && !isLast && (
                  <span
                    className="absolute -bottom-px -right-2 w-2 h-2 pointer-events-none"
                    style={{
                      background: "transparent",
                      borderBottomLeftRadius: 8,
                      boxShadow: `-3px 3px 0 0 ${tab.key === "code" ? "#1e1e1e" : "white"}, -4px 4px 0 0 hsl(var(--border))`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Panel + Canvas container — top border connects to active tab */}
        <div className="border border-border rounded-b-lg rounded-tr-lg overflow-hidden flex flex-col md:flex-row" style={{ minHeight: "600px" }}>

          {/* Code fullscreen — takes over entire container */}
          {activeTab === "code" && codeFullscreen ? (
            <div className="flex-1 flex flex-col bg-[#1e1e1e]">
              {/* Editor toolbar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c]">
                <div className="flex items-center gap-2">
                  <Code className="h-3.5 w-3.5 text-[#858585]" />
                  <span className="text-[11px] text-[#cccccc] font-medium">template.html</span>
                  <span className="text-[10px] text-[#858585]">— HTML Output</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c]"
                    onClick={() => {
                      navigator.clipboard.writeText(codeValue);
                      toast.success("HTML copied");
                    }}
                    title="Copy"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c]"
                    onClick={() => setCodeFullscreen(false)}
                    title="Exit fullscreen"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {/* Editor area with line numbers */}
              <div className="flex-1 flex overflow-hidden">
                <CodeEditorArea value={codeValue} onChange={setCodeValue} height="100%" />
              </div>
            </div>
          ) : (
            <>
              {/* Panel content */}
              <div
                className={`w-full md:w-80 border-b md:border-b-0 md:border-r shrink-0 flex flex-col ${
                  activeTab === "code" ? "bg-[#1e1e1e]" : "bg-white"
                }`}
              >
                {activeTab === "code" ? (
                  /* Code editor — fills entire panel, no padding */
                  <div className="flex flex-col flex-1 min-h-0">
                    {/* Editor toolbar */}
                    <div className="flex items-center justify-between px-2 py-1 bg-[#252526] border-b border-[#3c3c3c]">
                      <div className="flex items-center gap-1.5">
                        <Code className="h-3 w-3 text-[#858585]" />
                        <span className="text-[10px] text-[#cccccc] font-medium">template.html</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-[#3c3c3c]"
                          onClick={applyCustomHtml}
                          title="Apply this HTML as the template"
                        >
                          Apply
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c]"
                          onClick={() => {
                            navigator.clipboard.writeText(codeValue);
                            toast.success("HTML copied");
                          }}
                          title="Copy"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c]"
                          onClick={() => setCodeFullscreen(true)}
                          title="Fullscreen"
                        >
                          <Maximize2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0">
                      <CodeEditorArea value={codeValue} onChange={setCodeValue} height="100%" />
                    </div>
                  </div>
                ) : (
                  /* Other tabs — white bg with padding */
                  <ScrollArea className="h-full" style={{ maxHeight: "600px" }}>
                    <div className="p-3">
                      {activeTab === "sections" && (
                        <SectionsPanel
                          sections={sections}
                          activeSectionId={activeSectionId}
                          onSelect={setActiveSectionId}
                          onAdd={addSection}
                          onRemove={removeSection}
                          onMoveUp={moveSectionUp}
                          onMoveDown={moveSectionDown}
                          onRename={renameSectionLabel}
                          onChangeColumns={changeSectionColumns}
                          onStyleChange={updateSectionStyle}
                        />
                      )}
                      {activeTab === "blocks" && (
                        <BlockPalette onAddBlock={addBlock} />
                      )}
                      {activeTab === "style" && (
                        <StylePanel
                          globalStyles={globalStyles}
                          onGlobalStylesChange={setGlobalStyles}
                          sections={sections}
                          onSectionStyleChange={updateSectionStyle}
                        />
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Canvas — gray email client bg with white card centered */}
              <div className="flex-1 overflow-auto bg-gray-100">
            <ScrollArea className="h-full" style={{ maxHeight: "600px" }}>
              <div className="py-4 px-2 md:py-6 md:px-4">
                <div
                  className="mx-auto rounded-lg shadow"
                  style={{
                    maxWidth: globalStyles.contentWidth,
                    fontFamily: globalStyles.fontFamily,
                    fontSize: globalStyles.fontSize,
                    color: globalStyles.textColor,
                    backgroundColor: "#ffffff",
                  }}
                >
                  {sections.map((section) => {
                    const sectionPad = parseInt(section.styles.padding || "0") || 0;
                    return (
                    <div
                      key={section.id}
                      className={`relative transition-all ${
                        activeSectionId === section.id
                          ? "outline outline-2 outline-primary/40 outline-offset-[-2px]"
                          : "hover:outline hover:outline-1 hover:outline-muted-foreground/20 hover:outline-offset-[-1px]"
                      }`}
                        style={{
                          backgroundColor: section.styles.backgroundColor,
                          padding: sectionPad > 0 ? sectionPad : 0,
                        }}
                        onClick={() => setActiveSectionId(section.id)}
                      >
                      {activeSectionId === section.id && (
                        <div className="absolute -top-3 left-2 z-10">
                          <span className="text-[9px] font-semibold uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded shadow-sm">
                            {section.label}
                          </span>
                        </div>
                      )}

                      {section.rows.length === 0 ? (
                        inlinePaletteSection === section.id ? (
                          <div
                            className="border-2 border-dashed border-primary/30 rounded p-3 bg-background"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-[11px] text-muted-foreground text-center mb-2">Select a block to add</p>
                            <BlockPalette
                              onAddBlock={(type) => {
                                addBlock(type, section.id);
                                setInlinePaletteSection(null);
                              }}
                              compact
                            />
                          </div>
                        ) : (
                          <div
                            className="border-2 border-dashed border-muted-foreground/20 rounded py-8 text-center text-muted-foreground text-xs cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSectionId(section.id);
                              setInlinePaletteSection(section.id);
                            }}
                          >
                            Click to add content
                          </div>
                        )
                      ) : (
                        <DndContext
                          sensors={dndSensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(e) => handleBlockDragEnd(section.id, e)}
                        >
                          <SortableContext
                            items={section.rows.flatMap((r) => r.blocks.map((b) => b.id))}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-0">
                              {section.rows.map((row) => (
                                <CanvasRow
                                  key={row.id}
                                  row={row}
                                  globalStyles={globalStyles}
                                  onUpdateBlockContent={updateBlockContent}
                                  onUpdateBlockStyles={updateBlockStyles}
                                  onRemoveBlock={removeBlock}
                                  editingBlockId={editingBlockId}
                                  onSetEditingBlockId={setEditingBlockId}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-h-[90vh] flex flex-col p-0 gap-0" style={{ width: "70vw", maxWidth: "70vw" }}>
          <DialogHeader className="px-5 pt-4 pb-3 shrink-0">
            <DialogTitle className="text-base">Email Preview</DialogTitle>
          </DialogHeader>

          {/* Email header fields */}
          <div className="text-[13px] text-gray-700 bg-gray-50 border-b shrink-0">
            <div className="flex items-center border-b border-gray-200 px-5 py-2">
              <span className="text-gray-500 min-w-[56px]">From</span>
              <span className="text-gray-800">noreply@simpleflow.com</span>
            </div>
            <div className="flex items-center border-b border-gray-200 px-5 py-2">
              <span className="text-gray-500 min-w-[56px]">To</span>
              <span className="text-gray-800">john.doe@example.com</span>
            </div>
            <div className="flex items-center px-5 py-2">
              <span className="text-gray-500 min-w-[56px]">Subject</span>
              <span className="text-gray-800 font-medium">{subject || "No subject"}</span>
            </div>
          </div>

          {/* Email content — gray bg with centered white card */}
          <div className="flex-1 overflow-auto min-h-0">
            {isFullHtmlDocument(previewHtml) ? (
              <iframe
                title="Email preview"
                srcDoc={previewHtml}
                sandbox="allow-same-origin"
                onLoad={(e) => {
                  const f = e.currentTarget;
                  try {
                    const doc = f.contentDocument;
                    if (doc) {
                      f.style.height =
                        Math.max(
                          doc.documentElement.scrollHeight,
                          doc.body?.scrollHeight ?? 0,
                        ) + "px";
                    }
                  } catch {
                    /* cross-origin guard */
                  }
                }}
                className="block w-full"
                style={{ border: 0, minHeight: 480, background: "#fff" }}
              />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml, {
  ALLOWED_TAGS: ["div", "p", "span", "a", "img", "h1", "h2", "h3", "h4", "h5", "h6", "b", "i", "u", "em", "strong", "br", "table", "tr", "td", "th", "hr", "thead", "tbody"],
  ALLOWED_ATTR: ["href", "src", "alt", "style", "class", "width", "height", "cellpadding", "cellspacing", "border", "align"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
}) }} />
            )}
          </div>

          {/* Send Test Email */}
          <div className="px-4 py-3 border-t shrink-0 bg-muted/30">
            <p className="text-xs font-medium mb-2">Send Test Email</p>
            <div className="flex gap-2">
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="recipient@example.com"
                type="email"
                className="h-9 flex-1"
              />
              <Button
                disabled={!testEmail.trim() || sendingTest}
                onClick={async () => {
                  if (!testEmail.trim()) return;
                  setSendingTest(true);
                  try {
                    // TODO: integrate with backend send-test endpoint
                    await new Promise((r) => setTimeout(r, 1000));
                    toast.success(`Test email sent to ${testEmail}`);
                  } catch {
                    toast.error("Failed to send test email");
                  } finally {
                    setSendingTest(false);
                  }
                }}
              >
                {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Column Change Confirmation */}
      <Dialog open={!!pendingColumnChange} onOpenChange={() => setPendingColumnChange(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Column Layout</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This section already has blocks. Changing to {pendingColumnChange?.columns} column(s) will rearrange them. Continue?
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setPendingColumnChange(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => {
              if (pendingColumnChange) {
                applySectionColumns(pendingColumnChange.sectionId, pendingColumnChange.columns);
              }
            }}>
              Apply Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Code Editor (VSCode-style) ─────────────────────

function CodeEditorArea({ value, onChange, height }: { value: string; onChange: (v: string) => void; height: string }) {
  const lineCount = value.split("\n").length;
  const gutterRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const monoFont = "'Cascadia Code', 'Fira Code', 'Consolas', 'Monaco', monospace";

  return (
    <div className="flex w-full bg-[#1e1e1e]" style={{ height }}>
      {/* Line numbers — synced to textarea scroll */}
      <div
        ref={gutterRef}
        className="shrink-0 select-none text-right pr-3 pl-2 overflow-hidden"
        style={{
          fontFamily: monoFont,
          fontSize: 12,
          lineHeight: "20px",
          color: "#858585",
          minWidth: 44,
          backgroundColor: "#1e1e1e",
          paddingTop: 8,
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      {/* Editor textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        wrap="off"
        className="flex-1 resize-none outline-none border-none w-full overflow-auto"
        style={{
          fontFamily: monoFont,
          fontSize: 12,
          lineHeight: "20px",
          color: "#d4d4d4",
          backgroundColor: "#1e1e1e",
          caretColor: "#aeafad",
          tabSize: 2,
          padding: 8,
        }}
      />
    </div>
  );
}

// ─── Canvas Row ─────────────────────────────────────

interface CanvasRowProps {
  row: SectionRow;
  globalStyles: GlobalStyles;
  onUpdateBlockContent: (blockId: string, content: Partial<BlockContent>) => void;
  onUpdateBlockStyles: (blockId: string, styles: Partial<import("./types").BlockStyles>) => void;
  onRemoveBlock: (blockId: string) => void;
  editingBlockId: string | null;
  onSetEditingBlockId: (id: string | null) => void;
}

function CanvasRow({
  row,
  globalStyles,
  onUpdateBlockContent,
  onUpdateBlockStyles,
  onRemoveBlock,
  editingBlockId,
  onSetEditingBlockId,
}: CanvasRowProps) {
  return (
    <div
      className="grid gap-0"
      style={{ gridTemplateColumns: `repeat(${row.columns}, 1fr)` }}
    >
      {row.blocks.map((block) => (
        <CanvasBlock
          key={block.id}
          block={block}
          onUpdate={(content) => onUpdateBlockContent(block.id, content)}
          onUpdateStyles={(styles) => onUpdateBlockStyles(block.id, styles)}
          onRemove={() => onRemoveBlock(block.id)}
          globalStyles={globalStyles}
          isEditing={editingBlockId === block.id}
          onStartEdit={() => onSetEditingBlockId(block.id)}
          onStopEdit={() => onSetEditingBlockId(null)}
        />
      ))}
    </div>
  );
}

// ─── Sections Panel ─────────────────────────────────

interface SectionsPanelProps {
  sections: EmailSection[];
  activeSectionId: string;
  onSelect: (id: string) => void;
  onAdd: (label: string) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onChangeColumns: (sectionId: string, columns: ColumnCount) => void;
  onStyleChange: (sectionId: string, key: string, value: string) => void;
}

function SectionsPanel({
  sections,
  activeSectionId,
  onSelect,
  onAdd,
  onRemove,
  onMoveUp,
  onMoveDown,
  onRename,
  onChangeColumns,
  onStyleChange,
}: SectionsPanelProps) {
  const [newLabel, setNewLabel] = useState("");
  const colOptions: { value: ColumnCount; icon: React.ElementType; label: string }[] = [
    { value: 1, icon: Square, label: "1" },
    { value: 2, icon: Columns2, label: "2" },
    { value: 3, icon: Columns3, label: "3" },
    { value: 4, icon: Columns4, label: "4" },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        Sections
      </h4>
      <p className="text-[11px] text-muted-foreground">
        Manage sections and set column layout
      </p>

      <div className="space-y-1.5">
        {sections.map((section, idx) => {
          const blockCount = section.rows.reduce((sum, r) => sum + r.blocks.length, 0);
          return (
          <div
            key={section.id}
            className={`rounded-md border p-2 cursor-pointer transition-colors ${
              activeSectionId === section.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}
            onClick={() => onSelect(section.id)}
          >
            <div className="flex items-center justify-between mb-1">
              <input
                className="text-xs font-medium bg-transparent border-none outline-none w-full"
                value={section.label}
                onChange={(e) => onRename(section.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex items-center gap-0.5 shrink-0">
                {idx > 0 && (
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); onMoveUp(section.id); }}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                )}
                {idx < sections.length - 1 && (
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); onMoveDown(section.id); }}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); onRemove(section.id); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1.5">
              {section.columns} column(s) · {blockCount} block(s)
            </p>

            {activeSectionId === section.id && (
              <div className="border-t pt-1.5 mt-1 space-y-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground mr-1">Columns:</span>
                  {colOptions.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={section.columns === opt.value ? "default" : "outline"}
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); onChangeColumns(section.id, opt.value); }}
                      title={`${opt.value} column${opt.value > 1 ? "s" : ""}`}
                    >
                      <opt.icon className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Padding:</span>
                    <span className="text-[10px] text-muted-foreground">{parseInt(section.styles.padding || "20") || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    value={parseInt(section.styles.padding || "20") || 0}
                    onChange={(e) => onStyleChange(section.id, "padding", `${e.target.value}px`)}
                    className="w-full h-1.5 accent-primary cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      <div className="border-t pt-3 space-y-1.5">
        <Label className="text-[11px]">New Section</Label>
        <div className="flex gap-1.5">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Section name..."
            className="h-8 text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newLabel.trim()) {
                onAdd(newLabel.trim());
                setNewLabel("");
              }
            }}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!newLabel.trim()}
            onClick={() => {
              onAdd(newLabel.trim());
              setNewLabel("");
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
