"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import {
  Heart,
  ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  Smile,
  ThumbsUp,
  Video,
  X,
} from "lucide-react";
import { useState } from "react";

type Reaction = "like" | "love" | "celebrate";
type MediaType = "image" | "video" | null;

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
}

interface Post {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  mediaType: MediaType;
  mediaUrl: string | null;
  reactions: { like: number; love: number; celebrate: number };
  userReaction: Reaction | null;
  comments: Comment[];
  commentCount: number;
}

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    author: "Sarah Johnson",
    avatar: "/user-avatar-1.png",
    timestamp: "2h ago",
    content:
      "Just completed my first marathon training goal! 🎉 The daily routine tracker in this app helped me stay consistent. Feeling amazing!",
    mediaType: "image",
    mediaUrl: "/marathon-finish-line.png",
    reactions: { like: 24, love: 12, celebrate: 8 },
    userReaction: "celebrate",
    commentCount: 5,
    comments: [
      {
        id: "c1",
        author: "Mike Chen",
        avatar: "/diverse-user-avatar-set-2.png",
        content: "Congratulations! That's incredible dedication!",
        timestamp: "1h ago",
      },
      {
        id: "c2",
        author: "Emily White",
        avatar: "/diverse-user-avatars-3.png",
        content: "So inspiring! What was your training schedule like?",
        timestamp: "45m ago",
      },
    ],
  },
  {
    id: "2",
    author: "Alex Rivera",
    avatar: "/user-avatar-4.png",
    timestamp: "5h ago",
    content:
      "Pro tip: Break down your big goals into daily micro-tasks. I've been using the automation feature to remind me every morning. Game changer!",
    mediaType: null,
    mediaUrl: null,
    reactions: { like: 18, love: 6, celebrate: 3 },
    userReaction: "like",
    commentCount: 3,
    comments: [
      {
        id: "c3",
        author: "Jordan Lee",
        avatar: "/user-avatar-5.png",
        content: "Thanks for the tip! Just set up my first automation.",
        timestamp: "3h ago",
      },
    ],
  },
  {
    id: "3",
    author: "Maya Patel",
    avatar: "/user-avatar-6.png",
    timestamp: "1d ago",
    content:
      "Quick video showing how I organize my weekly goals in the app. Hope this helps someone! 💪",
    mediaType: "video",
    mediaUrl: "/productivity-setup-video.jpg",
    reactions: { like: 32, love: 15, celebrate: 11 },
    userReaction: null,
    commentCount: 8,
    comments: [],
  },
];

