import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val releaseProperties = Properties().apply {
    val propertiesFile = rootProject.file("key.properties")
    if (propertiesFile.isFile) propertiesFile.inputStream().use { load(it) }
}
val releaseApplicationId = releaseProperties.getProperty("applicationId")?.trim().orEmpty()
val releaseStorePath = releaseProperties.getProperty("storeFile")?.trim().orEmpty()
val releaseStorePassword = releaseProperties.getProperty("storePassword")?.trim().orEmpty()
val releaseKeyAlias = releaseProperties.getProperty("keyAlias")?.trim().orEmpty()
val releaseKeyPassword = releaseProperties.getProperty("keyPassword")?.trim().orEmpty()

val validateReleaseSigning = tasks.register("validateReleaseSigning") {
    group = "verification"
    description = "Checks local Android release application ID and signing configuration."
    doLast {
        val requiredValues = mapOf(
            "applicationId" to releaseApplicationId,
            "storeFile" to releaseStorePath,
            "storePassword" to releaseStorePassword,
            "keyAlias" to releaseKeyAlias,
            "keyPassword" to releaseKeyPassword,
        )
        val missing = requiredValues.filterValues(String::isBlank).keys
        val keystore = releaseStorePath.takeIf(String::isNotBlank)?.let(::file)
        val usesDebugKeystore = keystore?.name.equals("debug.keystore", ignoreCase = true)
        val invalidApplicationId = releaseApplicationId.startsWith("com.example.") ||
            !releaseApplicationId.matches(Regex("[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+"))

        if (missing.isNotEmpty() || keystore?.isFile != true || usesDebugKeystore || invalidApplicationId) {
            val problems = buildList {
                if (missing.isNotEmpty()) add("missing key.properties values: ${missing.joinToString()}")
                if (keystore?.isFile != true) add("storeFile must point to an existing release keystore")
                if (usesDebugKeystore) add("storeFile must not use the Android debug keystore")
                if (invalidApplicationId) add("applicationId must be a valid, non-example reverse-DNS ID")
            }
            throw GradleException(
                "Release signing is not configured (${problems.joinToString("; ")}). " +
                    "Create android/key.properties from android/key.properties.example. " +
                    "Never use the debug signing key for a release build.",
            )
        }
    }
}

android {
    namespace = "com.example.stadium_platform_mobile"
    compileSdk = 36
    ndkVersion = flutter.ndkVersion

    compileOptions {
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    signingConfigs {
        create("release") {
            if (releaseStorePath.isNotBlank()) storeFile = file(releaseStorePath)
            storePassword = releaseStorePassword
            keyAlias = releaseKeyAlias
            keyPassword = releaseKeyPassword
        }
    }

    defaultConfig {
        // Release identity is supplied locally; no publisher ID is assumed here.
        applicationId = releaseApplicationId.ifBlank { "com.example.stadium_platform_mobile" }
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

tasks.matching { it.name == "preReleaseBuild" }.configureEach {
    dependsOn(validateReleaseSigning)
}

tasks.matching { it.name == "validateSigningRelease" }.configureEach {
    dependsOn(validateReleaseSigning)
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:1.2.2")
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
