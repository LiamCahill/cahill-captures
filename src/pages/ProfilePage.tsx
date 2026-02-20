import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import {api} from "../../convex/_generated/api"
import PostCard from "../components/PostCard";
import "../styles/ProfilePage.css";

const ProfilePage = () => {
  const {username} = useParams()
  const posts = useQuery(api.post.userPosts, {authorUsername: username || ""})
  const stats = useQuery(api.users.getPublicUser, {username: username || ""})

  if (posts === undefined || stats === undefined) {
    return (
      <div className="content-container">
        <div className="profile-header">
          <h1>u/{username}</h1>
        </div>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (stats === null) {
    return (
      <div className="content-container">
        <div className="not-found">
          <h1>User not found</h1>
          <p>The user u/{username} does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container">
      <div className="profile-header">
        <h1>u/{username}</h1>
        <p className="profile-post-count">{stats.posts ?? 0} {(stats.posts ?? 0) === 1 ? "post" : "posts"}</p>
      </div>
      <div className="posts-container">
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>No posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} showSubreddit={true} />
          ))
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
