import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    navigate("/login");
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Welcome to the Landing Page</h1>
      <p>You are logged in.</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Landing;