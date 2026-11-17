# Android release signing

The debug build keeps the Flutter template application ID and debug signing so local development remains unchanged. Release builds require the app owner's application ID and a private release keystore.

1. Copy `key.properties.example` to `key.properties`.
2. Replace the example ID with the application's assigned reverse-DNS ID. There are no custom URL schemes or deep links in the current Android manifest; the Kotlin activity package is only used as the Android namespace and can remain unchanged.
3. Set `storeFile` to the absolute path of the release keystore. Fill in the three signing values locally.
4. Keep the keystore and `key.properties` out of source control. The Android ignore file already excludes both `key.properties` and `*.jks`/`*.keystore` files.
5. Run `flutter build appbundle --release` (or `flutter build apk --release`) from `mobile`.

The Gradle release validation reports missing property names and whether the keystore exists, but never prints property values. Do not use the Android debug key for publishing. `applicationId=dz.your-organization.stadium` in the example is illustrative and must be replaced by the app owner.
