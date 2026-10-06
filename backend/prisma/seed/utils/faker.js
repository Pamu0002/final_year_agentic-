import { faker } from "@faker-js/faker";
// seed for reproducible data
faker.seed(42);
export { faker };
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function randomFloat(min, max, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
export function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
export function randomItems(arr, min, max) {
    const count = randomInt(min, max);
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}
export function weightedRandom(weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
        rand -= weights[i];
        if (rand <= 0)
            return i;
    }
    return weights.length - 1;
}
// generate date in the past
export function pastDate(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d;
}
// generate future date
export function futureDate(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d;
}
