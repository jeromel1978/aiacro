import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
      },
      async authorize(credentials) {
        if (credentials && credentials.username) {
          // For now, accept any username and don't require a password
          // Return a user object with the username
          return { id: credentials.username, name: credentials.username, username: credentials.username };
        }
        // Return null if user data could not be retrieved
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add username to the JWT token
      if (user) {
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      // Add username to the session object
      if (token && token.username) {
        session.user.username = token.username;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin', // Specify custom sign-in page
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
