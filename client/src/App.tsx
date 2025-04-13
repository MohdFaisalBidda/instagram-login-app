// In your main App.js or index.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainApp from "./MainApp";
import ProfilePage from "./components/ProfilePage";
import InstagramLayout from "./components/InstagramLayout";

function RootApp() {
  return (
    <Router>
      <Routes>
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
