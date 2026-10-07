"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
let dbUrl = process.env.DATABASE_URL;
// If SQLite relative path includes redundant 'prisma/' prefix (relative to schema.prisma location), normalize to './'
if (dbUrl && dbUrl.startsWith('file:') && dbUrl.includes('prisma/')) {
    dbUrl = dbUrl.replace(/file:(\.\/)?prisma\//, 'file:./');
}
const prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
});
exports.default = prisma;
