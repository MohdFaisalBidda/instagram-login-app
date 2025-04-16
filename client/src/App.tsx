// In your main App.js or index.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProfilePage from "./components/ProfilePage";
import InstagramLayout from "./components/InstagramLayout";

function RootApp() {
  return (
    <Router>
      <Routes>
        <Route
          path="/auth/success"
          element={
            <InstagramLayout>
              <ProfilePage />
            </InstagramLayout>
          }
        />
        <Route
          path="/"
          element={
            <InstagramLayout>
              <ProfilePage />
            </InstagramLayout>
          }
        />
        {/* <Route path="/" element={<MainApp />} /> */}
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  );
}

export default RootApp;
