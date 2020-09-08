import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

declare global {
  namespace NodeJS {
    interface Global {
      signin(): string[]
    }
  }
}

let mongo: any

jest.mock('../nats-wrapper')

beforeAll(async () => {
  process.env.JWT_KEY = 'asdasda'
  mongo = new MongoMemoryServer()
  const mongoUri = await mongo.getUri()

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
})

beforeEach(async () => {
  jest.clearAllMocks()
  const collections = await mongoose.connection.db.collections()

  for (let collection of collections) {
    await collection.deleteMany({})
  }
})

afterAll(async () => {
  await mongo.stop()
  await mongoose.connection.close()
})

global.signin = () => {
  //build a JWT payload {id, email}
  const payload = {
    id: new mongoose.Types.ObjectId().toHexString(),
    email: 'test@test.com',
  }
  //create JWT
  const token = jwt.sign(payload, process.env.JWT_KEY!)

  //build session object
  const session = { jwt: token }

  //turn that session into JSON
  const sessionJSON = JSON.stringify(session)

  //take JSON and encode is as base64
  const base64 = Buffer.from(sessionJSON).toString('base64')

  //return a string thats the cookie with the encoded data
  return [`express:sess=${base64}`]
}
