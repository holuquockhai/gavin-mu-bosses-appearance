import { createBrowserRouter } from "react-router-dom";
import Layout from "./pages/components/Layout";
import Landing from "./pages/Landing";
import Users from "./pages/admin/Users";
import CreateBossPage from "./pages/admin/CreateBossPage";
import Channels from "./pages/admin/Channels";
import Profile from "./pages/Profile";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Landing /> },
      { path: "profile", element: <Profile /> },
      { path: "profile/:userId", element: <Profile /> },
      { path: "bosses", element: <CreateBossPage /> },
      { path: "users", element: <Users /> },
      { path: "channels", element: <Channels /> },
    ],
  },
]);

export default router;
