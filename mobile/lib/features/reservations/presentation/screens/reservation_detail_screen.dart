import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../providers/reservations_provider.dart';
import '../../data/models/reservation_model.dart';
import '../../../../core/widgets/loading_indicator.dart';

class ReservationDetailScreen extends StatefulWidget {
  final String reservationId;
  const ReservationDetailScreen({super.key, required this.reservationId});

  @override
  State<ReservationDetailScreen> createState() =>
      _ReservationDetailScreenState();
}

class _ReservationDetailScreenState extends State<ReservationDetailScreen> {
  ReservationModel? _reservation;
  String? _qrToken;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchDetail();
  }

  void _fetchDetail() async {
    final provider = context.read<ReservationsProvider>();
    final res = await provider.getDetail(widget.reservationId);
    String? qr;
    if (res != null && res.status == 'CONFIRMED') {
      qr = await provider.getQrToken(widget.reservationId);
    }
    if (!mounted) return;
    setState(() {
      _reservation = res;
      _qrToken = qr;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: CustomLoadingIndicator());
    if (_reservation == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: const Center(child: Text('Reservation not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Reservation Details')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Status: ${_reservation!.status}',
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Text('Date: ${_reservation!.date}'),
            Text('Time: ${_reservation!.startTime} - ${_reservation!.endTime}'),
            const SizedBox(height: 32),
            if (_qrToken != null) ...[
              const Text('Present this QR Code to the guard:',
                  textAlign: TextAlign.center),
              const SizedBox(height: 16),
              Center(
                child: QrImageView(
                  data: _qrToken!,
                  version: QrVersions.auto,
                  size: 200.0,
                ),
              ),
            ] else if (_reservation!.status == 'CONFIRMED') ...[
              const Text(
                'The QR code is unavailable. Confirmed payment is required before check-in.',
                textAlign: TextAlign.center,
              ),
            ] else if (_reservation!.status == 'PENDING_PAYMENT') ...[
              ElevatedButton(
                onPressed: () => context.push('/payments/${_reservation!.id}'),
                child: const Text('Payment unavailable'),
              )
            ]
          ],
        ),
      ),
    );
  }
}
