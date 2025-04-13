import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

interface IProfileData {
  username: string;
  profile_picture_url: string;
  followers_count: number;
  media_count: number;
}

interface IPostData {
  id: string;
  caption: string;
  media_url: string;
  media_type: string;
  timestamp: number;
}

function MainApp() {
  const [searchParams] = useSearchParams();
  const [authUrl, setAuthUrl] = useState("");
  const [profile, setProfile] = useState<IProfileData | null>(null);
  const [media, setMedia] = useState<IPostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
        localStorage.getItem("accessToken"),
        localStorage.getItem("instagramId")
      );
    } else {
      // Not authenticated - get auth URL
      fetchAuthUrl();
    }
  }, [navigate, searchParams]);

  const fetchAuthUrl = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/auth");
      setAuthUrl(response.data.authUrl);
    } catch (err) {
      setError("Failed to get authentication URL");
      console.error("Error fetching auth URL:", err);
    }
  };

  // const handleCallback = async () => {
  //   const urlParams = new URLSearchParams(window.location.search);
  //   const code = urlParams.get("code");

  //   if (code) {
  //     setLoading(true);
  //     try {
  //       const response = await axios.get(
  //         `http://localhost:4000/api/callback?code=${code}`
  //       );
  //       const { accessToken, instagramId } = response.data;

  //       localStorage.setItem("accessToken", accessToken);
  //       localStorage.setItem("instagramId", instagramId);

  //       // Redirect to root route after successful authentication
  //       navigate("/", { replace: true });

  //       await fetchProfileAndMedia(accessToken, instagramId);
  //     } catch (err) {
  //       setError("Authentication failed. Please try again.");
  //       console.error("Authentication error:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   } else if (localStorage.getItem("accessToken")) {
  //     fetchProfileAndMedia(
  //       localStorage.getItem("accessToken")!,
  //       localStorage.getItem("instagramId")!
  //     );
  //   }
  // };


  const fetchProfileAndMedia = async (
    accessToken: string,
    instagramId: string
  ) => {
    try {
      setLoading(true);
      const [profileRes, mediaRes] = await Promise.all([
        axios.get(
          `http://localhost:4000/api/profile?accessToken=${accessToken}&instagramId=${instagramId}`
        ),
        axios.get(
          `http://localhost:4000/api/media?accessToken=${accessToken}&instagramId=${instagramId}`
        ),
      ]);

      console.log(profileRes, "profileRes");
      console.log(mediaRes, "mediaRes");
      
      setProfile(profileRes.data);
      setMedia(mediaRes.data.data || []);
    } catch (err) {
      setError("Failed to load profile or media.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async (mediaId: string) => {
    const message = prompt("Enter your reply:");
    if (!message) return;

    try {
      await axios.post(`http://localhost:4000/api/comment`, {
        mediaId,
        message,
        accessToken: localStorage.getItem("accessToken"),
      });
      alert("Comment posted successfully!");
    } catch (err) {
      alert("Failed to post comment. Please try again.");
      console.error("Comment error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          Instagram Dashboard
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2">Loading...</p>
          </div>
        )}

        {!profile && !loading && authUrl && (
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
        )}

        {profile && (
          <div className="bg-white shadow-md rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-4">
              <img
                src={
                  profile.profile_picture_url ||
                  "https://via.placeholder.com/100"
                }
                alt="Profile"
                className="w-20 h-20 rounded-full border object-cover"
              />
              <div>
                <h2 className="text-xl font-semibold">{profile.username}</h2>
                <p>Followers: {profile.followers_count}</p>
                <p>Posts: {profile.media_count}</p>
              </div>
            </div>
          </div>
        )}

        {media.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                {item.media_type === "IMAGE" ||
                item.media_type === "CAROUSEL_ALBUM" ? (
                  <img
                    src={item.media_url}
                    alt={item.caption || "Instagram post"}
                    className="w-full h-64 object-cover"
                  />
                ) : item.media_type === "VIDEO" ? (
                  <video controls className="w-full h-64 object-cover">
                    <source src={item.media_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : null}

                <div className="p-4">
                  {item.caption && (
                    <p className="text-gray-700 mb-3 line-clamp-2">
                      {item.caption}
                    </p>
                  )}
                  <button
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition duration-300"
                    onClick={() => handleComment(item.id)}
                  >
                    Reply to Post
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MainApp;
