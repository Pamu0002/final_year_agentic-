import { prisma } from "../../../lib/db";
import { MENU_ITEMS } from "../constants/cuisine";
import { randomInt, randomFloat } from "../utils/faker";
export async function seedMenuItems(restaurants) {
    console.log("  Seeding menu items...");
    const allItems = [];
    for (const restaurant of restaurants) {
        const cuisineTypes = JSON.parse(restaurant.cuisineTypes);
        const primaryCuisine = cuisineTypes[0];
        const cuisineItems = MENU_ITEMS[primaryCuisine] || MENU_ITEMS["Sri Lankan"];
        // use all defined items for this cuisine + add some extras from secondary cuisine
        const primaryItems = cuisineItems.map((item) => ({
            restaurantId: restaurant.id,
            name: item.name,
            description: item.desc,
            price: randomFloat(item.priceMin, item.priceMax, 0),
            category: item.category,
            dietaryInfo: JSON.stringify(item.dietary),
            isAvailable: Math.random() > 0.05, // 95% available
        }));
        // if restaurant has secondary cuisine, add a few items from it
        if (cuisineTypes.length > 1) {
            const secondaryCuisine = cuisineTypes[1];
            const secondaryItems = (MENU_ITEMS[secondaryCuisine] || [])
                .slice(0, randomInt(2, 4))
                .map((item) => ({
                restaurantId: restaurant.id,
                name: item.name,
                description: item.desc,
                price: randomFloat(item.priceMin, item.priceMax, 0),
                category: item.category,
                dietaryInfo: JSON.stringify(item.dietary),
                isAvailable: Math.random() > 0.05,
            }));
            allItems.push(...secondaryItems);
        }
        allItems.push(...primaryItems);
    }
    await prisma.menuItem.createMany({ data: allItems, skipDuplicates: true });
    const count = await prisma.menuItem.count();
    console.log(`  ✓ ${count} menu items created`);
    return prisma.menuItem.findMany({ include: { restaurant: true } });
}
