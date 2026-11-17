import React from 'react';
import { UnavailableFeature } from '../components/common/UnavailableFeature';

export const TeamsPage: React.FC = () => <UnavailableFeature title="Équipes" detail="Le backend permet la création, mais n’expose ni liste ni mise à jour pour l’administration. Les outils de gestion restent désactivés afin de ne pas afficher de données de démonstration." />;
