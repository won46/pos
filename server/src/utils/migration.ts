import prisma from '../config/database';

export const checkAndMigrateDatabase = async () => {
    try {
        console.log('🔍 Checking database schema for required columns...');

        // Check for discount_percent column in transaction_items table
        // SQLite specific query to check columns
        const tableInfo: any[] = await prisma.$queryRaw`PRAGMA table_info(transaction_items)`;

        const hasDiscountPercent = tableInfo.some(col => col.name === 'discount_percent');

        if (!hasDiscountPercent) {
            console.log('➕ Column "discount_percent" is missing in "transaction_items". Adding it...');
            await prisma.$executeRawUnsafe(`ALTER TABLE "transaction_items" ADD COLUMN "discount_percent" REAL DEFAULT 0`);
            console.log('✅ Column "discount_percent" added successfully.');
        } else {
            console.log('✅ Column "discount_percent" already exists.');
        }

        // Add more checks here if needed in the future

    } catch (error) {
        console.error('❌ database migration check failed:', error);
        // We don't exit here, just log it. If it fails fundamentally, it will fail later too.
    }
};
