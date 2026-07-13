import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInvalidation } from "@/hooks/use-invalidation";
import { useSocialSocket } from "@/hooks/use-social-socket";
import {
  addSocialReaction,
  createSocialComment,
  createSocialPost,
  createSocialPostWithMedia,
  deleteChatChannel,
  deleteSocialPost,
  getCurrentUserId,
  getSocialPost,
  getUserProfile,
  listSocialPostsPaged,
  removeSocialReaction,
  toggleChannelFavorite,
  updateChatChannel,
  uploadChannelIcon,
  type SocialReactionType,
} from "@/lib/backend-api";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Archive,
  ArrowLeft,
  ChevronDown,
  ImagePlus,
  Loader2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Quote,
  Rss,
  Star,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useSidebarState } from "@/components/layout/rootLayout";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createChatChannel,
  getChatChannels,
  listMyOrganizations,
  sendChatMessage,
  sharePost as sharePostApi,
  type ChatChannel,
} from "@/lib/backend-api";
import CreateChannelDialog from "./CreateChannelDialog";
import { getChannelIcon } from "./CreateChannelDialog";
import CreatePostBox from "./CreatePostBox";
import GroupChat from "./GroupChat";
import PostCard from "./PostCard";
import {
  mapPost,
  readProfileFromStorage,
  type ProfileState,
  type UiPost,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SocialPage() {
  const navigate = useNavigate();
  const user = useAuthStore((store) => store.user);

  const [profile, setProfile] = useState<ProfileState>(() =>
    readProfileFromStorage(user),
  );

  const [posts, setPosts] = useState<UiPost[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  // On mobile the channels list is collapsed by default to save vertical space.
  const isMobile = useIsMobile();
  const sidebarState = useSidebarState();
  // When the desktop nav collapses, the content area widens by (w-65 - w-19)
  // = 11.5rem. Cap the feed to its expanded width and center it so the cards
  // keep the same size and position as when the nav is expanded.
  const navCollapsed = !isMobile && sidebarState === "collapsed";
  const [channelsOpen, setChannelsOpen] = useState(false);
  const channelsVisible = !isMobile || channelsOpen;
  // Primary organization name — "Public" posts are scoped to it.
  const [orgName, setOrgName] = useState("");
  useEffect(() => {
    listMyOrganizations()
      .then((orgs) => setOrgName(orgs?.[0]?.name ?? ""))
      .catch(() => setOrgName(""));
  }, []);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  // A channel is "selected" from the left list; the center then shows Feed/Chat
  // as tabs (default Feed). No channel selected = the global community feed.
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [channelTab, setChannelTab] = useState<"feed" | "chat">("feed");
  const [feedChannelId, setFeedChannelId] = useState<string | null>(null);
  // Members card shows 9 by default; "Show more" reveals the rest (scrollable).
  const [showAllMembers, setShowAllMembers] = useState(false);
  const MEMBERS_PREVIEW = 9;
  const [showEditChannelDialog, setShowEditChannelDialog] = useState(false);
  const [editChannelData, setEditChannelData] = useState<{
    id: string;
    name: string;
    description: string;
    icon: string;
  } | null>(null);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const authUser = useAuthStore((store) => store.user);
  const currentUserId = authUser?.id != null ? String(authUser.id) : getCurrentUserId();
  const avatarSrc = profile.avatarUrl || "/placeholder.svg";
  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "User";

  const initials = useMemo(() => {
    const first = profile.firstName?.[0] || "";
    const last = profile.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "U";
  }, [profile.firstName, profile.lastName]);

  const requireUserId = () => {
    if (!currentUserId) {
      throw new Error(
        "No signed-in user id found. Please sign up or log in again.",
      );
    }
    return currentUserId;
  };

  /* ---- profile ---- */

  useEffect(() => {
    setProfile(readProfileFromStorage(user));
  }, [user]);

  useEffect(() => {
    if (!currentUserId) return;
    getUserProfile(currentUserId)
      .then((data) => {
        setProfile((prev) => ({
          ...prev,
          firstName: data.firstName || prev.firstName,
          lastName: data.lastName || prev.lastName,
          email: data.email || prev.email,
          phoneNumber:
            (data as { phoneNumber?: string }).phoneNumber || prev.phoneNumber,
          bio: data.bio || prev.bio || "",
          avatarUrl: data.avatarUrl || prev.avatarUrl || "",
        }));
      })
      .catch(() => {
        // fall back to localStorage
      });
  }, [currentUserId]);

  /* ---- feed loading ---- */

  const loadPage = useCallback(
    async (nextPage: number, mode: "replace" | "append") => {
      if (mode === "replace") setIsLoading(true);
      else setIsLoadingMore(true);
      setError(null);

      try {
        const data = await listSocialPostsPaged(nextPage, pageSize, currentUserId || undefined, feedChannelId || undefined);
        const mapped = data.items.map((item) => mapPost(item, currentUserId));
        setPosts((prev) => (mode === "append" ? [...prev, ...mapped] : mapped));
        setPage(data.page);
        setHasMore(data.page < data.totalPages);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load posts",
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [currentUserId, pageSize, feedChannelId],
  );

  const reloadFeed = useCallback(async () => {
    setPage(1);
    setHasMore(true);
    await loadPage(1, "replace");
  }, [loadPage]);

  const refreshPost = async (postId: string) => {
    try {
      const data = await getSocialPost(postId);
      const updated = mapPost(data, currentUserId);
      setPosts((prev) => prev.map((p) => (String(p.id) === String(postId) ? updated : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh post");
    }
  };

  useEffect(() => {
    void loadPage(1, "replace");
  }, [loadPage]);

  useInvalidation(["social"], () => {
    void reloadFeed();
  });

  /* ---- real-time social sync ---- */

  const { addListener: addSocialListener } = useSocialSocket(currentUserId);

  useEffect(() => {
    return addSocialListener((event) => {
      if (event.type === "new_post" && event.post) {
        const mapped = mapPost(event.post as any, currentUserId);
        setPosts((prev) => {
          if (prev.some((p) => String(p.id) === String(mapped.id))) return prev;
          return [mapped, ...prev];
        });
      }

      if (event.type === "update_post" && event.post) {
        const mapped = mapPost(event.post as any, currentUserId);
        setPosts((prev) => prev.map((p) => (String(p.id) === String(mapped.id) ? mapped : p)));
      }

      if (event.type === "delete_post" && event.postId) {
        setPosts((prev) => prev.filter((p) => String(p.id) !== String(event.postId)));
      }

      if (event.type === "new_reaction" && event.postId) {
        void refreshPost(String(event.postId));
      }

      if (event.type === "remove_reaction" && event.postId) {
        void refreshPost(String(event.postId));
      }

      if (event.type === "new_comment" && event.postId) {
        void refreshPost(String(event.postId));
      }
    });
  }, [addSocialListener, currentUserId]);

  useEffect(() => {
    if (selectedChannel && channelTab === "chat") return; // don't infinite-scroll while in chat
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (isLoading || isLoadingMore) return;
        if (!hasMore) return;
        void loadPage(page + 1, "append");
      },
      { root: null, rootMargin: "300px 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [selectedChannel, channelTab, hasMore, isLoading, isLoadingMore, page, loadPage]);

  /* ---- post actions ---- */

  const handleCreatePost = async (
    content: string,
    channelIds: string[] = [],
    visibility: "PUBLIC" | "CHANNELS" = "PUBLIC",
    media?: File,
  ) => {
    if (!content.trim() && !media) return;
    setIsPosting(true);
    setError(null);
    try {
      if (media) {
        await createSocialPostWithMedia(
          media,
          requireUserId(),
          content || undefined,
          channelIds.length > 0 ? channelIds : undefined,
          visibility,
        );
      } else {
        await createSocialPost({
          userId: requireUserId(),
          content,
          channelIds: channelIds.length > 0 ? channelIds : undefined,
          visibility,
        });
      }
    } catch (postError) {
      console.error("Failed to create post:", postError);
      setError(
        postError instanceof Error
          ? postError.message
          : "Failed to create post",
      );
    } finally {
      setIsPosting(false);
    }
  };

  const handlePickReaction = async (
    postId: string,
    reactionType: SocialReactionType,
    commentId?: string,
  ) => {
    try {
      if (commentId) {
        // Comment reaction
        await addSocialReaction({
          userId: requireUserId(),
          commentId,
          type: reactionType,
        });
      } else {
        // Post reaction — toggle
        const post = posts.find((item) => String(item.id) === String(postId));
        if (!post) return;

        if (post.userReaction === reactionType) {
          await removeSocialReaction({ userId: requireUserId(), postId });
        } else {
          await addSocialReaction({
            userId: requireUserId(),
            postId,
            type: reactionType,
          });
        }
      }
      await refreshPost(postId);
    } catch (reactionError) {
      setError(
        reactionError instanceof Error
          ? reactionError.message
          : "Failed to update reaction",
      );
    }
  };

  const handleAddComment = async (postId: string, content: string, parentId?: string) => {
    if (!content.trim()) return;
    try {
      await createSocialComment({
        userId: requireUserId(),
        postId,
        content,
        parentId,
      });
      await refreshPost(postId);
    } catch (commentError) {
      setError(
        commentError instanceof Error
          ? commentError.message
          : "Failed to create comment",
      );
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteSocialPost(postId, requireUserId());
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete post",
      );
    }
  };

  /* ---- channel actions ---- */

  const loadChannels = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoadingChannels(true);
    try {
      const data = await getChatChannels(currentUserId);
      setChannels(data);
    } catch (err) {
      console.error("Failed to load channels:", err);
    } finally {
      setIsLoadingChannels(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  const handleCreateChannel = async (data: { name: string; description: string; icon: string }) => {
    if (!currentUserId) return;
    setIsCreatingChannel(true);
    try {
      await createChatChannel({
        name: data.name,
        description: data.description || undefined,
        icon: data.icon,
        userId: currentUserId,
      });
      setShowCreateChannel(false);
      await loadChannels();
    } catch (err) {
      console.error("Failed to create channel:", err);
      setError(err instanceof Error ? err.message : "Failed to create channel");
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const handleToggleFavorite = async (channelId: string) => {
    if (!currentUserId) return;
    try {
      const { isFavorite } = await toggleChannelFavorite(channelId, currentUserId);
      setChannels((prev) =>
        prev.map((ch) => {
          if (String(ch.id) !== channelId) return ch;
          return {
            ...ch,
            members: ch.members.map((m) =>
              String(m.userId) === currentUserId ? { ...m, isFavorite } : m,
            ),
          };
        }),
      );
    } catch {
      // silently fail
    }
  };

  const handleUpdateChannelIcon = async (channelId: string, iconOrFile: string | File) => {
    if (!currentUserId) return;
    try {
      if (iconOrFile instanceof File) {
        await uploadChannelIcon(channelId, currentUserId, iconOrFile);
      } else {
        await updateChatChannel(channelId, { userId: currentUserId, icon: iconOrFile });
      }
      await loadChannels();
    } catch (err) {
      console.error("Failed to update channel icon:", err);
    }
  };

  const handleArchiveChannel = async (channelId: string) => {
    if (!currentUserId) return;
    try {
      await deleteChatChannel(channelId, currentUserId);
      if (selectedChannel && String(selectedChannel.id) === channelId) {
        setSelectedChannel(null);
        setChannelTab("feed");
        setFeedChannelId(null);
      }
      await loadChannels();
    } catch (err) {
      console.error("Failed to archive channel:", err);
      setError(err instanceof Error ? err.message : "Failed to archive channel");
    }
  };

  const isChannelFavorite = (ch: (typeof channels)[number]) => {
    return ch.members.some(
      (m) => String(m.userId) === currentUserId && m.isFavorite,
    );
  };

  const favoriteChannels = useMemo(
    () => channels.filter(isChannelFavorite),
    [channels, currentUserId],
  );

  const otherChannels = useMemo(
    () => channels.filter((ch) => !isChannelFavorite(ch)),
    [channels, currentUserId],
  );

  const iconInputRef = useRef<HTMLInputElement | null>(null);
  const [iconUploadChannelId, setIconUploadChannelId] = useState<string | null>(null);

  const renderChannelIcon = (ch: (typeof channels)[number], isActive: boolean) => {
    const iconValue = ch.icon ?? "hash";
    // If icon is a URL (image upload), render as image
    if (iconValue.startsWith("http") || iconValue.startsWith("/")) {
      return (
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md overflow-hidden ${isActive ? "ring-2 ring-primary/30" : ""}`}>
          <img src={iconValue} alt={ch.name} className="h-7 w-7 object-cover" />
        </div>
      );
    }
    const { Icon: ChIcon } = getChannelIcon(iconValue);
    return (
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${isActive ? "bg-primary/20" : "bg-primary/10"}`}>
        <ChIcon className="h-4 w-4 text-primary" />
      </div>
    );
  };

  /* ---- channel selection (center Feed/Chat tabs) ---- */

  const selectChannel = (ch: ChatChannel) => {
    setSelectedChannel(ch);
    setChannelTab("feed"); // default tab is the feed
    setFeedChannelId(String(ch.id));
    setShowAllMembers(false);
    setPage(1);
    setHasMore(true);
    if (isMobile) setChannelsOpen(false);
  };

  const deselectChannel = () => {
    setSelectedChannel(null);
    setChannelTab("feed");
    setFeedChannelId(null);
    setPage(1);
    setHasMore(true);
  };

  const showFeedTab = () => {
    setChannelTab("feed");
    if (selectedChannel) setFeedChannelId(String(selectedChannel.id));
    setPage(1);
    setHasMore(true);
  };

  const showChatTab = () => setChannelTab("chat");

  const renderChannelItem = (ch: (typeof channels)[number]) => {
    const chId = String(ch.id);
    const isActive = String(selectedChannel?.id ?? "") === chId;
    const isFav = isChannelFavorite(ch);
    const isCreator = String(ch.createdById) === currentUserId;
    const isAdmin = ch.members.some(
      (m) => String(m.userId) === currentUserId && m.role === "ADMIN",
    );

    return (
      <div key={ch.id} className="group flex items-center">
        <button
          type="button"
          onClick={() => selectChannel(ch)}
          className={`flex flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
            isActive
              ? "bg-primary/15 font-medium text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {renderChannelIcon(ch, isActive)}
          <div className="min-w-0 flex-1">
            <span className="block truncate" title={ch.name}>{ch.name.length > 25 ? `${ch.name.slice(0, 25)}...` : ch.name}</span>
            {ch.description && (
              <span className="block truncate text-[10px] text-muted-foreground/70">
                {ch.description}
              </span>
            )}
          </div>
        </button>

        {/* Favorite + Context menu */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void handleToggleFavorite(chId);
            }}
            className={`p-1 rounded transition-colors ${
              isFav
                ? "text-amber-500"
                : "text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-amber-500"
            }`}
            title={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={`h-3.5 w-3.5 ${isFav ? "fill-amber-500" : ""}`} />
          </button>

          {(isAdmin || isCreator) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1 rounded text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-foreground transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIconUploadChannelId(chId);
                    setShowEditChannelDialog(true);
                    setEditChannelData({
                      id: chId,
                      name: ch.name,
                      description: ch.description || "",
                      icon: ch.icon || "hash",
                    });
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Edit Channel
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIconUploadChannelId(chId);
                    setTimeout(() => iconInputRef.current?.click(), 0);
                  }}
                >
                  <ImagePlus className="h-3.5 w-3.5 mr-2" />
                  Upload Icon Image
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleArchiveChannel(chId);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Archive className="h-3.5 w-3.5 mr-2" />
                  Archive Channel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  };

  /* ---- render ---- */

  return (
    <div className="page-shell">
      <div
        className="@container/social mx-auto w-full min-w-0 max-w-8xl overflow-x-hidden"
        style={navCollapsed ? { maxWidth: "calc(100% - 11.5rem)" } : undefined}
      >
        <div className="mb-3">
          <p className="section-label">Social</p>
          <h1 className="text-2xl font-semibold">Community Feed</h1>
        </div>
        <div className="grid gap-3 @[700px]/social:grid-cols-[minmax(240px,320px)_minmax(0,1fr)] @[1100px]/social:grid-cols-[minmax(240px,320px)_minmax(0,1fr)_minmax(240px,320px)]">
          {/* ====== Left sidebar: Groups + Profile (collapsed layout) ====== */}
          <aside
            className={`min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start ${
              selectedChannel && channelTab === "chat" ? "max-md:hidden" : ""
            }`}
          >
            {/* Groups / Teams card */}
            <Card className="flex flex-col gap-0 py-0" data-tour="social-channels" style={{ maxHeight: "calc(100vh - 140px)" }}>
              <div className="flex items-center justify-between px-3 py-3 shrink-0 border-b border-border">
                <button
                  type="button"
                  onClick={() => isMobile && setChannelsOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-left md:cursor-default"
                  aria-expanded={channelsVisible}
                >
                  <span className="text-sm font-semibold">Channels</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform md:hidden",
                      channelsVisible ? "rotate-180" : "",
                    )}
                  />
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setShowCreateChannel(true)}
                  title="Create channel"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div
                className={cn(
                  "flex-1 min-h-0 overflow-y-auto px-3 py-2",
                  channelsVisible ? "" : "hidden",
                )}
              >
                {isLoadingChannels ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading channels...</span>
                  </div>
                ) : channels.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No channels yet. Create one to get started.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {favoriteChannels.length > 0 && (
                      <>
                        <p className="px-2.5 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          Favorites
                        </p>
                        {favoriteChannels.map((ch) => renderChannelItem(ch))}
                        <div className="my-1 h-px bg-border" />
                        <p className="px-2.5 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          All Channels
                        </p>
                      </>
                    )}
                    {(favoriteChannels.length > 0 ? otherChannels : channels).map((ch) => renderChannelItem(ch))}
                  </div>
                )}
              </div>
            </Card>

            {/* Hidden file input for channel icon image upload */}
            <input
              ref={iconInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && iconUploadChannelId) {
                  void handleUpdateChannelIcon(iconUploadChannelId, file);
                  setIconUploadChannelId(null);
                }
                e.target.value = "";
              }}
            />

            {/* Profile card — shown here when right sidebar is hidden */}
            <Card className="gap-0 py-0 @[1100px]/social:hidden" data-tour="social-profile">
              <CardContent className="p-3">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/social/profile" })}
                  className="flex w-full items-center gap-3 rounded-md p-1.5 text-left hover:bg-muted"
                >
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      View profile
                    </p>
                  </div>
                </button>
                {profile.bio && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                    <Quote className="mt-0.5 h-3 w-3 shrink-0 scale-x-[-1] text-blue-500" />
                    <p className="line-clamp-3">{profile.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* ====== Main content ====== */}
          <main className="min-w-0 space-y-4">
            {selectedChannel && (
              /* ---- Channel header + Feed/Chat tabs (center) ---- */
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
                  onClick={deselectChannel}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  All Posts
                </Button>
                <div className="flex flex-1 items-center gap-1 rounded-lg border border-border bg-card p-1">
                  <button
                    type="button"
                    onClick={showFeedTab}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      channelTab === "feed"
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Rss className="h-4 w-4" /> Feed
                  </button>
                  <button
                    type="button"
                    onClick={showChatTab}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      channelTab === "chat"
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" /> Chat
                  </button>
                </div>
              </div>
            )}

            {selectedChannel && channelTab === "chat" ? (
              /* ---- Channel chat view ---- */
              <GroupChat
                channel={selectedChannel}
                currentUserId={currentUserId}
                currentUserName={fullName}
                currentUserAvatar={avatarSrc}
                currentUserInitials={initials}
                onBack={deselectChannel}
              />
            ) : (
              /* ---- Feed view (global, or channel-scoped when a channel is selected) ---- */
              <>
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span>
                      Unable to load posts. Start by creating your first post
                      below.
                    </span>
                  </div>
                )}

                <div data-tour="social-create-post">
                <CreatePostBox
                  avatarUrl={avatarSrc}
                  initials={initials}
                  onPost={(content, channelIds, visibility, media) =>
                    void handleCreatePost(content, channelIds, visibility, media)
                  }
                  isPosting={isPosting}
                  channels={channels}
                  orgName={orgName}
                  activeChannelId={selectedChannel ? String(selectedChannel.id) : undefined}
                />
                </div>

                <div className="space-y-4" data-tour="social-feed">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <span className="ml-3 text-muted-foreground">Loading posts...</span>
                    </div>
                  ) : posts.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-50" />
                        <p className="text-sm font-medium text-muted-foreground">
                          No posts yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Share something with your team to get the conversation
                          started.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={currentUserId}
                        currentUserAvatar={avatarSrc}
                        currentUserInitials={initials}
                        onReaction={(postId, type) =>
                          void handlePickReaction(postId, type)
                        }
                        onComment={(postId, content, parentId) =>
                          void handleAddComment(postId, content, parentId)
                        }
                        onCommentReaction={(commentId, type) =>
                          void handlePickReaction(String(post.id), type, commentId)
                        }
                        onDeletePost={(postId) => void handleDeletePost(postId)}
                        channels={channels}
                        onShare={(postId, channelIds, visibility) => {
                          void sharePostApi(postId, currentUserId, channelIds, visibility);
                        }}
                        onShareToChat={(postId, channelId) => {
                          const p = posts.find((pp) => pp.id === postId);
                          if (p) {
                            void sendChatMessage(channelId, currentUserId, p.content);
                          }
                        }}
                      />
                    ))
                  )}

                  {!isLoading && posts.length > 0 && (
                    <div
                      ref={(el) => {
                        loadMoreRef.current = el;
                      }}
                      className="py-6"
                    >
                      {hasMore ? (
                        <div className="flex items-center justify-center py-4">
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">Scroll to load more</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-xs text-muted-foreground">
                          You&apos;re all caught up.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </main>

          {/* ====== Right sidebar: Profile + channel members ====== */}
          <aside className="hidden @[1100px]/social:block @[1100px]/social:sticky @[1100px]/social:top-4 @[1100px]/social:self-start space-y-4">
            {/* Profile card — centered avatar, own email & number */}
            <Card className="gap-0 py-0">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/social/profile" })}
                  className="flex w-full flex-col items-center gap-2 rounded-md p-1.5 hover:bg-muted"
                >
                  <Avatar className="h-20 w-20 shrink-0">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <p className="text-base font-semibold text-foreground">
                    {fullName}
                  </p>
                </button>

                {/* Contact card: phone (only if present) + email */}
                <div className="mt-3 w-full space-y-2 rounded-lg border border-border p-3 text-left">
                  {profile.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{profile.phoneNumber}</span>
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                  )}
                </div>

                {profile.bio && (
                  <div className="mt-2 flex items-start gap-1.5 text-left text-xs leading-relaxed text-muted-foreground">
                    <Quote className="mt-0.5 h-3 w-3 shrink-0 scale-x-[-1] text-blue-500" />
                    <p className="line-clamp-3">{profile.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Members of the selected channel — empty when no channel is selected */}
            {selectedChannel && (
              <Card className="gap-0 py-0">
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                  <span className="text-sm font-semibold">
                    {selectedChannel.members.length}{" "}
                    {selectedChannel.members.length === 1 ? "member" : "members"}
                  </span>
                </div>
                <CardContent className="max-h-[420px] overflow-y-auto p-2">
                  <div className="space-y-0.5">
                    {(showAllMembers
                      ? selectedChannel.members
                      : selectedChannel.members.slice(0, MEMBERS_PREVIEW)
                    ).map((m) => {
                      const name =
                        [m.user.firstName, m.user.lastName]
                          .filter(Boolean)
                          .join(" ") || m.user.email;
                      const memInitials =
                        `${m.user.firstName?.[0] || ""}${m.user.lastName?.[0] || ""}`.toUpperCase() ||
                        "U";
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            navigate({
                              to: "/social/profile/$userId",
                              params: { userId: String(m.userId) },
                            })
                          }
                          className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left hover:bg-muted"
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={m.user.avatarUrl || undefined} />
                            <AvatarFallback>{memInitials}</AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                            {name}
                          </span>
                          {m.role === "ADMIN" && (
                            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              Admin
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
                {selectedChannel.members.length > MEMBERS_PREVIEW && (
                  <button
                    type="button"
                    onClick={() => setShowAllMembers((v) => !v)}
                    className="w-full border-t border-border px-3 py-2 text-center text-xs font-medium text-primary hover:bg-muted"
                  >
                    {showAllMembers
                      ? "Show less"
                      : `Show more (${selectedChannel.members.length - MEMBERS_PREVIEW})`}
                  </button>
                )}
              </Card>
            )}
          </aside>
        </div>
      </div>

      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        onCreate={(data) => void handleCreateChannel(data)}
        isCreating={isCreatingChannel}
      />

      {/* Edit Channel Dialog */}
      {editChannelData && (
        <EditChannelDialog
          open={showEditChannelDialog}
          onOpenChange={(open) => {
            setShowEditChannelDialog(open);
            if (!open) setEditChannelData(null);
          }}
          channel={editChannelData}
          currentUserId={currentUserId}
          onSave={async (data) => {
            try {
              await updateChatChannel(data.id, {
                userId: currentUserId,
                name: data.name,
                description: data.description,
                icon: data.icon,
              });
              setShowEditChannelDialog(false);
              setEditChannelData(null);
              await loadChannels();
            } catch (err) {
              console.error("Failed to update channel:", err);
            }
          }}
          onUploadImage={async (file) => {
            if (!editChannelData) return;
            await handleUpdateChannelIcon(editChannelData.id, file);
            setShowEditChannelDialog(false);
            setEditChannelData(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit Channel Dialog (inline)                                       */
/* ------------------------------------------------------------------ */

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
import { CHANNEL_ICONS } from "./CreateChannelDialog";

function EditChannelDialog({
  open,
  onOpenChange,
  channel,
  currentUserId: _currentUserId,
  onSave,
  onUploadImage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: { id: string; name: string; description: string; icon: string };
  currentUserId: string;
  onSave: (data: { id: string; name: string; description: string; icon: string }) => Promise<void>;
  onUploadImage: (file: File) => Promise<void>;
}) {
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description);
  const [icon, setIcon] = useState(channel.icon);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(channel.name);
    setDescription(channel.description);
    setIcon(channel.icon);
  }, [channel]);

  const isImageIcon = icon.startsWith("http") || icon.startsWith("/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Channel</DialogTitle>
          <DialogDescription>
            Update channel name, description, or icon.
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
                    icon === key && !isImageIcon
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted bg-card text-muted-foreground hover:border-primary/50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
              {/* Upload image button */}
              <button
                type="button"
                title="Upload image"
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                  isImageIcon
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted bg-card text-muted-foreground hover:border-primary/50",
                )}
              >
                {isImageIcon ? (
                  <img src={icon} alt="icon" className="h-7 w-7 rounded object-cover" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSaving(true);
                    void onUploadImage(file).finally(() => setSaving(false));
                  }
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-channel-name">Channel Name</Label>
            <Input
              id="edit-channel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-channel-desc">Description</Label>
            <Textarea
              id="edit-channel-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setSaving(true);
              void onSave({ id: channel.id, name: name.trim(), description: description.trim(), icon }).finally(() => setSaving(false));
            }}
            disabled={!name.trim() || saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
