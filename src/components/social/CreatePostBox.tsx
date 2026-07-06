import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textArea";
import { ImageWithLoader } from "@/components/ui/image-loader";
import type { ChatChannel } from "@/lib/backend-api";
import { Globe, ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { getChannelIcon } from "./CreateChannelDialog";

export type CreatePostBoxProps = {
  avatarUrl?: string;
  initials: string;
  onPost: (content: string, channelIds: string[], visibility: "PUBLIC" | "CHANNELS", media?: File) => void;
  isPosting?: boolean;
  channels: ChatChannel[];
  /** Organization name — "Public" is scoped to this org. */
  orgName?: string;
};

export default function CreatePostBox({
  avatarUrl,
  initials,
  onPost,
  isPosting = false,
  channels,
  orgName,
}: CreatePostBoxProps) {
  const [content, setContent] = useState("");
  const [selectedValue, setSelectedValue] = useState("public");
  const [pendingMedia, setPendingMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const visibility = selectedValue === "public" ? "PUBLIC" : "CHANNELS";
  const selectedChannelIds =
    selectedValue === "public" ? [] : [selectedValue];

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed && !pendingMedia) return;
    onPost(trimmed, selectedChannelIds, visibility, pendingMedia ?? undefined);
    setContent("");
    setSelectedValue("public");
    clearMedia();
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingMedia(file);
    setMediaPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const clearMedia = () => {
    setPendingMedia(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
  };

  return (
    <Card>
      <CardContent className="px-3 pt-4 sm:px-6">
        <div className="flex gap-2 sm:gap-3">
          <Avatar>
            <AvatarImage src={avatarUrl || "/placeholder.svg"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="min-h-[90px] resize-none rounded-xl"
            />

            {/* Image preview */}
            {mediaPreview && (
              <div className="relative inline-block">
                <ImageWithLoader
                  src={mediaPreview}
                  alt="Preview"
                  wrapperClassName="max-h-40 rounded-lg"
                  className="max-h-40 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                />
                <button
                  type="button"
                  onClick={clearMedia}
                  className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleMediaSelect}
            />

            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                  <SelectTrigger className="h-8 w-auto max-w-[160px] gap-1.5 text-xs">
                    {selectedValue === "public" ? (
                      <span className="flex items-center gap-1.5 truncate">
                        <Globe className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {orgName ? `Public (${orgName})` : "Public"}
                        </span>
                      </span>
                    ) : (
                      (() => {
                        const ch = channels.find(
                          (c) => String(c.id) === selectedValue,
                        );
                        const { Icon } = getChannelIcon(ch?.icon ?? "hash");
                        const label = ch
                          ? ch.name.length > 6
                            ? `${ch.name.slice(0, 6)}...`
                            : ch.name
                          : "Channel";
                        return (
                          <span className="flex items-center gap-1.5 truncate">
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{label}</span>
                          </span>
                        );
                      })()
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <Globe className="h-3.5 w-3.5" />
                      {orgName ? `Public (${orgName})` : "Public"}
                    </SelectItem>
                    {channels.map((ch) => {
                      const { Icon } = getChannelIcon(ch.icon ?? "hash");
                      return (
                        <SelectItem key={ch.id} value={String(ch.id)}>
                          <Icon className="h-3.5 w-3.5" />
                          {ch.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
                  title="Add image or video"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={(!content.trim() && !pendingMedia) || isPosting}
                className="shrink-0 rounded-lg px-4 sm:px-6"
              >
                {isPosting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
