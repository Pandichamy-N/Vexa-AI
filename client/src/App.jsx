import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Trending from "./pages/Trending";
import Shorts from "./pages/Shorts";
import Categories from "./pages/Categories";
import Favorites from "./pages/Favorites";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VideoPage from "./pages/VideoPage";
import UploadVideo from "./pages/UploadVideo";
import MyUploads from "./pages/MyUploads";
import ChannelPage from "./pages/ChannelPage";
import Dashboard from "./pages/Dasboard";
import Playlists from "./pages/Playlists";
import SearchResults from "./pages/SearchResults";
import AdminDashboard from "./pages/AdminDashboard";
import Onboarding from "./pages/Onboarding";
import PlaylistDetail from "./pages/PlaylistDetail";
import VexaMusic from "./pages/VexaMusic";
import Premium from "./pages/Premium";
import MusicUserProfile from "./pages/MusicUserProfile";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import WatchLater from "./pages/WatchLater";


function App() {
  return (
    <Routes>

      {/* Public Route */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Onboarding — full-screen, no Navbar/Sidebar, auth required */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Home */}
        <Route index element={<Home />} />

        {/* Video Page */}
        <Route
          path="video/:id"
          element={<VideoPage />}
        />

        {/* Trending */}
        <Route
          path="trending"
          element={<Trending />}
        />

        {/* Shorts */}
        <Route
          path="shorts"
          element={<Shorts />}
        />

        {/* Categories */}
        <Route
          path="categories"
          element={<Categories />}
        />

        {/* Favorites */}
        <Route
          path="favorites"
          element={<Favorites />}
        />

        {/* History */}
        <Route
          path="history"
          element={<History />}
        />

        {/* Upload */}
        <Route
          path="upload"
          element={<UploadVideo />}
        />
        {/* Watch Later */}
        <Route
          path="watchlater"
          element={<WatchLater />}
        />


        {/* Profile */}
        <Route
          path="profile"
          element={<Profile />}
        />

        {/* My Uploads */}
        <Route
          path="myuploads"
          element={<MyUploads />}
        />

        {/* Channel Page */}
        <Route
          path="channel/:userId"
          element={<ChannelPage />}
        />

        {/* Dashboard */}
        <Route
          path="dashboard"
          element={<Dashboard />}
        />

        {/* Playlists */}
        <Route
          path="playlists"
          element={<Playlists />}
        />

        {/* Playlist Detail — this route was missing, which is why
            clicking a saved playlist didn't open anything */}
        <Route
          path="playlists/:id"
          element={<PlaylistDetail />}
        />

        {/* AI Search Results */}
        <Route
          path="search"
          element={<SearchResults />}
        />

        {/* Admin Dashboard */}
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* VEXA Music */}
        <Route
          path="music"
          element={<VexaMusic />}
        />

        {/* Premium Subscription */}
        <Route
          path="premium"
          element={<Premium />}
        />

        {/* VEXA Music: public user profile + follow */}
        <Route
          path="music/u/:userId"
          element={<MusicUserProfile />}
        />
      </Route>

    </Routes >
  );
}

export default App;