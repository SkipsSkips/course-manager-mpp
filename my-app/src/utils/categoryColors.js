// Map categories to specific colors
export const categoryColors = {
  "Programming": "#3B82F6", // blue-500
  "Design": "#8B5CF6", // violet-500
  "Music": "#EC4899", // pink-500
  "Marketing": "#F59E0B", // amber-500
  "Business": "#10B981", // emerald-500
  "Data Science": "#6366F1", // indigo-500
  "Photography": "#8B5CF6", // violet-500
  "Health & Fitness": "#22C55E", // green-500
  "All": "#4B5563", // gray-600
  "default": "#6B7280" // gray-500
};

// Get color for a specific category
export const getCategoryColor = (category) => {
  return categoryColors[category] || categoryColors.default;
};

// Get text color that contrasts with background color
export const getContrastColor = (bgColor) => {
  // Default to white if no background color
  if (!bgColor) return "text-white";
  
  // Remove '#' if present
  const hex = bgColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? "text-gray-900" : "text-white";
};
