import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import {
  Briefcase,
  Code,
  Gamepad2,
  Globe,
  Heart,
  Megaphone,
  Music,
  Palette,
  Rocket,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const GROUP_ICONS = [
  { key: "users", label: "People", Icon: Users },
  { key: "rocket", label: "Rocket", Icon: Rocket },
  { key: "code", label: "Code", Icon: Code },
  { key: "briefcase", label: "Work", Icon: Briefcase },
  { key: "palette", label: "Design", Icon: Palette },
  { key: "megaphone", label: "Announce", Icon: Megaphone },
  { key: "gamepad", label: "Gaming", Icon: Gamepad2 },
  { key: "music", label: "Music", Icon: Music },
  { key: "globe", label: "Global", Icon: Globe },
  { key: "heart", label: "Health", Icon: Heart },
  { key: "shield", label: "Security", Icon: Shield },
  { key: "star", label: "Star", Icon: Star },
  { key: "zap", label: "Energy", Icon: Zap },
] as const;

export type GroupIconKey = (typeof GROUP_ICONS)[number]["key"];

export function getGroupIcon(key: string) {
  return GROUP_ICONS.find((i) => i.key === key) ?? GROUP_ICONS[0];
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    name: string;
    icon: GroupIconKey;
    description: string;
  }) => void;
};

export default function CreateGroupDialog({
  open,
  onOpenChange,
  onCreate,
}: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<GroupIconKey>("users");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ name: trimmed, icon, description: description.trim() });
    setName("");
    setIcon("users");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription>
            Create a new group with channels for your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {GROUP_ICONS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => setIcon(key)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                    icon === key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted bg-white text-muted-foreground hover:border-primary/50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-name">Name</Label>
            <Input
              id="group-name"
              placeholder="e.g. Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-desc">Description</Label>
            <Textarea
              id="group-desc"
              placeholder="What is this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
