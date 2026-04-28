import { connectToDatabase } from "./database/mongoose";

async function main() {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) {
            console.error("No db");
            process.exit(1);
        }
        const users = await db.collection('users').find({}).limit(2).toArray();
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
main();
