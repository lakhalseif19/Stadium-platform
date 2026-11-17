# stadium_platform_mobile

## Physical Android device (USB)

The default API URL `10.0.2.2` is for an Android emulator only. For a physical phone, connect the phone and development computer to the same trusted network, start the backend listening on a reachable interface (not only `127.0.0.1`), and pass the computer's LAN IPv4 address:

```powershell
adb devices
flutter build apk --debug --dart-define=API_BASE_URL=http://<DEVELOPMENT-PC-LAN-IP>:3000/api/v1
adb install -r build/app/outputs/flutter-apk/app-debug.apk
adb shell monkey -p com.example.stadium_platform_mobile 1
```

For example, use `http://192.168.1.25:3000/api/v1` when that is the computer's current LAN address. Allow inbound TCP port 3000 in the development firewall only for the trusted local network. `localhost` and `10.0.2.2` do not identify the Windows host from a physical Android phone. The development HTTP URL is not suitable for release builds.

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
