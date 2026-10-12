import dotenv from 'dotenv';
import mongoose, { Schema, model, models } from 'mongoose';
import { randomUUID } from 'crypto';

dotenv.config();

export const AUTH_PROVIDER_VALUES = ['EMAIL', 'GOOGLE', 'GITHUB', 'GUEST'] as const;
export const GAME_STATUS_VALUES = [
  'IN_PROGRESS',
  'COMPLETED',
  'ABANDONED',
  'TIME_UP',
  'PLAYER_EXIT',
] as const;
export const GAME_RESULT_VALUES = ['WHITE_WINS', 'BLACK_WINS', 'DRAW'] as const;
export const TIME_CONTROL_VALUES = ['CLASSICAL', 'RAPID', 'BLITZ', 'BULLET'] as const;

export type AuthProvider = (typeof AUTH_PROVIDER_VALUES)[number];
export type GameStatus = (typeof GAME_STATUS_VALUES)[number];
export type GameResult = (typeof GAME_RESULT_VALUES)[number];
export type TimeControl = (typeof TIME_CONTROL_VALUES)[number];

export interface IUser {
  _id: string;
  username?: string | null;
  name?: string | null;
  email: string;
  provider: AuthProvider;
  password?: string | null;
  rating: number;
  gamesAsWhite?: string[];
  gamesAsBlack?: string[];
  createdAt?: Date;
  lastLogin?: Date | null;
}

export interface IGameMove {
  from: string;
  to: string;
  moveNumber: number;
  comments?: string | null;
  before: string;
  after: string;
  timeTaken?: number | null;
  createdAt?: Date;
  san?: string | null;
}

export interface IGame {
  _id: string;
  whitePlayer: string;
  blackPlayer: string;
  status: GameStatus;
  result?: GameResult | null;
  timeControl: TimeControl;
  startingFen: string;
  currentFen?: string | null;
  startAt: Date;
  endAt?: Date | null;
  moves: IGameMove[];
  opening?: string | null;
  event?: string | null;
}

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chess';

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(MONGODB_URI, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
  });

  return mongoose.connection;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, default: () => randomUUID() },
    username: { type: String, unique: true, sparse: true },
    name: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    provider: {
      type: String,
      enum: AUTH_PROVIDER_VALUES,
      required: true,
      default: 'EMAIL',
    },
    password: { type: String, default: null },
    rating: { type: Number, default: 1200 },
    gamesAsWhite: [{ type: String, ref: 'Game' }],
    gamesAsBlack: [{ type: String, ref: 'Game' }],
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: null },
  },
  {
    collection: 'users',
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

UserSchema.virtual('id').get(function () {
  return this._id;
});
UserSchema.index({ rating: 1 });

const MoveSchema = new Schema<IGameMove & { gameId?: string }>(
  {
    gameId: { type: String, default: null, index: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    moveNumber: { type: Number, required: true },
    comments: { type: String, default: null },
    before: { type: String, required: true },
    after: { type: String, required: true },
    timeTaken: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    san: { type: String, default: null },
  },
  { strict: true },
);

const GameSchema = new Schema<IGame>(
  {
    _id: { type: String, default: () => randomUUID() },
    whitePlayer: { type: String, ref: 'User', required: true },
    blackPlayer: { type: String, ref: 'User', required: true },
    status: {
      type: String,
      enum: GAME_STATUS_VALUES,
      required: true,
      default: 'IN_PROGRESS',
    },
    result: { type: String, enum: GAME_RESULT_VALUES, default: null },
    timeControl: {
      type: String,
      enum: TIME_CONTROL_VALUES,
      default: 'CLASSICAL',
    },
    startingFen: {
      type: String,
      default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    },
    currentFen: { type: String, default: null },
    startAt: { type: Date, default: Date.now },
    endAt: { type: Date, default: null },
    moves: [MoveSchema],
    opening: { type: String, default: null },
    event: { type: String, default: null },
  },
  {
    collection: 'games',
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

GameSchema.virtual('id').get(function () {
  return this._id;
});
GameSchema.index({ status: 1, result: 1 });
GameSchema.index({ startAt: 1 });

export const User = models.User ?? model<IUser>('User', UserSchema);
export const Game = models.Game ?? model<IGame>('Game', GameSchema);
export const Move = model('Move', MoveSchema, 'moves');

export const db = {
  connectDB,
  user: User,
  game: Game,
  move: Move,
  User,
  Game,
  Move,
};

export default db;

