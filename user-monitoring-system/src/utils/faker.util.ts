import { faker } from '@faker-js/faker';

export const generateFakeUsers = (count: number) => {
    const users = [];
    for (let i = 0; i < count; i++) {
        users.push({
            username: faker.internet.userName(),
            password: faker.internet.password(),
            role: faker.helpers.arrayElement(['user', 'admin']),
        });
    }
    return users;
};

export const generateFakeEntities = (count: number) => {
    const entities = [];
    for (let i = 0; i < count; i++) {
        entities.push({
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            price: faker.commerce.price(),
        });
    }
    return entities;
};

export const generateFakeActivityLogs = (count: number, userIds: number[]) => {
    const activityLogs = [];
    for (let i = 0; i < count; i++) {
        activityLogs.push({
            userId: faker.helpers.arrayElement(userIds),
            action: faker.helpers.arrayElement(['CREATE', 'READ', 'UPDATE', 'DELETE']),
            timestamp: faker.date.recent(),
        });
    }
    return activityLogs;
};