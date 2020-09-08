import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

declare global {
  namespace NodeJS {
    interface Global {
      signin(id?: string): string[]
    }
  }
}

let mongo: any

jest.mock('../nats-wrapper')
//jest.setTimeout(60000)
process.env.STRIPE_KEY =
  'sk_test_51HOUY9ALYFJyh8UZSZT9wcgjU59uCmzcYtrC47YLhMaVBSuHZY0BYPY7XsvfYz47D1S4h47FEnljZZznkaoGPoMy00Ait7SoGl'

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

global.signin = (id?: string) => {
  //build a JWT payload {id, email}
  const payload = {
    id: id || new mongoose.Types.ObjectId().toHexString(),
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
