const validateCourse = (req, res, next) => {
  const { title, category, lessons, price } = req.body;
  const errors = [];

  // Title validation
  if (!title) {
    errors.push('Title is required');
  } else if (typeof title !== 'string') {
    errors.push('Title must be a string');
  } else if (title.length < 3 || title.length > 100) {
    errors.push('Title must be between 3 and 100 characters');
  }

  // Category validation
  if (!category) {
    errors.push('Category is required');
  } else if (typeof category !== 'string') {
    errors.push('Category must be a string');
  }

  // Lessons validation
  if (lessons === undefined || lessons === null) {
    errors.push('Lessons is required');
  } else {
    const lessonsNumber = Number(lessons);
    if (isNaN(lessonsNumber) || !Number.isInteger(lessonsNumber) || lessonsNumber < 1) {
      errors.push('Lessons must be a positive integer');
    }
  }

  // Price validation
  if (price === undefined || price === null) {
    errors.push('Price is required');
  } else {
    const priceNumber = Number(price);
    if (isNaN(priceNumber) || priceNumber < 0) {
      errors.push('Price must be a non-negative number');
    }
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  // Validation passed
  next();
};

module.exports = { validateCourse };
