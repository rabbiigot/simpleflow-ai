"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textArea";
import {
  addSocialReaction,
  createSocialComment,
  createSocialPost,
  getSocialPosts,
  getCurrentUserId,
  removeSocialReaction,
  type SocialPost,
  type SocialReactionType,
} from "@/lib/backend-api";
import { cn } from "@/lib/utils";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  Smile,
  ThumbsUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Reaction = "like" | "love" | "celebrate";

type UiPost = {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  reactions: { like: number; love: number; celebrate: number };
  userReaction: Reaction | null;
  comments: Array<{
    id: string;
    author: string;
    avatar: string;
    content: string;
    timestamp: string;
  }>;
  commentCount: number;
};

function toReactionType(reaction: Reaction): SocialReactionType {
  switch (reaction) {
    case "like":
      return "LIKE";
    case "love":
      return "LOVE";
    case "celebrate":
      return "CELEBRATE";
    default:
      return "LIKE";
  }
}

function toReactionLabel(type: SocialReactionType): Reaction {
  switch (type) {
    case "LOVE":
      return "love";
    case "CELEBRATE":
      return "celebrate";
    case "LIKE":
    default:
      return "like";
  }
}

function displayName(post: SocialPost) {
  const firstName = post.user?.firstName?.trim();
  const lastName = post.user?.lastName?.trim();

  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(" ");
  }

  return post.user?.email || "User";
}

function mapPost(post: SocialPost): UiPost {
  const reactionSummary = { like: 0, love: 0, celebrate: 0 };
  let userReaction: Reaction | null = null;

  for (const reaction of post.reactions ?? []) {
    const label = toReactionLabel(reaction.type);
    reactionSummary[label] += 1;

    if (reaction.userId === getCurrentUserId()) {
      userReaction = label;
    }
  }

  const comments = (post.comments ?? []).map((comment) => ({
    id: comment.id,
    author:
      [comment.user?.firstName, comment.user?.lastName]
        .filter(Boolean)
        .join(" ") ||
      comment.user?.email ||
      "User",
    avatar: "/placeholder.svg",
    content: comment.content,
    timestamp: new Date(comment.createdAt).toLocaleString(),
  }));

  return {
    id: post.id,
    author: displayName(post),
    avatar: "/placeholder.svg",
    timestamp: new Date(post.createdAt).toLocaleString(),
    content: post.content,
    reactions: reactionSummary,
    userReaction,
    comments,
    commentCount: comments.length,
  };
}

export default function SocialPage() {
  const [posts, setPosts] = useState<UiPost[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requireUserId = () => {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error("No signed-in user id found. Please sign up or log in again.");
    }
    return userId;
  };

  const loadPosts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getSocialPosts();
      setPosts(data.map(mapPost));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      return;
    }

    try {
      await createSocialPost({ userId: requireUserId(), content: newPostContent });
      setNewPostContent("");
      await loadPosts();
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : "Failed to create post");
    }
  };

  const handleReaction = async (postId: string, reaction: Reaction) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) {
      return;
    }

    try {
      if (post.userReaction === reaction) {
        await removeSocialReaction({ userId: requireUserId(), postId });
      } else {
        if (post.userReaction) {
          await removeSocialReaction({ userId: requireUserId(), postId });
        }

        await addSocialReaction({
          userId: requireUserId(),
          postId,
          type: toReactionType(reaction),
        });
      }

      await loadPosts();
    } catch (reactionError) {
      setError(
        reactionError instanceof Error
          ? reactionError.message
          : "Failed to update reaction",
      );
    }
  };

  const handleAddComment = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) {
      return;
    }

    try {
      await createSocialComment({
        userId: requireUserId(),
        postId,
        content: commentText,
      });
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      await loadPosts();
    } catch (commentError) {
      setError(
        commentError instanceof Error
          ? commentError.message
          : "Failed to create comment",
      );
    }
  };

  const totalReactions = useMemo(() => {
    return (reactions: { like: number; love: number; celebrate: number }) => {
      return reactions.like + reactions.love + reactions.celebrate;
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl space-y-6 my-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Community</h1>
          <p className="text-muted-foreground">Share your journey and inspire others</p>
        </div>

        {error && (
          <Card className="border-red-300">
            <CardContent className="pt-6 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Create a Post</CardTitle>
            <CardDescription>Publish directly to your backend social feed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Avatar>
                <AvatarImage src="/current-user.jpg" />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(event) => setNewPostContent(event.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">User ID: {getCurrentUserId() || "Not set"}</p>
              <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                Post
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">Loading posts...</CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <Avatar>
                        <AvatarImage src={post.avatar} />
                        <AvatarFallback>{post.author[0] ?? "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{post.author}</p>
                        <p className="text-sm text-muted-foreground">{post.timestamp}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground leading-relaxed">{post.content}</p>

                  {totalReactions(post.reactions) > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex -space-x-1">
                        {post.reactions.like > 0 && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                            <ThumbsUp className="h-3 w-3" />
                          </div>
                        )}
                        {post.reactions.love > 0 && (
                          <div className="h-5 w-5 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground">
                            <Heart className="h-3 w-3" />
                          </div>
                        )}
                        {post.reactions.celebrate > 0 && (
                          <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-accent-foreground">
                            <Smile className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <span>{totalReactions(post.reactions)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("flex-1 gap-2", post.userReaction === "like" && "text-primary")}
                      onClick={() => void handleReaction(post.id, "like")}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Like
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "flex-1 gap-2",
                        post.userReaction === "love" && "text-destructive",
                      )}
                      onClick={() => void handleReaction(post.id, "love")}
                    >
                      <Heart className="h-4 w-4" />
                      Love
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "flex-1 gap-2",
                        post.userReaction === "celebrate" && "text-accent",
                      )}
                      onClick={() => void handleReaction(post.id, "celebrate")}
                    >
                      <Smile className="h-4 w-4" />
                      Celebrate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() =>
                        setShowComments((prev) => ({
                          ...prev,
                          [post.id]: !prev[post.id],
                        }))
                      }
                    >
                      <MessageCircle className="h-4 w-4" />
                      Comment ({post.commentCount})
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {showComments[post.id] && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        {post.comments.length > 0 && (
                          <div className="space-y-3">
                            {post.comments.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={comment.avatar} />
                                  <AvatarFallback>{comment.author[0] ?? "U"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                  <div className="bg-muted rounded-lg px-3 py-2">
                                    <p className="font-semibold text-sm">{comment.author}</p>
                                    <p className="text-sm text-foreground">{comment.content}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground px-3">{comment.timestamp}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/current-user.jpg" />
                            <AvatarFallback>You</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <Input
                              placeholder="Write a comment..."
                              value={commentInputs[post.id] || ""}
                              onChange={(event) =>
                                setCommentInputs((prev) => ({
                                  ...prev,
                                  [post.id]: event.target.value,
                                }))
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  void handleAddComment(post.id);
                                }
                              }}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => void handleAddComment(post.id)}
                              disabled={!commentInputs[post.id]?.trim()}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
