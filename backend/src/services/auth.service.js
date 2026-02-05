"use strict";

/**
 * Auth Service (MVP)
 *
 * Responsibilities:
 * - Own authentication flows (register, login)
 * - Enforce auth-related business rules
 * - Delegate session lifecycle to SessionService
 *
 * This service:
 * - Is HTTP-agnostic
 * - Does NOT manage cookies
 * - Does NOT validate sessions for middleware
 */

const bcrypt = require("bcrypt");

const usersRepo = require("../db/users.db");
const sessionService = require("./sessions.service.js");

const BCRYPT_ROUNDS = 12;

/* ================================================================
 * Register
 * ================================================================ */

exports.register = async ({ username, email, password, context }) => {
  validatePassword(password);

  const existingEmail = await usersRepo.findByEmail(email);
  if (existingEmail) {
    const err = new Error("Email already in use");
    err.status = 409;
    throw err;
  }

  const existingUsername = await usersRepo.findByUsername(username);
  if (existingUsername) {
    const err = new Error("Username already in use");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await usersRepo.create({
    username,
    email,
    passwordHash,
  });

  const session = await sessionService.createSession({
    beekeeperId: user.id,
    context,
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    session,
  };
};

/* ================================================================
 * Login
 * ================================================================ */

exports.login = async ({ identifier, password, context }) => {
  const user =
    (await usersRepo.findByEmail(identifier)) ||
    (await usersRepo.findByUsername(identifier));

  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  // Do NOT validate password policy on login
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  await sessionService.invalidateAllSessionsForUser({
    beekeeperId: user.id,
  });

  const session = await sessionService.createSession({
    beekeeperId: user.id,
    context,
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    session,
  };
};

/* ================================================================
 * Change password
 * ================================================================ */

exports.changePassword = async ({ userId, currentPassword, newPassword }) => {
  validatePassword(newPassword);

  const user = await usersRepo.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const fullUser = await usersRepo.findByEmail(user.email);

  const valid = await bcrypt.compare(currentPassword, fullUser.password_hash);

  if (!valid) {
    const err = new Error("Current password incorrect");
    err.status = 401;
    throw err;
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await usersRepo.updatePasswordHash(userId, newHash);

  await sessionService.invalidateAllSessionsForUser({
    beekeeperId: userId,
  });
};

function validatePassword(password) {
  if (typeof password !== "string") {
    const err = new Error("Invalid password");
    err.status = 400;
    throw err;
  }
  if (password.length < 8) {
    const err = new Error("Password must be at least 8 characters");
    err.status = 400;
    throw err;
  }
  if (password.length > 72) {
    const err = new Error(
      "Password must be at most 72 characters (bcrypt limit)",
    );
    err.status = 400;
    throw err;
  }
}
