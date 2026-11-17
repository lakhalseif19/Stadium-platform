import 'package:flutter/material.dart';
import '../../features/reservations/data/models/reservation_model.dart';

class ReservationCard extends StatelessWidget {
  final ReservationModel reservation;
  final VoidCallback onTap;

  const ReservationCard(
      {super.key, required this.reservation, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        onTap: onTap,
        leading: Icon(Icons.event,
            color: reservation.status == 'CONFIRMED'
                ? Colors.green
                : Colors.orange),
        title: Text('Field ID: ${reservation.fieldId}'),
        subtitle: Text(
            '${reservation.date} | ${reservation.startTime} - ${reservation.endTime}'),
        trailing: Chip(
          label: Text(reservation.status, style: const TextStyle(fontSize: 12)),
          backgroundColor:
              _getStatusColor(reservation.status).withValues(alpha: 0.2),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'CONFIRMED':
        return Colors.green;
      case 'PENDING':
        return Colors.orange;
      case 'CANCELLED':
        return Colors.red;
      case 'COMPLETED':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }
}
