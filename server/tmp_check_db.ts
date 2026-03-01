
import { PrismaClient } from '@prisma/client';

async function main() {
    const dbPath = 'C:/Users/IT SPV/AppData/Roaming/com.pos.app/pos.db';
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: `file:${dbPath}`,
            },
        },
    });

    try {
        const users = await prisma.user.findMany();
        console.log('--- USERS IN APPDATA DB ---');
        users.forEach(u => {
            console.log(`Email: ${u.email}, Name: ${u.fullName}, IsActive: ${u.isActive}`);
        });
    } catch (error: any) {
        console.error('Error checking DB:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
