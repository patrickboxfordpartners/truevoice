import { ConvexReactClient } from "convex/react";

// Initialize Convex client with deployment URL from environment
export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
