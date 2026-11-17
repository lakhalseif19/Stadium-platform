import 'package:flutter/material.dart';
import '../../features/stadiums/data/models/field_model.dart';
import '../utils/currency_utils.dart';

class FieldCard extends StatelessWidget {
  final FieldModel field;
  final VoidCallback onTap;

  const FieldCard({super.key, required this.field, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        onTap: onTap,
        leading: const Icon(Icons.sports_soccer, color: Colors.green),
        title: Text(field.name),
        subtitle: Text('${field.type} - ${field.bookingMode}'),
        trailing: Text(CurrencyUtils.formatDZD(field.pricePerHour)),
      ),
    );
  }
}
