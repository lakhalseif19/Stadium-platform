import 'package:intl/intl.dart';

class CurrencyUtils {
  static String formatDZD(double amount) {
    final formatter = NumberFormat.currency(
      symbol: 'DA',
      decimalDigits: 2,
      customPattern: '#,##0.00 \u00a4',
    );
    return formatter.format(amount);
  }
}
