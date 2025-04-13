"use client";

import type React from "react";

import { useState } from "react";
import {
  Home,
  Search,
  Compass,
  Film,
  MessageCircle,
  Heart,
  PlusSquare,
  LayoutDashboard,
  User,
  MessageSquare,
  Menu,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";

interface InstagramLayoutProps {
  children: React.ReactNode;
}

export default function InstagramLayout({ children }: InstagramLayoutProps) {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-gray-200 flex flex-col h-full">
        <div className="p-6">
          <h1 className="text-2xl font-serif italic">Instagram</h1>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2 px-3">
            <NavItem
              icon={<Home />}
              label="Home"
              id="home"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <NavItem
              icon={<Search />}
              label="Search"
              id="search"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <NavItem
              icon={<Compass />}
              label="Explore"
              id="explore"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <NavItem
              icon={<Film />}
              label="Reels"
              id="reels"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <NavItem
              icon={<MessageCircle />}
              label="Messages"
              id="messages"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <NavItem
              icon={<Heart />}
              label="Notifications"
              id="notifications"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <NavItem
              icon={<PlusSquare />}
              label="Create"
              id="create"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <NavItem
              icon={<LayoutDashboard />}
              label="Dashboard"
              id="dashboard"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <NavItem
              icon={<User />}
              label="Profile"
              id="profile"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <NavItem
              icon={<MessageSquare />}
              label="Threads"
              id="threads"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <NavItem
              icon={<Menu />}
              label="More"
              id="more"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  id: string;
  activeTab: string;
  setActiveTab: (id: string) => void;
}

function NavItem({ icon, label, id, activeTab, setActiveTab }: NavItemProps) {
  return (
    <li>
      <Link
        to={"/"}
        className={cn(
          "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium",
          activeTab === id ? "font-semibold" : "text-gray-700"
        )}
        onClick={() => setActiveTab(id)}
      >
        <span className="w-6 h-6">{icon}</span>
        <span>{label}</span>
      </Link>
    </li>
  );
}
