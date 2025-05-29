# User Monitoring System

## Overview
The User Monitoring System is a web application designed to manage user registrations, logins, and monitor user activities. It features role-based access control, allowing for both regular users and admin users to interact with the system. The application logs CRUD operations performed by users and monitors suspicious activities.

## Features
- User registration and login functionality
- Role-based access control (Regular User and Admin)
- CRUD operations for user entities and application entities
- Activity logging for user actions
- Monitoring of users with suspicious activity

## Technologies Used
- TypeScript
- Node.js
- Express
- TypeORM (or Sequelize for ORM)
- Faker.js (for data population)
- JMeter (for performance testing)

## Project Structure
```
user-monitoring-system
├── src
│   ├── config
│   ├── controllers
│   ├── entities
│   ├── middleware
│   ├── services
│   ├── utils
│   ├── workers
│   ├── routes
│   ├── types
│   └── app.ts
├── tests
│   ├── unit
│   └── integration
├── scripts
├── jmeter
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd user-monitoring-system
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Set up the environment variables by copying `.env.example` to `.env` and updating the values as needed.

## Running the Application
To start the application, run:
```
npm start
```

## Testing
To run the unit tests, use:
```
npm test
```

For integration tests, navigate to the `tests/integration/api` directory and run the tests.

## Performance Testing
To run performance tests using JMeter, open the `jmeter/test-plan.jmx` file in JMeter and execute the test plan.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.