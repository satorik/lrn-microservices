import request from 'supertest'
import { app } from '../../app'

it('returns a current user details', async () => {
  const cookie = await global.signin()

  const response = await request(app)
    .get('/api/users/currentuser')
    .set('Cookie', cookie)
    .send()
    .expect(200)

  expect(response.body.currentUser.email).toEqual('test@test.com')
})

it('respondes with null if not authenticated', async () => {
  const response = await request(app).get('/api/users/currentuser').send().expect(200)

  expect(response.body.currentUser).toEqual(null)
})
