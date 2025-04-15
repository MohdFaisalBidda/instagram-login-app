const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;
console.log({ CLIENT_ID, CLIENT_SECRET, REDIRECT_URI }, "envs");

router.get("/auth", (req, res) => {
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=instagram_basic,instagram_manage_comments,pages_show_list&response_type=code`;
  res.json({ authUrl });
});

router.get("/callback", async (req, res) => {
  console.log("In callback route");

  const { code } = req.query;
  console.log("In code", code);

  try {
    const tokenRes = await axios.get(
      `https://graph.facebook.com/v22.0/oauth/access_token`,
      {
        params: {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          code,
        },
      }
    );

    const accessToken = tokenRes.data.access_token;
    const userRes = await axios.get(
      `https://graph.facebook.com/v22.0/me/accounts`,
      {
        params: { access_token: accessToken },
      }
    );

    console.log(userRes.data, "userRes");

    const pageAccessToken = userRes.data.data[0].access_token;
    const instagramAccount = await axios.get(
      `https://graph.facebook.com/v22.0/${userRes.data.data[0].id}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );

    res.redirect(
      `http://localhost:5173/auth/success?` +
        `accessToken=${encodeURIComponent(pageAccessToken)}&` +
        `instagramId=${encodeURIComponent(
          instagramAccount.data.instagram_business_account.id
        )}`
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Auth error");
  }
});

router.get("/profile", async (req, res) => {
  const { accessToken, instagramId } = req.query;
  const url = `https://graph.facebook.com/v22.0/${instagramId}?fields=username,profile_picture_url,followers_count,media_count&access_token=${accessToken}`;

  const response = await axios.get(url);
  res.json(response.data);
});

router.get("/media", async (req, res) => {
  const { accessToken, instagramId } = req.query;
  const url = `https://graph.facebook.com/v22.0/${instagramId}/media?fields=id,caption,media_url,media_type,timestamp,likes_count,comments_count,comments{id,text,username,timestamp}&access_token=${accessToken}`;
  const response = await axios.get(url);
  res.json(response.data);
});

router.get("/comments", async (req, res) => {
  const { mediaId, accessToken } = req.query;
  try {
    const commentsRes = await axios.get(
      `https://graph.facebook.com/v22.0/${mediaId}/comments`,
      {
        params: {
          access_token: accessToken,
          fields: "id,text,username,timestamp",
        },
      }
    );
    console.log(commentsRes.data.data, "comments here before");

    const comments = await Promise.all(
      commentsRes.data.data.map(async (comment) => {
        // Fetch replies for each comment
        const repliesRes = await axios.get(
          `https://graph.facebook.com/v22.0/${comment.id}/replies`,
          {
            params: {
              access_token: accessToken,
              fields: "id,text,username,timestamp",
            },
          }
        );
        console.log(repliesRes.data.data, "replies");

        return {
          ...comment,
          replies: {
            data: repliesRes.data.data || [],
          },
        };
      })
    );

    res.json({ data: comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

router.post("/comment", async (req, res) => {
  const { mediaId, message, accessToken, replyToCommentId } = req.body;
  // If this is a reply
  if (replyToCommentId) {
    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${replyToCommentId}/replies`,
      { message },
      {
        params: { access_token: accessToken },
      }
    );
    return res.json(response.data);
  }

  const url = `https://graph.facebook.com/v22.0/${mediaId}/comments`;
  const response = await axios.post(url, null, {
    params: { message, access_token: accessToken },
  });
  res.json(response.data);
});

module.exports = router;
