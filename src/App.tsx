import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import PostPage from "./pages/PostPage";
import ProfilePage from "./pages/ProfilePage";
import SpacePage from "./pages/SpacePage";
import SubmitPage from "./pages/SubmitPage";
import StravaCallback from "./pages/StravaCallback";
import "./styles/App.css";

function App() {
    return <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="c/:spaceName" element={<SpacePage />} />
                  <Route path="c/:spaceName/submit" element={<SubmitPage />} />
                  <Route path="u/:username" element={<ProfilePage />} />
                  <Route path="post/:postId" element ={<PostPage />}/>
                  <Route path="strava-callback" element={<StravaCallback />} />
                  <Route path="*" element ={<Navigate to="/" replace />}/>                
                </Route>
            </Routes>
        </BrowserRouter>
}

export default App
