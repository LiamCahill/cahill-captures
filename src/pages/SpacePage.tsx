import "../styles/SpacePage.css";
import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import {api} from "../../convex/_generated/api"
import PostCard from "../components/PostCard";

const SpacePage = () => {
  const {spaceName} = useParams()
  const space = useQuery(api.space.get,{name: spaceName || ""})

  if(space === undefined) return <p>Loading...</p>

  if (!space) {
    return <div className="content-container">
      <div className="not-found">
        <h1>Space not found</h1>
        <p>The space c/{spaceName} does not exist. (Try creating it!)</p>
      </div>
    </div>
  }

  return (
    <div className="content-container">
      <div className="space-banner">
        <h1>c/{space.name}</h1>
        {space.description && <p>{space.description}</p>}
      </div>
      <div className="posts-container">
        {space.posts?.length === 0 ? (
          <div className="no-posts">
            <p>No posts yet. Be the first to post</p>
          </div>
        ) : (
          space.posts?.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>
    </div>
  );
};

export default SpacePage;
