import { useEffect, useRef, useState } from "react";
import { Heart, MoreHorizontal, X } from "lucide-react";
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
  console.log(post, "post here");

  const [comments, setComments] = useState<ICommentData[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<
    Record<string, boolean>
  >({});
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };
  console.log(comments, "comments");

  const hasReplies = (comment: ICommentData) => {
    return comment.replies?.data?.length > 0;
  };

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
      await axios.post(`${process.env.NEXT_SERVER_API_URL}/api/comment`, {
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
  const toggleReply = (commentId: string, username: string) => {
    if (replyingTo === commentId) {
      setReplyingTo(null);
      setReplyText("");
    } else {
      setReplyingTo(commentId);
      setReplyText(`@${username} `);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const response = await axios.get(
        `${process.env.NEXT_SERVER_API_URL}/api/comments?mediaId=${
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
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  useEffect(() => {
    if (isOpen && post.id) {
      fetchComments();
    }
  }, [isOpen, post.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute cursor-pointer top-4 right-4 z-50 text-white hover:text-gray-300"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      <div className="relative bg-white h-[95vh] w-[120vw] max-w-9/12 flex rounded-r-sm">
        {/* Close button */}

        {/* Post content - left side */}
        <div className="flex-1 bg-black flex items-center justify-center">
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
        <div className="w-[500px] flex flex-col bg-white rounded-r-sm">
          {/* Header */}
          <div className="flex items-center p-3 border-b border-[#efefef]">
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
            ) : comment.length === 0 ? (
              <div className="flex flex-col justify-center py-4 items-center h-3/4 space-y-2">
                <div className="text-black font-bold text-2xl">
                  No comments yet.
                </div>
                <p className="text-sm">Start the conversation.</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3 mb-4">
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

                  <div className="flex-1">
                    <div className="text-sm leading-snug">
                      <span className="font-semibold mr-1">
                        {comment.username}
                      </span>
                      {comment.text}
                    </div>
                    <div className="flex gap-x-4 items-end">
                      <div className="text-xs text-gray-500 mt-1 cursor-pointer ">
                        {formatTimeAgo(comment.timestamp)} ·{" "}
                        <span
                          onClick={() =>
                            toggleReply(comment.id, comment.username)
                          }
                          className="hover:underline"
                        >
                          Reply
                        </span>
                      </div>
                      <MoreHorizontal className="w-4 h-4" />
                    </div>
                    <div className="flex gap-x-4 items-center mt-2">
                      {hasReplies(comment) && (
                        <>
                          <div className="border h-0.5 w-4 border-b border-black" />
                          <div
                            className="text-xs text-gray-500 mt-1 cursor-pointer hover:underline"
                            onClick={() => toggleReplies(comment.id)}
                          >
                            {expandedReplies[comment.id]
                              ? "Hide replies"
                              : `View replies (${comment.replies.data.length})`}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Reply input */}
                    {/* {replyingTo === comment.id && (
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
                      )} */}

                    {/* Replies */}
                    {expandedReplies[comment.id] &&
                      comment.replies?.data?.length > 0 && (
                        <div className="mt-3 ml-4 pl-3 border-l border-gray-200 space-y-2">
                          {comment.replies.data.map((reply) => (
                            <div
                              key={reply.id}
                              className="flex items-start gap-2"
                            >
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
                                  <span className="font-semibold mr-1">
                                    {reply.username}
                                  </span>
                                  {reply.text}
                                </div>
                                <div className="flex gap-x-4 items-end">
                                  <div className="text-xs text-gray-500 mt-1 cursor-pointer ">
                                    {formatTimeAgo(reply.timestamp)} ·{" "}
                                    <span
                                      onClick={() =>
                                        toggleReply(reply.id, comment.username)
                                      }
                                      className="hover:underline"
                                    >
                                      Reply
                                    </span>
                                  </div>
                                  <MoreHorizontal className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                  <Heart className="w-3 h-3 cursor-pointer" />
                </div>
              ))
            )}
          </div>

          {/* Action buttons */}
          <div className="p-3 border-t border-[#efefef]">
            <div className="flex items-center justify-between mb-3 gap-x-4">
              <div className="flex items-center gap-x-4">
                <svg
                  aria-label="Like"
                  className="x1lliihq x1n2onr6 xyb1xck"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title>Like</title>
                  <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"></path>
                </svg>
                <svg
                  aria-label="Comment"
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title>Comment</title>
                  <path
                    d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linejoin="round"
                    stroke-width="2"
                  ></path>
                </svg>
                <svg
                  aria-label="Share Post"
                  className="x1lliihq x1n2onr6 x5n08af"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title>Share Post</title>
                  <line
                    fill="none"
                    stroke="currentColor"
                    stroke-linejoin="round"
                    stroke-width="2"
                    x1="22"
                    x2="9.218"
                    y1="3"
                    y2="10.083"
                  ></line>
                  <polygon
                    fill="none"
                    points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"
                    stroke="currentColor"
                    stroke-linejoin="round"
                    stroke-width="2"
                  ></polygon>
                </svg>
              </div>
              <div className="">
                <svg
                  aria-label="Save"
                  className="x1lliihq x1n2onr6 x5n08af cursor-pointer"
                  fill="currentColor"
                  height="24"
                  role="img"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <title>Save</title>
                  <polygon
                    fill="none"
                    points="20 21 12 13.44 4 21 4 3 20 3 20 21"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  ></polygon>
                </svg>
              </div>
            </div>

            <div className="mb-2">
              <p className="text-sm flex flex-col space-y-2">
                {post.likes_count == 0 ? (
                  <span>
                    Be the first to <b>like this</b>
                  </span>
                ) : (
                  `${post.likes_count || 0} like${
                    post.likes_count !== 1 ? "s" : ""
                  }`
                )}{" "}
              </p>
              <p className="text-xs text-gray-500">
                {formatTimeAgo(post.timestamp)}
              </p>
            </div>

            {/* Comment input */}
            <div className="flex items-center border-t border-[#efefef] pt-3">
              <svg
                aria-label="Emoji"
                className="x1lliihq x1n2onr6 x5n08af"
                fill="currentColor"
                height="24"
                role="img"
                viewBox="0 0 24 24"
                width="24"
              >
                <title>Emoji</title>
                <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Add a comment..."
                className="flex-1 pl-5 text-sm outline-none"
                value={replyingTo ? replyText : comment}
                onChange={(e) => {
                  if (replyingTo) setReplyText(e.target.value);
                  else setComment(e.target.value);
                }}
                // onKeyPress={async (e) => {
                //   e.key === "Enter" && replyingTo
                //     ? await handleReply(replyingTo)
                //     : handleComment();
                // }}
                autoFocus={replyingTo ? true : false}
              />
              <Button
                variant="ghost"
                className="text-blue-500 font-semibold text-sm"
                onClick={async () => {
                  replyingTo ? await handleReply(replyingTo) : handleComment();
                }}
                disabled={
                  replyingTo ? !replyText.trim() : !comment.trim() || loading
                }
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
