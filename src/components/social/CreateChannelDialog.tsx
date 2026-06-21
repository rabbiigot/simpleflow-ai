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
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Code,
  Gamepad2,
  Globe,
  Hash,
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

export const CHANNEL_ICONS = [
  { key: "hash", label: "General", Icon: Hash },
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

export type ChannelIconKey = (typeof CHANNEL_ICONS)[number]["key"];

export function getChannelIcon(key: string) {
  return CHANNEL_ICONS.find((i) => i.key === key) ?? CHANNEL_ICONS[0];
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { name: string; description: string; icon: string }) => void;
  isCreating?: boolean;
};

export default function CreateChannelDialog({
  open,
  onOpenChange,
  onCreate,
  isCreating,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<ChannelIconKey>("hash");

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ name: trimmed, description: description.trim(), icon });
  };

  // Reset form when dialog closes
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName("");
      setDescription("");
      setIcon("hash");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Create a new channel to start chatting with your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_ICONS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => setIcon(key)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                    icon === key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted bg-card text-muted-foreground hover:border-primary/50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-name">Channel Name</Label>
            <Input
              id="channel-name"
              placeholder="e.g. general, design-team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating) handleCreate();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-desc">Description</Label>
            <Textarea
              id="channel-desc"
              placeholder="What is this channel about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? "Creating..." : "Create Channel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
