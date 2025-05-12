// Provide mock data for development when API endpoints return 401 errors

import { Goal, UserChallenge } from "@shared/schema";

export const mockGoals: Goal[] = [
  {
    id: 1,
    userId: 1,
    title: "Learn React and TypeScript",
    description: "Complete a comprehensive course on React and TypeScript development",
    category: "education",
    deadline: new Date(2025, 5, 15),
    priority: "high",
    progress: 65,
    isCompleted: false,
    createdAt: new Date(2025, 0, 10)
  },
  {
    id: 2,
    userId: 1,
    title: "Run 5K three times a week",
    description: "Build stamina by running 5K at least three times a week",
    category: "health",
    deadline: new Date(2025, 6, 1),
    priority: "medium",
    progress: 80,
    isCompleted: false,
    createdAt: new Date(2025, 1, 5)
  },
  {
    id: 3,
    userId: 1,
    title: "Read 20 books this year",
    description: "Read at least 20 books to expand knowledge and improve focus",
    category: "personal",
    deadline: new Date(2025, 11, 31),
    priority: "low",
    progress: 35,
    isCompleted: false,
    createdAt: new Date(2025, 0, 2)
  }
];

export const mockWeeklyGrowth = [
  { date: new Date(2025, 4, 5), value: 8, category: "overall" },
  { date: new Date(2025, 4, 6), value: 12, category: "overall" },
  { date: new Date(2025, 4, 7), value: 10, category: "overall" },
  { date: new Date(2025, 4, 8), value: 15, category: "overall" },
  { date: new Date(2025, 4, 9), value: 18, category: "overall" },
  { date: new Date(2025, 4, 10), value: 20, category: "overall" },
  { date: new Date(2025, 4, 11), value: 22, category: "overall" }
];

export interface LeaderboardUser {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
  growth: number;
  category: string;
}

export interface LeaderboardData {
  leaderboard: LeaderboardUser[];
  userPosition?: {
    id: number;
    username: string;
    name: string;
    avatar: string | null;
    growth: number;
    category: string;
    position: number;
  };
}

export const mockLeaderboardData: LeaderboardData = {
  leaderboard: [
    {
      id: 2,
      username: "emilyjohnson",
      name: "Emily Johnson",
      avatar: null,
      growth: 28,
      category: "leadership"
    },
    {
      id: 3,
      username: "michaelsmith",
      name: "Michael Smith",
      avatar: null,
      growth: 25,
      category: "data_science"
    },
    {
      id: 4,
      username: "sarahwilliams",
      name: "Sarah Williams",
      avatar: null,
      growth: 23,
      category: "creative"
    },
    {
      id: 5,
      username: "alexbrown",
      name: "Alex Brown",
      avatar: null,
      growth: 21,
      category: "software"
    },
    {
      id: 6,
      username: "jessicarogers",
      name: "Jessica Rogers",
      avatar: null,
      growth: 19,
      category: "design"
    }
  ],
  userPosition: {
    id: 1,
    username: "demouser",
    name: "Demo User",
    avatar: null,
    growth: 15,
    category: "product",
    position: 8
  }
};

// Function to fetch data from API with fallback to mock data
export async function fetchWithMockFallback<T>(url: string, mockData: T): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`API call to ${url} failed with status ${response.status}, using mock data`);
      return mockData;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    return mockData;
  }
}