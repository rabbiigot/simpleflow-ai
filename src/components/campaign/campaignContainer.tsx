import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Mail,
  Send,
  Users,
  FileText,
  Plus,
  Trash2,
  Eye,
  BarChart3,
  MousePointerClick,
  MailOpen,
  AlertTriangle,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Pencil,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import {
  listCampaigns,
  getCampaignStats,
  createCampaign,
  deleteCampaign,
  sendCampaign,
  listContacts,
  createContact,
  deleteContact,
  importContacts,
  listContactLists,
  createContactList,
  deleteContactList,
  listEmailTemplates,
  deleteEmailTemplate,
  getCampaignRecipients,
  type CampaignData,
  type CampaignStats,
  type ContactData,
  type ContactListData,
  type EmailTemplateData,
  type CampaignRecipientData,
} from "@/lib/backend-api";
import { useAuthStore } from "@/store/auth-store";
import EmailTemplateBuilder from "./email-builder/EmailTemplateBuilder";

const statusColors: Record<string, string> = {
  DRAFT: "border-gray-400 bg-gray-500/15 text-gray-700 dark:border-gray-500 dark:bg-gray-500/20 dark:text-gray-400",
  SCHEDULED: "border-blue-400 bg-blue-500/15 text-blue-700 dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-400",
  SENDING: "border-yellow-400 bg-yellow-500/15 text-yellow-700 dark:border-yellow-500 dark:bg-yellow-500/20 dark:text-yellow-400",
  SENT: "border-emerald-400 bg-emerald-500/15 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400",
  PAUSED: "border-orange-400 bg-orange-500/15 text-orange-700 dark:border-orange-500 dark:bg-orange-500/20 dark:text-orange-400",
  CANCELLED: "border-red-400 bg-red-500/15 text-red-700 dark:border-red-500 dark:bg-red-500/20 dark:text-red-400",
};

