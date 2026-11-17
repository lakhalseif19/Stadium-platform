import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/rbac/guards/roles.guard';
import { PermissionsGuard } from '../src/rbac/guards/permissions.guard';

const createContext = (request: any): any => ({
  getHandler: () => function handler() {},
  getClass: () => class Controller {},
  switchToHttp: () => ({ getRequest: () => request }),
});
const jwtConfig = { get: () => 'access-secret' };

describe('global route guards', () => {
  it('allows an explicitly public request without a token', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(true) };
    const guard = new JwtAuthGuard(
      { verifyAsync: jest.fn() } as any,
      reflector as any,
      jwtConfig as any,
    );
    await expect(guard.canActivate(createContext({ headers: {} }))).resolves.toBe(true);
  });

  it('rejects an unauthenticated protected request', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const guard = new JwtAuthGuard(
      { verifyAsync: jest.fn() } as any,
      reflector as any,
      jwtConfig as any,
    );
    await expect(guard.canActivate(createContext({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects invalid credentials and attaches identity from the verified subject', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const invalid = new JwtAuthGuard(
      { verifyAsync: jest.fn().mockRejectedValue(new Error('invalid')) } as any,
      reflector as any,
      jwtConfig as any,
    );
    await expect(
      invalid.canActivate(createContext({ headers: { authorization: 'Bearer bad' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const request: any = { headers: { authorization: 'Bearer good' } };
    const valid = new JwtAuthGuard(
      {
        verifyAsync: jest
          .fn()
          .mockResolvedValue({ sub: 'verified-user', roles: ['ADMIN'], tokenType: 'access' }),
      } as any,
      reflector as any,
      jwtConfig as any,
    );
    await expect(valid.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user).toEqual({
      sub: 'verified-user',
      id: 'verified-user',
      roles: ['ADMIN'],
      tokenType: 'access',
    });
  });

  it('rejects refresh tokens on protected API routes', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const guard = new JwtAuthGuard(
      {
        verifyAsync: jest.fn().mockResolvedValue({ sub: 'verified-user', tokenType: 'refresh' }),
      } as any,
      reflector as any,
      jwtConfig as any,
    );
    await expect(
      guard.canActivate(createContext({ headers: { authorization: 'Bearer refresh' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects expired access tokens', async () => {
    const secret = 'short-lived-access-secret';
    const jwt = new JwtService({ secret });
    const expiredToken = jwt.sign(
      { sub: 'expired-user', tokenType: 'access' },
      { secret, expiresIn: '-1s' },
    );
    const guard = new JwtAuthGuard(
      jwt,
      { getAllAndOverride: jest.fn().mockReturnValue(false) } as any,
      { get: () => secret } as any,
    );

    await expect(
      guard.canActivate(createContext({ headers: { authorization: `Bearer ${expiredToken}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('uses the access secret first and accepts a typed legacy access token during migration', async () => {
    const previousLegacySecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'legacy-test-secret';
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const verifyAsync = jest
      .fn()
      .mockRejectedValueOnce(new Error('not signed by access key'))
      .mockResolvedValueOnce({ sub: 'legacy-user', tokenType: 'access' });
    const guard = new JwtAuthGuard(
      { verifyAsync } as any,
      reflector as any,
      { get: () => 'new-access-secret' } as any,
    );

    await expect(
      guard.canActivate(createContext({ headers: { authorization: 'Bearer legacy' } })),
    ).resolves.toBe(true);
    expect(verifyAsync.mock.calls.map((call) => call[1]?.secret)).toEqual([
      'new-access-secret',
      'legacy-test-secret',
    ]);
    if (previousLegacySecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousLegacySecret;
  });

  it('denies ordinary roles and accepts case-insensitive admin role metadata', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['admin']) };
    const guard = new RolesGuard(reflector as any);
    expect(guard.canActivate(createContext({ user: { roles: ['CITIZEN'] } }))).toBe(false);
    expect(guard.canActivate(createContext({ user: { roles: ['ADMIN'] } }))).toBe(true);
  });

  it('requires every decorated permission', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['SCAN_RESERVATION', 'CHECK_IN']),
    };
    const guard = new PermissionsGuard(reflector as any);
    expect(guard.canActivate(createContext({ user: { permissions: ['SCAN_RESERVATION'] } }))).toBe(
      false,
    );
    expect(
      guard.canActivate(createContext({ user: { permissions: ['SCAN_RESERVATION', 'CHECK_IN'] } })),
    ).toBe(true);
  });
});
