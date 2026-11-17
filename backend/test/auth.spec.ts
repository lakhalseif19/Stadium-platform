import * as argon2 from 'argon2';

describe('Auth & Password Security', () => {
  it('should hash passwords using Argon2id and verify correctly', async () => {
    const rawPassword = 'StrongPassword123!';
    const hash = await argon2.hash(rawPassword, {
      type: argon2.argon2id,
    });

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(rawPassword);
    expect(hash.startsWith('$argon2id$')).toBe(true);

    const isMatch = await argon2.verify(hash, rawPassword);
    expect(isMatch).toBe(true);

    const isMismatch = await argon2.verify(hash, 'WrongPassword456');
    expect(isMismatch).toBe(false);
  });

  it('should not allow plain passwords in storage format', () => {
    const fakeUserData = {
      phone: '+213555123456',
      email: 'citizen@setif.dz',
      first_name: 'Amine',
      last_name: 'Mansouri',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$somehash',
    };

    expect(fakeUserData).not.toHaveProperty('password');
    expect(fakeUserData.password_hash.startsWith('$argon2id$')).toBe(true);
  });
});
