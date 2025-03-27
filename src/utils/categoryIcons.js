// Map categories to their respective icons
export const categoryIcons = {
  "Programming": "💻",
  "Design": "🎨",
  "Music": "🎵",
  "Marketing": "📈",
  "Business": "💼",
  "Data Science": "📊",
  "Photography": "📷",
  "Health & Fitness": "💪",
  "default": "📚" // Default icon
};

// Get icon for a specific category
export const getCategoryIcon = (category) => {
  return categoryIcons[category] || categoryIcons.default;
};
