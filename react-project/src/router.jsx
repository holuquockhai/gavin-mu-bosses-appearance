import { createBrowserRouter } from "react-router-dom";
import Layout from "./pages/components/Layout";
import Landing from "./pages/Landing";
import Users from "./pages/admin/Users";
import CreateBossPage from "./pages/admin/CreateBossPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Landing /> },
      { path: "bosses", element: <CreateBossPage /> },
      { path: "users", element: <Users /> },
    ],
  },
]);

export default router;
