// Define all available categories in one place
export const categories = [
  "Programming",
  "Design", 
  "Music",
  "Marketing",
  "Business",
  "Data Science",
  "Photography",
  "Health & Fitness"
];

// Get all categories including "All" for filters
export const getAllCategories = () => {
  return ["All", ...categories];
};
