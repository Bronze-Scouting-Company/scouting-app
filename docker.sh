#!/bin/bash

# Couleurs pour l'affichage
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ENV_FILE="../.env"

# Fonction d'aide
show_help() {
    echo -e "${BLUE}Usage:${NC} ./script.sh [COMMAND] [PROFILE]"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo "  up      - Démarrer les conteneurs"
    echo "  down    - Arrêter les conteneurs"
    echo "  restart - Redémarrer les conteneurs"
    echo "  logs    - Afficher les logs"
    echo "  build   - Rebuild les images"
    echo ""
    echo -e "${BLUE}Profiles:${NC}"
    echo "  dev     - Environnement de développement"
    echo "  prod    - Environnement de production"
    echo ""
    echo -e "${BLUE}Exemples:${NC}"
    echo "  ./script.sh up dev"
    echo "  ./script.sh down prod"
    echo "  ./script.sh logs dev"
}

# Vérifier les arguments
if [ $# -lt 2 ]; then
    show_help
    exit 1
fi

COMMAND=$1
PROFILE=$2

# Vérifier le profil
if [ "$PROFILE" != "dev" ] && [ "$PROFILE" != "prod" ]; then
    echo -e "${RED}Erreur:${NC} Le profil doit être 'dev' ou 'prod'"
    exit 1
fi

cd ./infra
# Exécuter la commande
case $COMMAND in
    up)
        echo -e "${GREEN}Démarrage de l'environnement ${PROFILE}...${NC}"
        docker compose --profile $PROFILE --env-file $ENV_FILE up -d --build
        echo -e "${GREEN}✓ Environnement ${PROFILE} démarré${NC}"
        ;;
    
    down)
        echo -e "${YELLOW}Arrêt de l'environnement ${PROFILE}...${NC}"
        docker compose --profile $PROFILE --env-file $ENV_FILE down
        echo -e "${GREEN}✓ Environnement ${PROFILE} arrêté${NC}"
        ;;
    
    restart)
        echo -e "${YELLOW}Redémarrage de l'environnement ${PROFILE}...${NC}"
        docker compose --profile $PROFILE --env-file $ENV_FILE down
        docker compose --profile $PROFILE --env-file $ENV_FILE up -d --build
        echo -e "${GREEN}✓ Environnement ${PROFILE} redémarré${NC}"
        ;;
    
    logs)
        echo -e "${BLUE}Logs de l'environnement ${PROFILE}:${NC}"
        docker compose --profile $PROFILE logs -f
        ;;
    
    build)
        echo -e "${BLUE}Rebuild des images ${PROFILE}...${NC}"
        docker compose --profile $PROFILE build --no-cache
        echo -e "${GREEN}✓ Images ${PROFILE} reconstruites${NC}"
        ;;
    
    *)
        echo -e "${RED}Erreur:${NC} Commande inconnue '$COMMAND'"
        show_help
        exit 1
        ;;
esac
