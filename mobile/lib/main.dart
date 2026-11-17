import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'core/storage/secure_storage.dart';
import 'core/network/api_client.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/presentation/providers/auth_provider.dart';
import 'features/stadiums/data/stadium_repository.dart';
import 'features/stadiums/presentation/providers/stadiums_provider.dart';
import 'features/reservations/data/reservation_repository.dart';
import 'features/reservations/presentation/providers/reservations_provider.dart';
import 'features/check_in/data/check_in_repository.dart';
import 'features/check_in/presentation/providers/check_in_provider.dart';
import 'features/payments/data/payment_repository.dart';
import 'features/payments/presentation/providers/payments_provider.dart';
// Note: Other providers (Notifications, etc.) will be added here

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final secureStorage = SecureStorage();
  final apiClient = ApiClient(secureStorage);

  final authRepository = AuthRepository(apiClient);
  final stadiumRepository = StadiumRepository(apiClient);
  final reservationRepository = ReservationRepository(apiClient);
  final checkInRepository = CheckInRepository(apiClient);
  final paymentRepository = PaymentRepository(apiClient);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
            create: (_) => AuthProvider(authRepository, secureStorage)),
        ChangeNotifierProvider(
            create: (_) => StadiumsProvider(stadiumRepository)),
        ChangeNotifierProvider(
            create: (_) => ReservationsProvider(reservationRepository)),
        ChangeNotifierProvider(
            create: (_) => CheckInProvider(checkInRepository)),
        ChangeNotifierProvider(
            create: (_) => PaymentsProvider(paymentRepository)),
      ],
      child: const StadiumApp(),
    ),
  );
}
