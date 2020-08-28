import express, { Request, Response } from 'express'
import { body } from 'express-validator'
import { validateRequest, BadRequestError } from '@ftadev/common'
import jwt from 'jsonwebtoken'

import { User } from '../models/user'
import { Password } from '../services/password'

const router = express.Router()

router.post(
  '/api/users/signin',
  [
    body('email').isEmail().withMessage('Email must be valid'),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('You must supply a password'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials')
    }

    const isMatch = await Password.compare(existingUser.password, password)
    if (!isMatch) {
      throw new BadRequestError('Invalid credentials')
    }

    //jwt
    const userJWT = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY!
    )

    req.session = {
      jwt: userJWT,
    }

    res.status(200).send(existingUser)
  }
)

export { router as signinRouter }
