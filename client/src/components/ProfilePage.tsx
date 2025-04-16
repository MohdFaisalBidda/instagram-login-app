import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Camera,
  Grid,
  Film,
  Bookmark,
  Tag,
  Settings,
  MessageCircle,
  Heart,
  Plus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import PostModal from "./PostModal";
import { toast } from "sonner";

export interface IProfileData {
  username: string;
  profile_picture_url: string;
  followers_count: number;
  media_count: number;
  name?: string;
}

export interface IPostData {
  id: string;
  caption: string;
  media_url: string;
  media_type: string;
  timestamp: string;
  likes_count?: number;
  comments_count?: number;
}

export interface ICommentData {
  id: string;
  text: string;
  timestamp: string;
}

export default function ProfilePage() {
  const [searchParams] = useSearchParams();
  const [authUrl, setAuthUrl] = useState("");
  const [profile, setProfile] = useState<IProfileData | null>(null);
  const [media, setMedia] = useState<IPostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<IPostData | null>(null);
  const [comment, setComment] = useState("");
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for success redirect from backend
    const accessToken = searchParams.get("accessToken");
    const instagramId = searchParams.get("instagramId");
    const errorMessage = searchParams.get("message");

    if (errorMessage) {
      setError(errorMessage);
      // Clean the URL
      navigate(window.location.pathname, { replace: true });
      return;
    }

    if (accessToken && instagramId) {
      // Store tokens and fetch data
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("instagramId", instagramId);

      // Clean the URL
      navigate(window.location.pathname, { replace: true });

      // Fetch profile and media
      fetchProfileAndMedia(accessToken, instagramId);
    } else if (localStorage.getItem("accessToken")) {
      // User already authenticated
      fetchProfileAndMedia(
        localStorage.getItem("accessToken")!,
        localStorage.getItem("instagramId")!
      );
    } else {
      // Not authenticated - get auth URL
      fetchAuthUrl();
    }
  }, [navigate, searchParams]);

  const fetchAuthUrl = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth`);
      setAuthUrl(response.data.authUrl);
    } catch (err) {
      setError("Failed to get authentication URL");
      console.error("Error fetching auth URL:", err);
    }
  };

  const fetchProfileAndMedia = async (
    accessToken: string,
    instagramId: string
  ) => {
    try {
      setLoading(true);
      const [profileRes, mediaRes] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_API_URL}/api/profile?accessToken=${accessToken}&instagramId=${instagramId}`
        ),
        axios.get(
          `${import.meta.env.VITE_API_URL}/api/media?accessToken=${accessToken}&instagramId=${instagramId}`
        ),
      ]);

      setProfile(profileRes.data);
      setMedia(mediaRes.data.data || []);
      // setAllComments(commentRes.data.data || []);
    } catch (err) {
      setError("Failed to load profile or media.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!selectedPost || !comment.trim()) return;

    try {
      setIsLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/comment`, {
        mediaId: selectedPost.id,
        message: comment,
        accessToken: localStorage.getItem("accessToken"),
      });
      // Clear comment input
      setComment("");
      toast("Comment posted successfully!");
      // Refresh the comments for the selected post
      if (isModalOpen && selectedPost) {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/comments?mediaId=${
            selectedPost.id
          }&accessToken=${localStorage.getItem("accessToken")}`
        );
        setSelectedPost((prev) => ({
          ...prev!,
          comments: {
            data: response.data.data || [],
          },
        }));
      }
      // You might want to refresh comments
    } catch (err) {
      toast("Failed to post comment. Please try again.");
      console.error("Comment error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openPostModal = (post: IPostData) => {
    setSelectedPost(post);
    console.log(post.id, "post id");

    setIsModalOpen(true);
  };

  if (!profile && !loading && authUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-8">
          <a
            href={authUrl}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-md transition duration-300"
          >
            Login with Instagram
          </a>
          <p className="mt-4 text-gray-600">
            You'll be redirected to Instagram to authorize this app
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md">
          {error}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-6xl mx-auto py-4 px-48">
      {/* Profile Header */}
      <div className="flex items-start gap-20 my-10">
        <div className="relative flex-shrink-0">
          <Avatar className="w-36 h-36 border-none bg-gray-300">
            <AvatarImage
              src={
                profile.profile_picture_url ||
                "/placeholder.svg?height=150&width=150"
              }
              alt={`@${profile.username}`}
            />
            <AvatarFallback className="bg-gray-300">
              <Camera className="w-8 h-8 text-gray-500" />
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-xl font-normal">{profile.username}</h1>
            <Button
              variant="outline"
              className="h-8 rounded-md px-4 text-sm border-none bg-gray-200 font-bold"
            >
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="h-8 rounded-md px-4 text-sm border-none bg-gray-200 font-bold"
            >
              View archive
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8"
            >
              <span className="sr-only">Settings</span>
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex gap-10 mb-4">
            <div className="flex gap-1">
              <span className="font-semibold">1</span>{" "}
              <span className="text-gray-900">post</span>
              {profile.media_count !== 1 && "s"}
            </div>
            <div className="flex gap-1">
              <span className="font-semibold">{profile.followers_count}</span>{" "}
              follower
              {profile.followers_count !== 1 && "s"}
            </div>
            <div className="flex gap-1">
              <span className="font-semibold">0</span> following
            </div>
          </div>

          {profile.name && (
            <div>
              <p className="font-semibold">{profile.name}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-start mb-8">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border border-gray-300">
            <Plus className="w-12 h-12 text-slate-400" />
          </div>
          <span className="text-xs mt-2 font-bold">New</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="mx-auto w-full pt-8 z-0">
        <div className="flex justify-center items-center border-t border-gray-200 bg-transparent w-full">
          <TabsList className="grid grid-cols-4 gap-x-10 border-t border-gray-200 bg-transparent h-12">
            <TabsTrigger
              value="posts"
              className="text-xs data-[state=active]:border-t data-[state=active]:border-t-black"
            >
              <Grid className="w-4 h-4 mr-2" />
              POSTS
            </TabsTrigger>
            <TabsTrigger
              value="reels"
              className="text-xs data-[state=active]:border-t data-[state=active]:border-t-black"
            >
              <Film className="w-4 h-4 mr-2" />
              REELS
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="text-xs data-[state=active]:border-t data-[state=active]:border-t-black"
            >
              <Bookmark className="w-4 h-4 mr-2" />
              SAVED
            </TabsTrigger>
            <TabsTrigger
              value="tagged"
              className="text-xs data-[state=active]:border-t data-[state=active]:border-t-black"
            >
              <Tag className="w-4 h-4 mr-2" />
              TAGGED
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="posts" className="mt-6">
          <div className="grid grid-cols-3 gap-1 pr-20 w-full">
            {media.map((post) => (
              <div
                key={post.id}
                className="aspect-square w-80 relative cursor-pointer"
                onClick={() => openPostModal(post)}
                onMouseEnter={() => setHoveredPost(post.id)}
                onMouseLeave={() => setHoveredPost(null)}
              >
                {post.media_type === "IMAGE" ||
                post.media_type === "CAROUSEL_ALBUM" ? (
                  <img
                    src={post.media_url}
                    alt={post.caption || "Instagram post"}
                    className="w-full h-full object-cover"
                  />
                ) : post.media_type === "VIDEO" ? (
                  <div className="relative w-full h-full">
                    <video className="w-full h-full object-cover">
                      <source src={post.media_url} type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film className="w-8 h-8 text-white" />
                    </div>
                  </div>
                ) : null}
                {hoveredPost === post.id && (
                  <div className="absolute inset-0 bg-black opacity-30 flex items-center justify-center gap-6 text-white transition-all duration-100 ease-in-out">
                    <div className="flex items-center gap-1">
                      <Heart className="w-5 h-5 fill-white" />
                      <span className="font-semibold">{post.likes_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-5 h-5 fill-white" />
                      <span className="font-semibold">
                        {post.comments_count}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reels">
          <div className="flex items-center justify-center h-40 text-gray-500">
            No reels yet
          </div>
        </TabsContent>

        <TabsContent value="saved">
          <div className="flex items-center justify-center h-40 text-gray-500">
            No saved posts
          </div>
        </TabsContent>

        <TabsContent value="tagged">
          <div className="flex items-center justify-center h-40 text-gray-500">
            No tagged posts
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <footer className="mt-20 text-xs text-gray-500 flex justify-center gap-4 flex-wrap">
        <a href="#" className="hover:underline">
          Meta
        </a>
        <a href="#" className="hover:underline">
          About
        </a>
        <a href="#" className="hover:underline">
          Blog
        </a>
        <a href="#" className="hover:underline">
          Jobs
        </a>
        <a href="#" className="hover:underline">
          Help
        </a>
        <a href="#" className="hover:underline">
          API
        </a>
        <a href="#" className="hover:underline">
          Privacy
        </a>
        <a href="#" className="hover:underline">
          Terms
        </a>
        <a href="#" className="hover:underline">
          Locations
        </a>
        <a href="#" className="hover:underline">
          Instagram Lite
        </a>
        <a href="#" className="hover:underline">
          Threads
        </a>
        <a href="#" className="hover:underline">
          Contact uploading and non-users
        </a>
        <a href="#" className="hover:underline">
          Meta Verified
        </a>
      </footer>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          post={selectedPost}
          comment={comment}
          setComment={setComment}
          handleComment={handleComment}
          profile={profile}
          setIsLoading={setIsLoading}
          loading={isLoading}
        />
      )}
    </div>
  );
}
