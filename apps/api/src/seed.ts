import "dotenv/config";
import { env } from "./shared/config/env.js";
import { connectMongo, disconnectMongo } from "./shared/lib/mongoose.js";
import { hashPassword } from "./shared/lib/password.js";
import { UserModel } from "./modules/identity/infrastructure/UserModel.js";
import { TheatreOwnerRequestModel } from "./modules/identity/infrastructure/TheatreOwnerRequestModel.js";
import { MovieModel } from "./modules/catalog/infrastructure/MovieModel.js";
import { TheatreModel } from "./modules/theatre/infrastructure/TheatreModel.js";
import { ScreenModel } from "./modules/theatre/infrastructure/ScreenModel.js";
import { ShowModel } from "./modules/show/infrastructure/ShowModel.js";
import { BookingModel } from "./modules/booking/infrastructure/BookingModel.js";
import { PaymentModel } from "./modules/payment/infrastructure/PaymentModel.js";

/**
 * Seeds the database with a small, realistic dataset (users of every role, movies,
 * a theatre with screens, and upcoming shows) so the app can be exercised end-to-end
 * without manually clicking through signup/admin-approval/show-scheduling first.
 *
 * Usage: npm run seed --workspace=@ticketverse/api  (refuses to run against NODE_ENV=production)
 */

// Well-known, non-production dev/test credential — documented in README, overridable via
// the SEED_PASSWORD env var. Not a secret: this script only ever targets local/dev databases.
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "Password@123"; // NOSONAR

const TEST_ACCOUNTS = [
  { name: "Ava Admin", email: "admin@ticketverse.dev", role: "admin" as const },
  {
    name: "Oscar Owner",
    email: "owner@ticketverse.dev",
    role: "theatre_owner" as const,
  },
  { name: "Uma User", email: "user@ticketverse.dev", role: "user" as const },
  {
    name: "Jack Moviegoer",
    email: "jack@ticketverse.dev",
    role: "user" as const,
  },
];

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function seedUsers() {
  const passwordHash = await hashPassword(SEED_PASSWORD);
  const users: Record<string, import("mongoose").Types.ObjectId> = {};

  for (const account of TEST_ACCOUNTS) {
    const doc = await UserModel.findOneAndUpdate(
      { email: account.email },
      {
        $set: {
          name: account.name,
          email: account.email,
          passwordHash,
          role: account.role,
        },
        $setOnInsert: { tokenVersion: 0 },
      },
      { upsert: true, new: true },
    );
    users[account.email] = doc._id;
  }

  return users;
}

async function seedTheatreOwnerRequest(
  ownerId: import("mongoose").Types.ObjectId,
) {
  await TheatreOwnerRequestModel.findOneAndUpdate(
    { userId: ownerId },
    {
      $set: {
        userId: ownerId,
        theatreName: "Cineplex Downtown",
        city: "Springfield",
        reason: "Seed data — pre-approved theatre owner account.",
        status: "approved",
      },
    },
    { upsert: true },
  );
}

async function seedMovies() {
  const movies = [
    {
      title: "Galactic Drift",
      description:
        "A stranded crew races against a collapsing wormhole to bring humanity's last colony ship home.",
      durationMinutes: 142,
      genres: ["Sci-Fi", "Adventure"],
      language: "English",
      releaseDate: new Date("2026-01-15"),
      posterUrl: "https://picsum.photos/seed/galactic-drift/400/600",
    },
    {
      title: "The Last Melody",
      description:
        "A retired composer mentors a street musician, rediscovering the song that once broke his heart.",
      durationMinutes: 118,
      genres: ["Drama", "Music"],
      language: "English",
      releaseDate: new Date("2026-02-01"),
      posterUrl: "https://picsum.photos/seed/last-melody/400/600",
    },
    {
      title: "Shadow Protocol",
      description:
        "An disavowed agent has 24 hours to expose a conspiracy before it reaches the highest office.",
      durationMinutes: 128,
      genres: ["Action", "Thriller"],
      language: "English",
      releaseDate: new Date("2026-02-10"),
      posterUrl: "https://picsum.photos/seed/shadow-protocol/400/600",
    },
  ];

  const ids: import("mongoose").Types.ObjectId[] = [];
  for (const movie of movies) {
    const doc = await MovieModel.findOneAndUpdate(
      { title: movie.title },
      { $set: movie },
      { upsert: true, new: true },
    );
    ids.push(doc._id);
  }
  return ids;
}

