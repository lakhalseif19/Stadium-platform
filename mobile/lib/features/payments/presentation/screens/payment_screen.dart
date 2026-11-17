import 'package:flutter/material.dart';

class PaymentScreen extends StatelessWidget {
  final String reservationId;
  const PaymentScreen({super.key, required this.reservationId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payment')),
      body: const Padding(
        padding: EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Icon(Icons.lock_outline, size: 64, color: Colors.blueGrey),
            SizedBox(height: 16),
            Text(
              'Payments are unavailable',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 12),
            Text(
              'A secure payment provider has not been configured. Your reservation will not be marked as paid.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
