'use server'

import jwt from 'jsonwebtoken'

export const generateToken = async (userId?: string) => {
	const secret = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET
	if (!secret) {
		throw new Error('JWT secret is not defined')
	}
	const token = jwt.sign({ userId }, secret, { expiresIn: '1d' })
	return token
}
