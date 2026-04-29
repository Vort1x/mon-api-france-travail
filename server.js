const express = require('express');
const axios = require('axios');
const app = express();

// ─────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────
const BASE_URL_AUTH = 'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire';
const BASE_URL_API  = 'https://api.emploi-store.fr/partenaire';

// Cache du token en mémoire pour éviter un appel OAuth2 à chaque requête
let tokenCache = { value: null, expiresAt: 0 };

/**
 * Récupère un token OAuth2 valide.
 * Réutilise le token en cache s'il est encore valide (marge de 60s).
 */
async function getFranceTravailToken() {
    const now = Date.now();

    // Retourner le token en cache s'il est encore valide
    if (tokenCache.value && now < tokenCache.expiresAt) {
        return tokenCache.value;
    }

    const clientId = process.env.CLIENT_ID;

    // ⚠️  CORRECTION PRINCIPALE : scope sans "o2dso8w", séparé par des espaces
    // Format exact attendu par France Travail pour les comptes PAR_
    const scope = [
        `application_${clientId}`,
        'api_offresdemploiv2',
        'api_mes-evenements-emplov1',
        'api_labonneboitev1'
    ].join(' ');

    const params = new URLSearchParams();
    params.append('grant_type',    'client_credentials');
    params.append('client_id',     clientId);
    params.append('client_secret', process.env.CLIENT_SECRET);
    params.append('scope',         scope);

    const response = await axios.post(BASE_URL_AUTH, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, expires_in } = response.data;

    // Mise en cache avec marge de sécurité de 60 secondes
    tokenCache = {
        value:     access_token,
        expiresAt: now + (expires_in - 60) * 1000
    };

    return access_token;
}

/**
 * Middleware centralisé pour la gestion des erreurs API
 */
function handleApiError(res, context, error) {
    const status  = error.response?.status  || 500;
    const details = error.response?.data    || error.message;
    console.error(`[${context}] Erreur ${status}:`, details);
    res.status(status).json({ error: `Erreur ${context}`, details });
}

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

/**
 * GET /offres
 * Recherche des offres d'emploi
 * Query params :
 *   - motsCles  : mots-clés (défaut : "iOS")
 *   - codeRome  : code ROME du métier (ex: "M1805")
 *   - commune   : code INSEE commune (ex: "75056" pour Paris)
 *   - range     : pagination "0-9", "10-19"… (défaut : "0-9")
 */
app.get('/offres', async (req, res) => {
    try {
        const token = await getFranceTravailToken();

        const params = {
            motsCles: req.query.motsCles || 'iOS',
            range:    req.query.range    || '0-9',
        };
        if (req.query.codeRome) params.codeRome = req.query.codeRome;
        if (req.query.commune)  params.commune  = req.query.commune;

        const response = await axios.get(
            `${BASE_URL_API}/offresemploi/v2/offres/search`,
            {
                headers: { Authorization: `Bearer ${token}` },
                params
            }
        );
        res.json(response.data);
    } catch (error) {
        handleApiError(res, 'Offres', error);
    }
});

/**
 * GET /offres/:id
 * Détail d'une offre d'emploi par son identifiant France Travail
 */
app.get('/offres/:id', async (req, res) => {
    try {
        const token = await getFranceTravailToken();

        const response = await axios.get(
            `${BASE_URL_API}/offresemploi/v2/offres/${req.params.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        res.json(response.data);
    } catch (error) {
        handleApiError(res, 'Offre détail', error);
    }
});

/**
 * GET /evenements
 * Liste des événements emploi (job datings, salons…)
 * Query params :
 *   - page    : numéro de page (défaut : 1)
 *   - taille  : nb résultats (défaut : 10)
 *   - typeEvenement : filtre par type
 */
app.get('/evenements', async (req, res) => {
    try {
        const token = await getFranceTravailToken();

        const params = {
            page:   req.query.page   || 1,
            taille: req.query.taille || 10,
        };
        if (req.query.typeEvenement) params.typeEvenement = req.query.typeEvenement;

        const response = await axios.get(
            `${BASE_URL_API}/mes-evenements-emploi/v1/evenements`,
            {
                headers: { Authorization: `Bearer ${token}` },
                params
            }
        );
        res.json(response.data);
    } catch (error) {
        handleApiError(res, 'Événements', error);
    }
});

/**
 * GET /marche-travail
 * Synthèse des données du marché du travail (si l'API est activée sur ton compte)
 * Query params :
 *   - codeRome : code ROME du métier (ex: "M1805")
 */
app.get('/marche-travail', async (req, res) => {
    try {
        const token = await getFranceTravailToken();

        const response = await axios.get(
            `${BASE_URL_API}/labonneboite/v1/company/`,
            {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    rome_codes:       req.query.codeRome || 'M1805',
                    latitude:         req.query.lat      || '48.8566',
                    longitude:        req.query.lon      || '2.3522',
                    distance:         req.query.distance || 10,
                    from_number:      1,
                    to_number:        10,
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        handleApiError(res, 'Marché Travail', error);
    }
});

/**
 * GET /health
 * Vérification que le serveur est actif (utilisé par Render et l'app iOS)
 */
app.get('/', (req, res) => {
    res.json({
        status:    'Tipi-Tapa Proxy is running ✅',
        version:   '1.2.0',
        endpoints: ['/offres', '/offres/:id', '/evenements', '/marche-travail']
    });
});

// ─────────────────────────────────────────────
// DÉMARRAGE
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur Tipi-Tapa prêt sur le port ${PORT}`);
});
