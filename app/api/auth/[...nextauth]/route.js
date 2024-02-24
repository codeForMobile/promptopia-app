import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectDB } from '@utils/database'
import User from '@models/user'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        username: {
          label: 'Email',
          type: 'email',
          placeholder: 'Provide email',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const { username, password } = credentials

        // const user = await User.findOne({ email })

        // Dummy user and method to retrieve user
        const users = [{ id: 1, email: 'jdoe@email.com', password: '123' }]
        const user = users.filter((user) => {
          if (user.email === username && user.password === password) {
            return user
          } else {
            return null
          }
        })
        console.log('final user from forEach...', user)
        if (user) {
          return user[0]
        } else {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('jwt called...')
      if (user) {
        token.email = user.email
        token.id = user.id
      }
      return token
    },
    async session({ session }) {
      console.log('session called...')
      const sessionUser = await User.findOne({
        email: session.user.email,
      })
      session.user.id = sessionUser._id.toString()
      return session
    },
    async signIn({ user, profile }) {
      console.log('signin got called with user...', user)
      try {
        await connectDB()
        // user check
        let userEmail
        let userName
        let userImage
        if (profile) {
          userEmail = profile.email
          userName = profile.name
          userImage = profile.picture
        } else {
          userEmail = user.email
          userName = 'JhonDoe123'
          userImage = ''
        }

        const userExists = await User.findOne({ email: userEmail })
        // create user
        if (!userExists) {
          await User.create({
            email: userEmail,
            user: userName.replaceAll(/\s/g, '').toLowerCase(),
            image: userImage,
          })
        }
        return true
      } catch (error) {
        console.log(error)
        return false
      }
    },
  },
})

export { handler as GET, handler as POST }
