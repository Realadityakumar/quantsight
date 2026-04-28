import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
        const users = await db.collection('users').find({}).limit(2).toArray();
        console.log(JSON.stringify(users, null, 2));
    } catch(err) {
        console.error(err);
    } finally {
        await client.close();
    }
}
main();