async function seedTheatre(ownerId: import("mongoose").Types.ObjectId) {
  const doc = await TheatreModel.findOneAndUpdate(
    { name: "Cineplex Downtown", ownerId },
    {
      $set: {
        ownerId,
        name: "Cineplex Downtown",
        city: "Springfield",
        address: "12 Main Street, Springfield",
      },
    },
    { upsert: true, new: true },
  );
  return doc._id;
}

async function seedScreens(theatreId: import("mongoose").Types.ObjectId) {
  const screens = [
    {
      name: "Screen 1",
      layout: [
        { row: "A", seatCount: 8, seatType: "regular" as const },
        { row: "B", seatCount: 8, seatType: "regular" as const },
        { row: "C", seatCount: 6, seatType: "premium" as const },
      ],
    },
    {
      name: "Screen 2 (IMAX)",
      layout: [
        { row: "A", seatCount: 10, seatType: "regular" as const },
        { row: "B", seatCount: 6, seatType: "recliner" as const },
      ],
    },
  ];

  const ids: import("mongoose").Types.ObjectId[] = [];
  for (const screen of screens) {
    const doc = await ScreenModel.findOneAndUpdate(
      { theatreId, name: screen.name },
      { $set: { theatreId, name: screen.name, layout: screen.layout } },
      { upsert: true, new: true },
    );
    ids.push(doc._id);
  }
  return ids;
}

const PRICING = [
  { seatType: "regular" as const, price: 200 },
  { seatType: "premium" as const, price: 350 },
  { seatType: "recliner" as const, price: 550 },
];

async function seedShows(
  movieIds: import("mongoose").Types.ObjectId[],
  theatreId: import("mongoose").Types.ObjectId,
  screenIds: import("mongoose").Types.ObjectId[],
) {
  const showtimeOffsetsHours = [4, 8, 24, 28];

  // Re-running the seed should leave a clean slate: drop stale bookings/payments
  // tied to this theatre's old shows before regenerating fresh showtimes.
  const staleShowIds = await ShowModel.find({ theatreId }).distinct("_id");
  if (staleShowIds.length > 0) {
    const staleBookingIds = await BookingModel.find({
      showId: { $in: staleShowIds },
    }).distinct("_id");
    await PaymentModel.deleteMany({ bookingId: { $in: staleBookingIds } });
    await BookingModel.deleteMany({ showId: { $in: staleShowIds } });
  }
  await ShowModel.deleteMany({ theatreId });

  const shows = [];
  for (const [movieIndex, movieId] of movieIds.entries()) {
    const screenId = screenIds[movieIndex % screenIds.length];
    for (const offset of showtimeOffsetsHours) {
      shows.push({
        movieId,
        screenId,
        theatreId,
        startTime: hoursFromNow(offset),
        pricing: PRICING,
      });
    }
  }

  await ShowModel.insertMany(shows);
}

async function seed() {
  if (env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to run the seed script against NODE_ENV=production.",
    );
  }

  await connectMongo();
  console.log(`Connected to ${env.MONGODB_URI}. Seeding...`);

  const users = await seedUsers();
  await seedTheatreOwnerRequest(users["owner@ticketverse.dev"]!);
  const movieIds = await seedMovies();
  const theatreId = await seedTheatre(users["owner@ticketverse.dev"]!);
  const screenIds = await seedScreens(theatreId);
  await seedShows(movieIds, theatreId, screenIds);

  console.log("\nSeed complete. Test accounts (all use the same password):\n");
  console.table(
    TEST_ACCOUNTS.map((account) => ({
      role: account.role,
      email: account.email,
      password: SEED_PASSWORD,
    })),
  );

  await disconnectMongo();
}

try {
  await seed();
  process.exit(0);
} catch (err: unknown) {
  console.error("Seed failed:", err);
  process.exit(1);
}
