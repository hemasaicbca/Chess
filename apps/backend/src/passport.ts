const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GithubStrategy = require('passport-github2').Strategy;
import passport from 'passport';
import dotenv from 'dotenv';
import { User } from '@repo/db';

interface GithubEmailRes {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: 'private' | 'public';
}

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

export function initPassport() {
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: '/auth/google/callback',
        },
        async function (
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: (error: any, user?: any) => void,
        ) {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error('No email returned by Google account'));
          }

          const user = await User.findOneAndUpdate(
            { email },
            {
              $set: {
                email,
                name: profile.displayName,
                provider: 'GOOGLE',
              },
              $setOnInsert: {
                username: profile.displayName || `google-${profile.id}`,
                rating: 1200,
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );

          done(null, user);
        },
      ),
    );
  } else {
    console.warn('Google OAuth is not configured; skipping Google strategy.');
  }

  if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
    passport.use(
      new GithubStrategy(
        {
          clientID: GITHUB_CLIENT_ID,
          clientSecret: GITHUB_CLIENT_SECRET,
          callbackURL: '/auth/github/callback',
        },
        async function (
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: (error: any, user?: any) => void,
        ) {
          const res = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `token ${accessToken}`,
            },
          });

          const data: GithubEmailRes[] = await res.json();
          const primaryEmail = data.find((item) => item.primary === true);

          if (!primaryEmail) {
            return done(new Error('No primary GitHub email found'));
          }

          const user = await User.findOneAndUpdate(
            { email: primaryEmail.email },
            {
              $set: {
                email: primaryEmail.email,
                name: profile.displayName || profile.username,
                provider: 'GITHUB',
              },
              $setOnInsert: {
                username: profile.username || `github-${profile.id}`,
                rating: 1200,
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );

          done(null, user);
        },
      ),
    );
  } else {
    console.warn('GitHub OAuth is not configured; skipping GitHub strategy.');
  }

  passport.serializeUser(function (user: any, cb) {
    process.nextTick(function () {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture,
      });
    });
  });

  passport.deserializeUser(function (user: any, cb) {
    process.nextTick(function () {
      return cb(null, user);
    });
  });
}
