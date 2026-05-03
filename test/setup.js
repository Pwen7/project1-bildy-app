import 'dotenv/config'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

// Provide a default JWT secret for the test runner if .env is not present
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-bildyapp-do-not-use-in-prod'

let mongod

export const connect = async () => {
    mongod = await MongoMemoryServer.create()
    await mongoose.connect(mongod.getUri())
}

export const closeDatabase = async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await mongod.stop()
}

export const clearDatabase = async () => {
    const collections = mongoose.connection.collections
    for (const key in collections) {
        await collections[key].deleteMany({})
    }
}