export default function SocialPage() {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<{
    type: MediaType;
    url: string | null;
  }>({
    type: null,
    url: null,
  });
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});

  const handleCreatePost = () => {
    if (!newPostContent.trim() && !selectedMedia.url) return;

    const newPost: Post = {
      id: Date.now().toString(),
      author: "You",
      avatar: "/current-user.jpg",
      timestamp: "Just now",
      content: newPostContent,
      mediaType: selectedMedia.type,
      mediaUrl: selectedMedia.url,
      reactions: { like: 0, love: 0, celebrate: 0 },
      userReaction: null,
      commentCount: 0,
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setNewPostContent("");
    setSelectedMedia({ type: null, url: null });
  };

  const handleReaction = (postId: string, reaction: Reaction) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const newReactions = { ...post.reactions };
          if (post.userReaction) {
            newReactions[post.userReaction]--;
          }
          if (post.userReaction === reaction) {
            return { ...post, userReaction: null, reactions: newReactions };
          } else {
            newReactions[reaction]++;
            return { ...post, userReaction: reaction, reactions: newReactions };
          }
        }
        return post;
      })
    );
  };

  const handleAddComment = (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const newComment: Comment = {
            id: Date.now().toString(),
            author: "You",
            avatar: "/current-user.jpg",
            content: commentText,
            timestamp: "Just now",
          };
          return {
            ...post,
            comments: [...post.comments, newComment],
            commentCount: post.commentCount + 1,
          };
        }
        return post;
      })
    );

    setCommentInputs({ ...commentInputs, [postId]: "" });
  };

  const handleMediaSelect = (type: "image" | "video") => {
    // Simulate file upload - in real app, this would open file picker
    const mockUrl = `/placeholder.svg?height=400&width=600&query=${type}+upload`;
    setSelectedMedia({ type, url: mockUrl });
  };

  const totalReactions = (reactions: {
    like: number;
    love: number;
    celebrate: number;
  }) => {
    return reactions.like + reactions.love + reactions.celebrate;
  };

  return (
    <div className="min-h-screen ">
      <div className="mx-auto max-w-2xl space-y-6 my-3">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Community</h1>
          <p className="text-muted-foreground">
            Share your journey and inspire others
          </p>
        </div>

        {/* Create Post Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Create a Post</CardTitle>
            <CardDescription>
              Share your progress, tips, or motivation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Avatar>
                <AvatarImage src="/current-user.jpg" />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="What's on your mind? Share your goals, achievements, or tips..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            {selectedMedia.url && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 z-10 bg-background/80 hover:bg-background"
                  onClick={() => setSelectedMedia({ type: null, url: null })}
                >
                  <X className="h-4 w-4" />
                </Button>
                {selectedMedia.type === "image" ? (
                  <img
                    src={selectedMedia.url || "/placeholder.svg"}
                    alt="Upload preview"
                    className="w-full rounded-lg border"
                  />
                ) : (
                  <div className="relative w-full aspect-video rounded-lg border bg-muted flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Badge>Video Preview</Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMediaSelect("image")}
                  className="gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  Image
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMediaSelect("video")}
                  className="gap-2"
                >
                  <Video className="h-4 w-4" />
                  Video
                </Button>
              </div>
              <Button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() && !selectedMedia.url}
              >
                Post
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarImage src={post.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{post.author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">
                        {post.author}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {post.timestamp}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Post Content */}
                <p className="text-foreground leading-relaxed">
                  {post.content}
                </p>

                {/* Post Media */}
                {post.mediaUrl && (
                  <div className="rounded-lg overflow-hidden border">
                    {post.mediaType === "image" ? (
                      <img
                        src={post.mediaUrl || "/placeholder.svg"}
                        alt="Post content"
                        className="w-full"
                      />
                    ) : (
                      <div className="relative w-full aspect-video bg-muted flex items-center justify-center">
                        <Video className="h-12 w-12 text-muted-foreground" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Badge>Video Content</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reactions Summary */}
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

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex-1 gap-2",
                      post.userReaction === "like" && "text-primary"
                    )}
                    onClick={() => handleReaction(post.id, "like")}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Like
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex-1 gap-2",
                      post.userReaction === "love" && "text-destructive"
                    )}
                    onClick={() => handleReaction(post.id, "love")}
                  >
                    <Heart className="h-4 w-4" />
                    Love
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex-1 gap-2",
                      post.userReaction === "celebrate" && "text-accent"
                    )}
                    onClick={() => handleReaction(post.id, "celebrate")}
                  >
                    <Smile className="h-4 w-4" />
                    Celebrate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() =>
                      setShowComments({
                        ...showComments,
                        [post.id]: !showComments[post.id],
                      })
                    }
                  >
                    <MessageCircle className="h-4 w-4" />
                    Comment ({post.commentCount})
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      {/* Existing Comments */}
                      {post.comments.length > 0 && (
                        <div className="space-y-3">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={comment.avatar || "/placeholder.svg"}
                                />
                                <AvatarFallback>
                                  {comment.author[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="bg-muted rounded-lg px-3 py-2">
                                  <p className="font-semibold text-sm">
                                    {comment.author}
                                  </p>
                                  <p className="text-sm text-foreground">
                                    {comment.content}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground px-3">
                                  {comment.timestamp}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment */}
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/current-user.jpg" />
                          <AvatarFallback>You</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <Input
                            placeholder="Write a comment..."
                            value={commentInputs[post.id] || ""}
                            onChange={(e) =>
                              setCommentInputs({
                                ...commentInputs,
                                [post.id]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddComment(post.id);
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleAddComment(post.id)}
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
          ))}
        </div>
      </div>
    </div>
  );
}
