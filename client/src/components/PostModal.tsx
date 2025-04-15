import { useEffect, useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import axios from "axios";
import { toast } from "sonner";

interface ICommentData {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  replies: {
    data: ICommentData[];
  };
  // Add other comment fields as needed
}

interface IPostData {
  id: string;
  caption: string;
  media_url: string;
  media_type: string;
  timestamp: string;
  likes_count?: number;
  comments_count?: number;
  comments?: {
    data: ICommentData[];
  };
}

interface IProfileData {
  username: string;
  profile_picture_url: string;
  // Add other profile fields as needed
}

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: IPostData;
  comment: string;
  setComment: (comment: string) => void;
  handleComment: () => void;
  profile: IProfileData;
  setIsLoading: (loading: boolean) => void;
  loading: boolean;
}

function PostModal({
  isOpen,
  onClose,
  post,
  comment,
  setComment,
  handleComment,
  profile,
  setIsLoading,
  loading,
}: PostModalProps) {
  const [comments, setComments] = useState<ICommentData[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  console.log(comments, "comments");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);

      // Load comments when modal opens
      if (post.comments?.data) {
        console.log(post, "all posts");
        setComments(post.comments.data);
      }
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;

    try {
      setIsLoading(true);
      await axios.post(`http://localhost:4000/api/comment`, {
        mediaId: post.id,
        message: replyText,
        accessToken: localStorage.getItem("accessToken"),
        replyToCommentId: commentId, // Send the parent comment ID
      });

      setReplyText("");
      setReplyingTo(null);
      toast("Reply posted successfully!");
      // Refresh comments
      fetchComments();
    } catch (err) {
      toast("Failed to post reply. Please try again.");
      console.error("Reply error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to toggle reply input for a comment
  const toggleReply = (commentId: string) => {
    if (replyingTo === commentId) {
      setReplyingTo(null);
    } else {
      setReplyingTo(commentId);
    }
  };

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const response = await axios.get(
        `http://localhost:4000/api/comments?mediaId=${
          post.id
        }&accessToken=${localStorage.getItem("accessToken")}`
      );
      console.log(response.data.data, "res in fetchComments");

      setComments(response.data.data || []);

      // Update the post's comments if they exist in the response
      if (response.data.data) {
        post.comments = { data: response.data.data };
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInSeconds = Math.floor(
      (now.getTime() - postDate.getTime()) / 1000
    );

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  if (!isOpen) return null;

  useEffect(() => {
    if (isOpen && post.id) {
      fetchComments();
    }
  }, [isOpen, post.id]);

  return (
    <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute cursor-pointer top-4 right-4 z-50 text-white hover:text-gray-300"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      <div className="relative bg-white h-[90vh] w-[90vw] max-w-6xl flex rounded-xl">
        {/* Close button */}

        {/* Post content - left side */}
        <div className="flex-1 bg-black/80 flex items-center justify-center">
          {post.media_type === "IMAGE" ||
          post.media_type === "CAROUSEL_ALBUM" ? (
            <img
              src={post.media_url}
              alt={post.caption || "Instagram post"}
              className="max-h-full max-w-full object-contain"
            />
          ) : post.media_type === "VIDEO" ? (
            <video controls className="max-h-full max-w-full">
              <source src={post.media_url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : null}
        </div>

        {/* Post details - right side */}
        <div className="w-[350px] flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center p-3 border-b">
            <Avatar className="w-8 h-8 mr-3">
              <AvatarImage
                src={
                  profile.profile_picture_url ||
                  "/placeholder.svg?height=32&width=32"
                }
                alt={`@${profile.username}`}
              />
              <AvatarFallback>
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm">{profile.username}</span>
            <Button variant="ghost" size="icon" className="ml-auto">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>

          {/* Comments section */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* Post caption */}
            {post.caption && (
              <div className="flex items-start mb-4">
                <Avatar className="w-8 h-8 mr-3">
                  <AvatarImage
                    src={
                      profile.profile_picture_url ||
                      "/placeholder.svg?height=32&width=32"
                    }
                    alt={`@${profile.username}`}
                  />
                  <AvatarFallback>
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm">
                    <span className="font-semibold">{profile.username}</span>{" "}
                    {post.caption}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(post.timestamp)} · Reply
                  </div>
                </div>
              </div>
            )}

            {/* Comments list */}
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-400"></div>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3 mb-4">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src="/placeholder.svg"
                      alt={`@${comment.username}`}
                    />
                    <AvatarFallback>
                      {comment.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="text-sm leading-snug">
                      <span className="font-semibold mr-1">
                        {comment.username}
                      </span>
                      {comment.text}
                    </div>
                    <div
                      className="text-xs text-gray-500 mt-1 cursor-pointer hover:underline"
                      onClick={() => toggleReply(comment.id)}
                    >
                      {formatTimeAgo(comment.timestamp)} · Reply
                    </div>

                    {/* Reply input */}
                    {replyingTo === comment.id && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Write a reply..."
                          className="flex-1 text-sm border-b border-gray-300 pb-1 outline-none"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleReply(comment.id)
                          }
                        />
                        <Button
                          variant="ghost"
                          className="text-blue-500 font-semibold text-sm cursor-pointer"
                          onClick={() => handleReply(comment.id)}
                          disabled={!replyText.trim() || loading}
                        >
                          {loading ? "Posting..." : "Post"}
                        </Button>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies?.data?.length > 0 && (
                      <div className="mt-3 ml-4 pl-3 border-l border-gray-200 space-y-2">
                        {comment.replies.data.map((reply) => (
                          <div
                            key={reply.id}
                            className="flex items-start gap-2"
                          >
                            <Avatar className="w-6 h-6">
                              <AvatarImage
                                src="/placeholder.svg"
                                alt={`@${reply.username}`}
                              />
                              <AvatarFallback>
                                {reply.username?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm">
                                <span className="font-semibold mr-1">
                                  {reply.username}
                                </span>
                                {reply.text}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {formatTimeAgo(reply.timestamp)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-2 cursor-pointer"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Action buttons */}
          <div className="p-3 border-t">
            <div className="flex items-center mb-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full p-0"
              >
                <Heart className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full p-0"
              >
                <MessageCircle className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full p-0"
              >
                <Send className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full p-0 ml-auto"
              >
                <Bookmark className="w-6 h-6" />
              </Button>
            </div>

            <div className="mb-2">
              <p className="text-sm">
                {post.likes_count || 0} like{post.likes_count !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-gray-500">
                {formatTimeAgo(post.timestamp)}
              </p>
            </div>

            {/* Comment input */}
            <div className="flex items-center border-t pt-3">
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 text-sm outline-none"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleComment()}
              />
              <Button
                variant="ghost"
                className="text-blue-500 font-semibold text-sm"
                onClick={handleComment}
                disabled={!comment.trim() || loading}
              >
                {loading ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostModal;
