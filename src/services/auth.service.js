import argon2 from 'argon2';

export function createAuthService({ userRepo }) {
  return {
    async register({ email, password }) {
      const existing = await userRepo.findByEmail(email);
      if (existing) {
        const err = new Error('Email already registered');
        err.statusCode = 409;
        throw err;
      }
      const hash = await argon2.hash(password);
      return userRepo.create({ email, password: hash });
    },

    async verifyCredentials({ email, password }) {
      const user = await userRepo.findByEmail(email);
      if (!user) return null;
      const isValid = await argon2.verify(user.password, password);
      return isValid ? { id: user.id, email: user.email } : null;
    },
  };
}
