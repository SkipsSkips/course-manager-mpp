// Import the exact default image from my-app
let defaultImageBase64;

try {
  // Read the ES module content directly
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '../../my-app/src/utils/defaultImage.js');
  
  // Read file and extract the base64 string
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const match = fileContent.match(/defaultImageBase64\s*=\s*['"]([^'"]+)['"]/);
  
  if (match && match[1]) {
    defaultImageBase64 = match[1];
    console.log('Successfully loaded default image from React app');
  } else {
    // Fallback
    defaultImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSwgc2Fucy1zZXJpZiIgZmlsbD0iIzk5OTk5OSI+Q291cnNlIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    console.log('Fallback to default image');
  }
} catch (error) {
  console.error('Error reading default image:', error);
  // Fallback
  defaultImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSwgc2Fucy1zZXJpZiIgZmlsbD0iIzk5OTk5OSI+Q291cnNlIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
}

module.exports = { defaultImageBase64 };