export default function CampaignContainer() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const [activeTab, setActiveTab] = useState("campaigns");

  if (!isAdmin) {
    return (
      <div className="page-shell">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-muted-foreground">
          <AlertTriangle className="w-16 h-16" />
          <h2 className="text-xl font-semibold">Admin Access Required</h2>
          <p className="text-sm">Only administrators can access the Campaign module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="section-stack">
        <p className="section-label">Email Campaign</p>
        <h1 className="text-3xl font-bold mb-2">Campaign</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Create and manage email campaigns, contacts, and templates.
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-tour="campaign-tabs">
            <TabsTrigger value="campaigns">
              <Mail className="w-4 h-4 mr-1.5 text-indigo-700 dark:text-blue-400" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarDays className="w-4 h-4 mr-1.5 text-indigo-700 dark:text-blue-400" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Users className="w-4 h-4 mr-1.5 text-indigo-700 dark:text-blue-400" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="lists">
              <FileText className="w-4 h-4 mr-1.5 text-indigo-700 dark:text-blue-400" />
              Lists
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="w-4 h-4 mr-1.5 text-indigo-700 dark:text-blue-400" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <CampaignsTab onSwitchToTemplates={() => setActiveTab("templates")} />
          </TabsContent>
          <TabsContent value="calendar">
            <CalendarTab />
          </TabsContent>
          <TabsContent value="contacts">
            <ContactsTab />
          </TabsContent>
          <TabsContent value="lists">
            <ListsTab />
          </TabsContent>
          <TabsContent value="templates">
            <TemplatesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Campaigns Tab ──────────────────────────────────

function CampaignsTab({ onSwitchToTemplates }: { onSwitchToTemplates: () => void }) {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showStats, setShowStats] = useState<CampaignStats | null>(null);
  const [showRecipients, setShowRecipients] = useState<{ campaignId: number; recipients: CampaignRecipientData[] } | null>(null);
  const [lists, setLists] = useState<ContactListData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    try {
      const [res, l] = await Promise.all([listCampaigns({ page }), listContactLists()]);
      setCampaigns(res.data);
      setTotalPages(res.totalPages);
      setLists(l);
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (id: number) => {
    try {
      const res = await sendCampaign(id);
      toast.success(res.message);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCampaign(id);
      toast.success("Campaign deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleViewStats = async (id: number) => {
    try {
      const stats = await getCampaignStats(id);
      setShowStats(stats);
    } catch {
      toast.error("Failed to load stats");
    }
  };

  const handleViewRecipients = async (id: number) => {
    try {
      const res = await getCampaignRecipients(id);
      setShowRecipients({ campaignId: id, recipients: res.data });
    } catch {
      toast.error("Failed to load recipients");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{campaigns.length} campaign(s)</p>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Mail className="w-12 h-12 mb-3 opacity-30" />
            <p>No campaigns yet</p>
            <p className="text-xs mt-1">Create your first email campaign</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>List</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Clicked</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{c.subject}</TableCell>
                    <TableCell><Badge variant="outline">{c.list?.name || "—"}</Badge></TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0 rounded-full border ${statusColors[c.status] || ""}`}>
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.totalSent}</TableCell>
                    <TableCell className="text-muted-foreground">{c.totalOpened}</TableCell>
                    <TableCell className="text-muted-foreground">{c.totalClicked}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {c.status === "DRAFT" && (
                            <DropdownMenuItem onClick={() => handleSend(c.id)}>
                              <Send className="h-3.5 w-3.5 mr-2" />
                              Send
                            </DropdownMenuItem>
                          )}
                          {c.status === "SENT" && (
                            <>
                              <DropdownMenuItem onClick={() => handleViewStats(c.id)}>
                                <BarChart3 className="h-3.5 w-3.5 mr-2" />
                                Stats
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewRecipients(c.id)}>
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                Recipients
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(c.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground py-1.5">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog open={showCreate} onClose={() => setShowCreate(false)} lists={lists} onCreated={load} onOpenTemplateBuilder={onSwitchToTemplates} />

      {/* Stats Dialog */}
      {showStats && (
        <Dialog open onOpenChange={() => setShowStats(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Campaign Stats — {showStats.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={Send} label="Sent" value={showStats.totalSent} />
              <StatCard icon={MailOpen} label="Opened" value={showStats.totalOpened} sub={`${showStats.openRate}%`} />
              <StatCard icon={MousePointerClick} label="Clicked" value={showStats.totalClicked} sub={`${showStats.clickRate}%`} />
              <StatCard icon={AlertTriangle} label="Bounced" value={showStats.totalBounced} sub={`${showStats.bounceRate}%`} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="text-sm"><span className="text-muted-foreground">Delivered:</span> {showStats.totalDelivered}</div>
              <div className="text-sm"><span className="text-muted-foreground">Unsubscribed:</span> {showStats.totalUnsubscribed}</div>
              <div className="text-sm"><span className="text-muted-foreground">Complaints:</span> {showStats.totalComplaints}</div>
              <div className="text-sm"><span className="text-muted-foreground">Unsubscribe Rate:</span> {showStats.unsubscribeRate}%</div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Recipients Dialog */}
      {showRecipients && (
        <Dialog open onOpenChange={() => setShowRecipients(null)}>
          <DialogContent className="max-w-2xl max-h-[70vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Recipients</DialogTitle>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opens</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showRecipients.recipients.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.contact.email}</TableCell>
                    <TableCell className="text-sm">{[r.contact.firstName, r.contact.lastName].filter(Boolean).join(" ") || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0 rounded-full border ${statusColors[r.status] || "border-gray-400 bg-gray-500/15 text-gray-700 dark:border-gray-500 dark:bg-gray-500/20 dark:text-gray-400"}`}>
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell>{r.openCount}</TableCell>
                    <TableCell>{r.clickCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.device || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number; sub?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}{sub ? ` (${sub})` : ""}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Create Campaign Dialog ─────────────────────────

function CreateCampaignDialog({
  open,
  onClose,
  lists,
  onCreated,
  onOpenTemplateBuilder,
}: {
  open: boolean;
  onClose: () => void;
  lists: ContactListData[];
  onCreated: () => void;
  onOpenTemplateBuilder: () => void;
}) {
  const [name, setName] = useState("");
  const [fromName, setFromName] = useState("SimpleFlow");
  const [fromEmail, setFromEmail] = useState("");
  const [listId, setListId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [templates, setTemplates] = useState<EmailTemplateData[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      listEmailTemplates().then(setTemplates).catch(() => {});
    }
  }, [open]);

  const selectedTemplate = templates.find((t) => String(t.id) === templateId);

  const handleSubmit = async () => {
    if (!name || !fromName || !fromEmail || !listId || !templateId) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await createCampaign({
        name,
        subject: selectedTemplate?.subject || name,
        fromName,
        fromEmail,
        blocks: [],
        listId: Number(listId),
        templateId: Number(templateId),
        ...(scheduledAt ? { scheduledAt } : {}),
      });
      toast.success(scheduledAt ? "Campaign scheduled" : "Campaign created as draft");
      onClose();
      onCreated();
      setName(""); setListId(""); setTemplateId(""); setScheduledAt("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Campaign Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Monthly Newsletter" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>From Name *</Label>
              <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Your Company" />
            </div>
            <div>
              <Label>From Email *</Label>
              <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="hello@company.com" type="email" />
            </div>
          </div>
          <div>
            <Label>Email Template *</Label>
            <div className="flex gap-2">
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name} — {t.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => { onClose(); onOpenTemplateBuilder(); }} title="Create new template">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {selectedTemplate && (
              <p className="text-xs text-muted-foreground mt-1">
                Subject: {selectedTemplate.subject}
              </p>
            )}
          </div>
          <div>
            <Label>Contact List *</Label>
            <Select value={listId} onValueChange={setListId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contact list" />
              </SelectTrigger>
              <SelectContent>
                {lists.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name} ({l._count?.members || 0} contacts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Schedule (optional)</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {scheduledAt
                ? `Will be sent on ${new Date(scheduledAt).toLocaleString()}`
                : "Leave empty to save as draft (send manually)"}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : scheduledAt ? (
              <><Clock className="w-4 h-4" /> Schedule</>
            ) : "Create Draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Contacts Tab ───────────────────────────────────

function ContactsTab() {
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    try {
      const res = await listContacts({ search: search || undefined, page });
      setContacts(res.data);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    try {
      await deleteContact(id);
      toast.success("Contact deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>Import CSV</Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p>No contacts yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-sm">{c.email}</TableCell>
                  <TableCell className="text-sm">{[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.company || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "SUBSCRIBED" ? "default" : "destructive"} className="text-xs">
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {c.tags?.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground py-1.5">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Contact Dialog */}
      <CreateContactDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />

      {/* Import Dialog */}
      <ImportContactsDialog open={showImport} onClose={() => setShowImport(false)} onImported={load} />
    </div>
  );
}

function CreateContactDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email) { toast.error("Email is required"); return; }
    setSubmitting(true);
    try {
      await createContact({ email, firstName: firstName || undefined, lastName: lastName || undefined, company: company || undefined });
      toast.success("Contact added");
      onClose();
      onCreated();
      setEmail(""); setFirstName(""); setLastName(""); setCompany("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create contact");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Email *</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" type="email" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First Name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
            <div><Label>Last Name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
          </div>
          <div><Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportContactsDialog({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [csv, setCsv] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleImport = async () => {
    const lines = csv.trim().split("\n").filter(Boolean);
    if (lines.length === 0) { toast.error("Paste CSV data"); return; }

    const contacts = lines.map((line) => {
      const [email, firstName, lastName, company] = line.split(",").map((s) => s.trim());
      return { email, firstName, lastName, company };
    }).filter((c) => c.email?.includes("@"));

    if (contacts.length === 0) { toast.error("No valid emails found"); return; }

    setSubmitting(true);
    try {
      const res = await importContacts(contacts);
      toast.success(`Imported ${res.created} contacts (${res.skipped} skipped)`);
      onClose();
      onImported();
      setCsv("");
    } catch {
      toast.error("Import failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Import Contacts (CSV)</DialogTitle></DialogHeader>
        <div>
          <Label>Paste CSV — one per line: email, firstName, lastName, company</Label>
          <Textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={8} placeholder="john@example.com, John, Doe, Acme Corp" className="mt-2 font-mono text-xs" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lists Tab ──────────────────────────────────────

function ListsTab() {
  const [lists, setLists] = useState<ContactListData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      setLists(await listContactLists());
    } catch {
      toast.error("Failed to load lists");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    try {
      await deleteContactList(id);
      toast.success("List deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{lists.length} list(s)</p>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          New List
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {lists.map((l) => (
          <Card key={l.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{l.name}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(l.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{l.description || "No description"}</p>
              <p className="text-sm font-medium mt-2">{l._count?.members || 0} contacts</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateListDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />
    </div>
  );
}

function CreateListDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name) { toast.error("Name is required"); return; }
    setSubmitting(true);
    try {
      await createContactList({ name, description: description || undefined });
      toast.success("List created");
      onClose();
      onCreated();
      setName(""); setDescription("");
    } catch {
      toast.error("Failed to create list");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Contact List</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Newsletter Subscribers" /></div>
          <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Calendar Tab ──────────────────────────────────

function CalendarTab() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const load = useCallback(async () => {
    try {
      const res = await listCampaigns({ pageSize: 100 });
      setCampaigns(res.data.filter((c) => c.scheduledAt || c.sentAt));
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const getCampaignsForDay = (day: number) => {
    return campaigns.filter((c) => {
      const date = c.scheduledAt ? new Date(c.scheduledAt) : c.sentAt ? new Date(c.sentAt) : null;
      if (!date) return false;
      return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
    });
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const today = new Date();
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={prevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-sm font-semibold">{monthName}</h3>
        <Button variant="outline" size="sm" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-md border border-border overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-muted px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          const dayCampaigns = day ? getCampaignsForDay(day) : [];
          return (
            <div
              key={i}
              className={`bg-background min-h-[80px] p-1.5 ${
                day ? "" : "bg-muted/30"
              } ${isToday(day || 0) ? "ring-2 ring-primary/30 ring-inset" : ""}`}
            >
              {day && (
                <>
                  <span className={`text-xs font-medium ${isToday(day) ? "text-primary" : "text-muted-foreground"}`}>
                    {day}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayCampaigns.map((c) => {
                      const time = c.scheduledAt ? new Date(c.scheduledAt) : c.sentAt ? new Date(c.sentAt!) : null;
                      return (
                        <div
                          key={c.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate ${statusColors[c.status] || "bg-muted text-muted-foreground"}`}
                          title={`${c.name} — ${c.status}${time ? ` at ${time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}`}
                        >
                          {time && (
                            <span className="font-medium mr-0.5">
                              {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                          {c.name}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Templates Tab ──────────────────────────────────

function TemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderMode, setBuilderMode] = useState<"list" | "create" | "edit">("list");
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateData | null>(null);

  const load = useCallback(async () => {
    try {
      setTemplates(await listEmailTemplates());
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    try {
      await deleteEmailTemplate(id);
      toast.success("Template deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleEdit = (template: EmailTemplateData) => {
    setEditingTemplate(template);
    setBuilderMode("edit");
  };

  const handleBuilderBack = () => {
    setBuilderMode("list");
    setEditingTemplate(null);
  };

  const handleBuilderSaved = () => {
    setBuilderMode("list");
    setEditingTemplate(null);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  // Show builder view
  if (builderMode === "create" || builderMode === "edit") {
    return (
      <div className="mt-4">
        <EmailTemplateBuilder
          template={builderMode === "edit" ? editingTemplate : null}
          onBack={handleBuilderBack}
          onSaved={handleBuilderSaved}
        />
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{templates.length} template(s)</p>
        <Button onClick={() => setBuilderMode("create")}>
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p>No templates yet</p>
            <p className="text-xs mt-1">Create your first email template</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => handleEdit(t)}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.subject}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(t.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(t)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
