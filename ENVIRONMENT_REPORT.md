# Rapport d'Audit de l'Environnement — Windows 10
**Plateforme :** Stadium Platform Sétif  
**Date d'inspection :** 09 octobre 2026  
**Système d'exploitation :** Microsoft Windows 10 Famille (Build 19045, 64 bits)

---

## 1. Synthèse de l'Environnement Matériel et Système

| Composant | Valeur Détectée | Évaluation |
| :--- | :--- | :--- |
| **Système** | Windows 10 Famille 64 bits (10.0.19045) | Conforme |
| **Mémoire RAM** | 8.0 Go Total (8 260 824 Ko), ~2.9 - 3.0 Go libres | Conforme pour développement ciblé (veiller à l'empreinte mémoire) |
| **Espace Disque C:** | 238 Go Total, **91.8 Go libres** | Très suffisant |
| **Sécurité** | Windows Defender & UAC actifs | Aucune désactivation requise |

---

## 2. Inventaire et Classification des Outils

Conformément aux directives, chaque outil est testé et classé dans une catégorie stricte.

### A. Outils Installés et Fonctionnels (Vérifiés par commande réelle)
- **Node.js :** `v22.12.0` (Vérifié via `node -v`)
- **npm :** `11.11.0` (Vérifié via `npm -v`)
- **Git :** `2.53.0.windows.1` (Vérifié via `git --version`)
- **Java JDK :** `OpenJDK 17.0.17 Temurin` (Vérifié via `java -version`)
- **Visual Studio Code :** `1.123.0` (Vérifié via `code --version`)
- **PostgreSQL 18 Serveur Natif :** Service Windows `postgresql-x64-18` actif et en cours d'exécution sur le port `3001` (Vérifié via `Get-Service` et `Get-NetTCPConnection`)
- **psql CLI :** Présent à `C:\Program Files\PostgreSQL\18\bin\psql.exe`

### B. Outils Installés mais Mal Configurés / Arrêtés
- **Docker Desktop :** CLI `29.5.3` et Compose `v5.1.4` présents, mais le démon `com.docker.service` est arrêté et le pipe nommé `//./pipe/dockerDesktopLinuxEngine` est inaccessible.
- **WSL 2 :** Configuré en version par défaut 2, mais le paquet du noyau Linux WSL2 est manquant (`Le fichier noyau WSL 2 est introuvable. Exécuter 'wsl --update'`), et aucune distribution Linux n'est enregistrée.

### C. Outils Manquants
- **Flutter SDK :** Absent du système (`flutter : commande introuvable`).
- **Dart SDK :** Absent du système (`dart : commande introuvable`).
- **Android Studio & Android SDK :** Non détectés dans `%LOCALAPPDATA%\Android\Sdk` ni dans le registre.
- **Redis (Serveur Natif Windows) :** Aucun service ou binaire Redis natif installé.

### D. Actions Nécessitant l'Approbation de l'Administrateur
1. **Mise à jour du noyau WSL2 (`wsl --update`) :** Requiert des privilèges administrateur pour installer le noyau Linux nécessaire à Docker Desktop.
2. **Démarrage et activation de Docker Desktop :** Requiert l'élévation pour démarrer le service et configurer l'intégration WSL2.
3. **Installation éventuelle de Flutter SDK :** Téléchargement et extraction dans un dossier utilisateur (`C:\src\flutter` recommandé) et ajout au PATH utilisateur (ne nécessite pas nécessairement d'élévation admin s'il est placé dans l'espace utilisateur).

### E. Outils Non Nécessaires pour la Phase Immédiate
- **Android Studio complet :** Le backend NestJS, la base PostgreSQL/PostGIS et le tableau de bord React Admin constituent le cœur de la plateforme et peuvent être développés, exécutés et testés immédiatement avec Node 22 et les outils disponibles. Pour le mobile Flutter, la base de code propre peut être générée et vérifiée sans nécessiter l'émulateur lourd qui surchargerait les 8 Go de RAM.

---

## 3. Disponibilité des Ports Réseau

| Port | Statut | Processus / Propriétaire | Remarque |
| :--- | :--- | :--- | :--- |
| **3000** | Libre | Aucun | Port standard pour l'API Backend NestJS |
| **3001** | **Occupé** | `postgres.exe` (PID 6252, `postgresql-x64-18`) | Instance native PostgreSQL 18 locale |
| **5432** | Libre | Aucun | Port PostgreSQL standard (libre pour Docker ou redirection) |
| **6379** | Libre | Aucun | Port Redis standard |
| **5173** | Libre | Aucun | Port Vite dev server (Dashboard React) |
| **80 / 443** | Libres | Aucun | Ports HTTP/HTTPS |

---

## 4. Recommandations Techniques d'Exécution

1. **Base de données :** Deux stratégies sont viables :
   - *Option A (Docker Compose) :* Démarrer Docker Desktop une fois WSL2 mis à jour, ce qui permet d'isoler PostgreSQL 16 + PostGIS 3.4 et Redis 7 sans conflit avec le PostgreSQL natif du port 3001.
   - *Option B (Local/Hybride) :* Utiliser le PostgreSQL local ou configurer Docker sur le port `5432` pour ne pas entrer en conflit avec le port `3001`.
2. **Gestion de la RAM (8 Go) :** Éviter de lancer simultanément un émulateur Android lourd et plusieurs conteneurs volumineux. Privilégier les tests unitaires et d'intégration ciblés.
