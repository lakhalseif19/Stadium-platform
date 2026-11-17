import 'package:flutter/material.dart';

class GuardScheduleScreen extends StatelessWidget {
  const GuardScheduleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Today\'s Schedule')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Guard schedules are not available in this version.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
