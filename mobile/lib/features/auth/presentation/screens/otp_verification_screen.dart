import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({super.key});

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final _codeController = TextEditingController();

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final auth = context.read<AuthProvider>();
    final verified = await auth.verifyPhoneOtp(_codeController.text);
    if (!mounted) return;
    if (verified) {
      context.go('/login');
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(auth.error ?? 'Phone verification failed')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('OTP Verification')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Enter the code sent to your phone'),
              if (auth.pendingVerificationPhone == null)
                const Padding(
                  padding: EdgeInsets.only(top: 12),
                  child: Text('Register first to verify a phone number.'),
                ),
              const Padding(
                padding: EdgeInsets.only(top: 12),
                child: Text(
                  'SMS delivery is not configured yet. You will need a code from a configured SMS provider.',
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _codeController,
                decoration: const InputDecoration(labelText: 'OTP Code'),
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed:
                    auth.isLoading || auth.pendingVerificationPhone == null
                        ? null
                        : _verify,
                child: auth.isLoading
                    ? const CircularProgressIndicator()
                    : const Text('Verify'),
              )
            ],
          ),
        ),
      ),
    );
  }
}
