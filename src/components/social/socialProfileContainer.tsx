import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  addSocialReaction,
  createSocialComment,
  getCurrentUserId,
  getUserProfile,
  listPostsByUser,
  removeSocialReaction,
  updateUserProfile,
  uploadProfileImage,
  type SocialReactionType,
  type UserProfile,
} from "@/lib/backend-api";
import { Textarea } from "@/components/ui/textArea";
import { useAuthStore } from "@/store/auth-store";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ArrowLeft, Camera, Check, ImagePlus, Loader2, MessageSquare, Pencil, Pin, Rss, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import PostCard from "./PostCard";
import ProfileSettings, { NAV_SECTIONS, type SettingsTab } from "./ProfileSettings";
import { mapPost, type UiPost } from "./types";

type ProfileTab = "posts" | SettingsTab;

type Props = {
  profileUserId?: string;
  initialTab?: string;
};

export default function SocialProfileContainer({ profileUserId, initialTab }: Props) {
  const navigate = useNavigate();
  const authUser = useAuthStore((store) => store.user);
  const currentUserId = authUser?.id != null ? String(authUser.id) : getCurrentUserId();
  const targetUserId = profileUserId || currentUserId;
  const isOwnProfile = targetUserId === currentUserId;

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);

  // Posts state
  const [posts, setPosts] = useState<UiPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 8;

  const [activeTab, setActiveTab] = useState<ProfileTab>((initialTab as ProfileTab) || "posts");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editBioValue, setEditBioValue] = useState("");
  const [isSavingBio, setIsSavingBio] = useState(false);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab as ProfileTab);
  }, [initialTab]);

  const handleSaveBio = async () => {
    if (!currentUserId) return;
    setIsSavingBio(true);
    try {
      const updated = await updateUserProfile(currentUserId, { bio: editBioValue.trim() });
      setProfileData(updated);
      setIsEditingBio(false);
      toast.success("Bio updated");
    } catch {
      toast.error("Failed to update bio");
    } finally {
      setIsSavingBio(false);
    }
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const displayName = useMemo(() => {
    if (!profileData) return "User";
    return [profileData.firstName, profileData.lastName].filter(Boolean).join(" ") || "User";
  }, [profileData]);

  const initials = useMemo(() => {
    const first = profileData?.firstName?.[0] || "";
    const last = profileData?.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "U";
  }, [profileData]);

  const avatarSrc = profileData?.avatarUrl || "/placeholder.svg";
  const coverSrc = profileData?.coverUrl || "";

  // Reset cover loaded state when cover URL changes
  useEffect(() => {
    setIsCoverLoaded(false);
  }, [coverSrc]);

  // Load profile
  useEffect(() => {
    if (!targetUserId) return;
    setIsLoadingProfile(true);
    getUserProfile(targetUserId)
      .then((data) => {
        setProfileData(data);
      })
      .catch(() => { })
      .finally(() => setIsLoadingProfile(false));
  }, [targetUserId]);

  // Load posts
  const loadPosts = useCallback(
    async (nextPage: number, mode: "replace" | "append") => {
      if (!targetUserId) return;
      if (mode === "replace") setIsLoadingPosts(true);
      else setIsLoadingMore(true);

      try {
        const data = await listPostsByUser(targetUserId, nextPage, pageSize, currentUserId || undefined);
        const mapped = data.items.map((item) => mapPost(item, currentUserId));
        setPosts((prev) => (mode === "append" ? [...prev, ...mapped] : mapped));
        setPage(data.page);
        setHasMore(data.page < data.totalPages);
      } catch {
        // silent
      } finally {
        setIsLoadingPosts(false);
        setIsLoadingMore(false);
      }
    },
    [targetUserId, currentUserId, pageSize],
  );

  useEffect(() => {
    void loadPosts(1, "replace");
  }, [loadPosts]);

  // Infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          void loadPosts(page + 1, "append");
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, page, loadPosts]);

  // Post interactions
  const handleReaction = async (postId: string, type: SocialReactionType) => {
    if (!currentUserId) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    if (post.userReaction === type) {
      await removeSocialReaction(postId, currentUserId).catch(() => { });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, userReaction: null, reactionCounts: { ...p.reactionCounts, [type]: Math.max(0, (p.reactionCounts[type] || 0) - 1) } }
            : p,
        ),
      );
    } else {
      await addSocialReaction(postId, currentUserId, type).catch(() => { });
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const counts = { ...p.reactionCounts };
          if (p.userReaction) counts[p.userReaction] = Math.max(0, (counts[p.userReaction] || 0) - 1);
          counts[type] = (counts[type] || 0) + 1;
          return { ...p, userReaction: type, reactionCounts: counts };
        }),
      );
    }
  };

  const handleComment = async (postId: string, content: string, parentId?: string) => {
    if (!currentUserId) return;
    try {
      const comment = await createSocialComment(postId, currentUserId, content, parentId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const newComment = {
            id: String(comment.id),
            userId: currentUserId,
            author: displayName,
            avatar: avatarSrc,
            content,
            timestamp: "just now",
            createdAtMs: Date.now(),
            reactions: [],
            replies: [],
          };
          return { ...p, comments: [...p.comments, newComment], commentCount: p.commentCount + 1 };
        }),
      );
    } catch { /* silent */ }
  };

  // Image upload
  const handleUploadImage = async (
    event: ChangeEvent<HTMLInputElement>,
    type: "avatar" | "cover",
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentUserId || !isOwnProfile) return;

    const setter = type === "avatar" ? setIsUploadingAvatar : setIsUploadingCover;
    setter(true);

    try {
      const updated = await uploadProfileImage(currentUserId, file, type);
      setProfileData(updated);
      toast.success(`${type === "avatar" ? "Profile picture" : "Cover photo"} updated`);
    } catch {
      toast.error(`Failed to upload ${type === "avatar" ? "profile picture" : "cover photo"}`);
    } finally {
      setter(false);
    }
  };

  // Current user info for PostCard
  const currentUserInitials = useMemo(() => {
    const au = authUser;
    if (!au) return "U";
    const f = au.firstName?.[0] || "";
    const l = au.lastName?.[0] || "";
    return `${f}${l}`.toUpperCase() || "U";
  }, [authUser]);

  return (
    <div className="page-shell">
      <div className="mb-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/social" })}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Social
        </Button>
        <p className="section-label !mb-0">Profile</p>
      </div>
      <div className="mx-auto max-w-8xl space-y-6">
        {isLoadingProfile && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading profile...</span>
          </div>
        )}

        {/* Profile Header Card */}
        <Card className="overflow-hidden rounded-xl shadow-sm p-0">
          {/* Cover Photo — full header */}
          <div
            className={`relative h-48 sm:h-60 bg-cover bg-center ${coverSrc ? "" : "bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5"}`}
            style={coverSrc && isCoverLoaded ? { backgroundImage: `url(${coverSrc})` } : undefined}
          >
            {coverSrc && !isCoverLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {coverSrc && (
              <img
                src={coverSrc}
                alt=""
                className="hidden"
                onLoad={() => setIsCoverLoaded(true)}
              />
            )}
            {isOwnProfile && (
              <>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadImage(e, "cover")}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-3 right-3 gap-2 bg-white text-black hover:bg-white/90"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                >
                  <ImagePlus className="h-4 w-4" />
                  {isUploadingCover ? "Uploading..." : coverSrc ? "Change Cover" : "Add Cover Photo"}
                </Button>
              </>
            )}
          </div>

          {/* Avatar + Name + Actions bar */}
          <div className="relative px-6 pb-4">
            {/* Avatar overlapping cover */}
            <div className="absolute -top-12 left-6">
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setShowAvatarPreview(true)}
                  className="cursor-pointer rounded-full"
                >
                  <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </div>

              {/* Avatar preview dialog */}
              <Dialog open={showAvatarPreview} onOpenChange={setShowAvatarPreview}>
                <DialogContent showCloseButton={false} className="sm:max-w-md flex flex-col items-center gap-4 p-6">
                  <div className="flex w-full justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAvatarPreview(false)}
                      className="rounded-full p-1 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <Avatar className="h-48 w-48">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback className="text-4xl">{initials}</AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          handleUploadImage(e, "avatar");
                          setShowAvatarPreview(false);
                        }}
                      />
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                      >
                        <Camera className="h-4 w-4" />
                        {isUploadingAvatar ? "Uploading..." : "Upload Photo"}
                      </Button>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {/* Name row */}
            <div className="pt-14">
              <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
              {profileData?.email && (
                <p className="text-sm text-muted-foreground">{profileData.email}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Layout: sidebar + content */}
        <div className="flex gap-6 flex-col md:flex-row">
          {/* Left sidebar navigation */}
          {isOwnProfile && (
            <nav className="w-full md:w-64 shrink-0">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Profile Details</h3>
              <Card className="rounded-md shadow-sm p-0">
                <div className="flex flex-col p-2">
                  {/* Posts item */}
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Feed
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("posts")}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                      activeTab === "posts"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Rss className="h-4 w-4" />
                    Posts
                  </button>

                  {/* Settings sections */}
                  {NAV_SECTIONS.map((section) => (
                    <div key={section.label}>
                      <div className="mx-2 my-2 border-t border-border" />
                      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        {section.label}
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {section.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveTab(item.id)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                              activeTab === item.id
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {item.icon}
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </nav>
          )}

          {/* Content area */}
          {activeTab === "posts" ? (
            <div className="flex flex-1 gap-6 min-w-0">
              {/* Posts feed */}
              <div className="w-full max-w-[680px] space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {isOwnProfile ? "Your Posts" : `Posts by ${displayName}`}
                </h3>
                <div className="space-y-4">

                {isLoadingPosts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">Loading posts...</span>
                  </div>
                ) : posts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-50" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {isOwnProfile ? "You haven't posted anything yet" : "No public posts yet"}
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
                      currentUserInitials={currentUserInitials}
                      onReaction={(postId, type) => void handleReaction(postId, type)}
                      onComment={(postId, content, parentId) => void handleComment(postId, content, parentId)}
                    />
                  ))
                )}

                {!isLoadingPosts && posts.length > 0 && (
                  <div
                    ref={(el) => { loadMoreRef.current = el; }}
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
              </div>

              {/* Bio sticky note on the right */}
              <div className="hidden lg:block flex-1 min-w-[200px] mt-7 sticky top-6">
                <div className="relative rounded-md bg-amber-50 dark:bg-blue-900/20 border border-amber-200 dark:border-blue-400/25 shadow-sm overflow-visible">
                  {/* Pin icon — overlapping top-right */}
                  <Pin className="absolute -top-3 right-3 h-6 w-6 text-indigo-700 fill-indigo-700 dark:text-blue-400 dark:fill-blue-400 rotate-45 z-10 drop-shadow-sm" />

                  <div className="px-3 pt-4 pb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600/60 dark:text-blue-400/50 mb-2">Bio</p>
                    {isEditingBio ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editBioValue}
                          onChange={(e) => setEditBioValue(e.target.value)}
                          placeholder="Write something about yourself..."
                          className="min-h-[80px] resize-none text-sm bg-white/60 dark:bg-black/20 border-amber-200 dark:border-blue-400/25"
                          autoFocus
                        />
                        <div className="flex gap-1.5 justify-end">
                          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setIsEditingBio(false)} disabled={isSavingBio}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" className="h-7 px-2" onClick={() => void handleSaveBio()} disabled={isSavingBio}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative">
                        {/* Lined note lines */}
                        <div className="absolute inset-0 pointer-events-none dark:hidden" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, rgba(180,160,120,0.15) 23px, rgba(180,160,120,0.15) 24px)", backgroundPositionY: "2px" }} />
                        <div className="absolute inset-0 pointer-events-none hidden dark:block" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, rgba(96,165,250,0.15) 23px, rgba(96,165,250,0.15) 24px)", backgroundPositionY: "2px" }} />
                        <p className="relative text-sm text-amber-900/80 dark:text-blue-200/80 whitespace-pre-line" style={{ lineHeight: "24px" }}>
                          {profileData?.bio || "No bio yet."}
                        </p>
                        {isOwnProfile && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditBioValue(profileData?.bio || "");
                              setIsEditingBio(true);
                            }}
                            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-1 hover:bg-amber-200/50 dark:hover:bg-blue-400/15 cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5 text-amber-700 dark:text-blue-400" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Settings tabs — rendered by ProfileSettings in embedded mode */
            <div className="flex-1 min-w-0 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.id === activeTab)?.label ?? activeTab}
              </h3>
              <ProfileSettings embedded initialTab={activeTab as SettingsTab} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
