import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { connectToDatabase } from './mongoose'
import User from '@/models/user.model'

export const authOptions: NextAuthOptions = {
	providers: [
		Credentials({
			name: 'Credentials',
			credentials: { email: { label: 'Email', type: 'email' } },
			async authorize(credentials) {
				await connectToDatabase()
				const user = await User.findOne({ email: credentials?.email })
				if (!user) return null
				return {
					id: user._id.toString(),
					email: user.email,
					name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
					image: user.avatar,
				}
			},
		}),
		GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            issuer: 'https://github.com/login/oauth',
            authorization: {
                params: {
                    scope: 'read:user user:email',
                },
            },
        }),
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id
				token.email = user.email
			}
			return token
		},
		async session({ session, token }) {
			await connectToDatabase()
			const email = session.user?.email || (token?.email as string)
			if (!email) return session

			let isExistingUser = await User.findOne({ email })
			if (!isExistingUser) {
				isExistingUser = await User.create({
					email: email,
					isVerified: true,
					avatar: session.user?.image,
				})
			}
			session.currentUser = JSON.parse(JSON.stringify(isExistingUser))
			return session
		},
	},
	session: { strategy: 'jwt' },
	secret: process.env.NEXTAUTH_SECRET,
	pages: { signIn: '/auth', signOut: '/auth' },
}
