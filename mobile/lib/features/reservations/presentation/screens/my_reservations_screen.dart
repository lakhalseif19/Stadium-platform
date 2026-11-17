import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/reservations_provider.dart';
import '../../../../core/widgets/reservation_card.dart';
import '../../../../core/widgets/loading_indicator.dart';
import '../../../../core/widgets/error_widget.dart';
import '../../../../core/widgets/empty_state.dart';

class MyReservationsScreen extends StatefulWidget {
  const MyReservationsScreen({super.key});

  @override
  State<MyReservationsScreen> createState() => _MyReservationsScreenState();
}

class _MyReservationsScreenState extends State<MyReservationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReservationsProvider>().fetchMyReservations();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Reservations')),
      body: Consumer<ReservationsProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) return const CustomLoadingIndicator();
          if (provider.error != null) {
            return CustomErrorWidget(
              message: provider.error!,
              onRetry: provider.fetchMyReservations,
            );
          }
          if (provider.reservations.isEmpty) {
            return const EmptyStateWidget(
              message: 'You have no reservations yet.',
              icon: Icons.calendar_today,
            );
          }

          return RefreshIndicator(
            onRefresh: provider.fetchMyReservations,
            child: ListView.builder(
              itemCount: provider.reservations.length,
              itemBuilder: (context, index) {
                final reservation = provider.reservations[index];
                return ReservationCard(
                  reservation: reservation,
                  onTap: () => context.push('/reservations/${reservation.id}'),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
