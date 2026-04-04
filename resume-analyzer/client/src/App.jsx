


import { useState } from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import ResumeRanker from "./components/ResumeRanker";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard"); // "dashboard" | "ranker"

  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        {currentPage === "ranker" ? (
          <ResumeRanker onBack={() => setCurrentPage("dashboard")} />
        ) : (
          <Dashboard onNavigate={setCurrentPage} />
        )}
      </SignedIn>
    </>
  );
}