import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/otp_verification_screen.dart';
import '../../features/stadiums/presentation/screens/stadiums_list_screen.dart'; // To be created next if missing
import '../../features/reservations/presentation/screens/my_reservations_screen.dart';
import '../../features/reservations/presentation/screens/create_reservation_screen.dart';
import '../../features/reservations/presentation/screens/reservation_detail_screen.dart';
import '../../features/check_in/presentation/screens/qr_scanner_screen.dart';
import '../../features/check_in/presentation/screens/guard_schedule_screen.dart';
import '../../features/payments/presentation/screens/payment_screen.dart';
import '../../features/payments/presentation/screens/payment_success_screen.dart';

import '../../features/stadiums/presentation/screens/stadium_detail_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';

class AppRouter {
  final AuthProvider authProvider;

  AppRouter(this.authProvider);

  late final GoRouter router = GoRouter(
    initialLocation: '/',
    refreshListenable: authProvider,
    redirect: (context, state) {
      final isLoggedIn = authProvider.isAuthenticated;
      final isGuard = authProvider.isGuard;
      final isGoingToLogin = state.matchedLocation == '/login';
      final isGoingToRegister = state.matchedLocation == '/register';
      final isGoingToOtp = state.matchedLocation == '/otp';

      if (!isLoggedIn &&
          !isGoingToLogin &&
          !isGoingToRegister &&
          !isGoingToOtp) {
        return '/login';
      }
      if (isLoggedIn && (isGoingToLogin || isGoingToRegister)) {
        return isGuard ? '/guard-home' : '/';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
          path: '/register',
          builder: (context, state) => const RegisterScreen()),
      GoRoute(
          path: '/otp',
          builder: (context, state) => const OtpVerificationScreen()),

      // Citizen Routes
      GoRoute(
        path: '/',
        builder: (context, state) => const StadiumsListScreen(),
      ),
      GoRoute(
        path: '/stadiums/:id',
        builder: (context, state) =>
            StadiumDetailScreen(stadiumId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/reservations',
        builder: (context, state) => const MyReservationsScreen(),
      ),
      GoRoute(
        path: '/reservations/create/:fieldId',
        builder: (context, state) =>
            CreateReservationScreen(fieldId: state.pathParameters['fieldId']!),
      ),
      GoRoute(
        path: '/reservations/:id',
        builder: (context, state) =>
            ReservationDetailScreen(reservationId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/payments/:id',
        builder: (context, state) =>
            PaymentScreen(reservationId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/payment-success',
        builder: (context, state) => const PaymentSuccessScreen(),
      ),

      // Guard Routes
      GoRoute(
        path: '/guard-home',
        builder: (context, state) => Scaffold(
          appBar: AppBar(title: const Text('Guard Home')),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                    onPressed: () => context.push('/guard/scan'),
                    child: const Text('Scan QR')),
                const SizedBox(height: 16),
                ElevatedButton(
                    onPressed: () => context.push('/guard/schedule'),
                    child: const Text('Today Schedule')),
              ],
            ),
          ),
        ),
      ),
      GoRoute(
        path: '/guard/scan',
        builder: (context, state) => const QrScannerScreen(),
      ),
      GoRoute(
        path: '/guard/schedule',
        builder: (context, state) => const GuardScheduleScreen(),
      ),
    ],
  );
}
