const express = require('express');
const axios = require('axios');
const app = express();

// ─────────────────────────────────────────────
// CONFIGURATION — URLs mises à jour (migration Pôle Emploi → France Travail)
// ─────────────────────────────────────────────
const BASE_URL_AUTH = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire';
const BASE_URL_API  = 'https://api.francetravail.io/partenaire';

// Cache du token en mémoire
let tokenCache = { value: null, expiresAt: 0 };

/**
 * Récupère un token OAuth2 valide avec les bons scopes.
 *
 * SCOPES EXPLIQUÉS :
 *   application_XXX            → identifie ton application (obligatoire)
 *   api_offresdemploiv2        → accès à l'API Offres d'emploi
 *   o2dsoffre                  → sous-scope pour la RECHERCHE d'offres (obligatoire !)
 *   api_mes-evenements-emplov1 → accès aux événements emploi
 */
async function getFranceTravailToken() {
    const now = Date.now();

    if (tokenCache.value && now < tokenCache.expiresAt) {
        return tokenCache.value;
    }

    const clientId = process.env.CLIENT_ID;

    // ✅ Scopes corrects — séparés par des espaces, sans virgules
    const scope = `application_${clientId} api_offresdemploiv2 o2dsoffre api_mes-evenements-emplov1`;

    const params = new URLSearchParams();
    params.append('grant_type',    'client_credentials');
    params.append('client_id',     clientId);
    params.append('client_secret', process.env.CLIENT_SECRET);
    params.append('scope',         scope);

    const response = await axios.post(BASE_URL_AUTH, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, expires_in } = response.data;

    tokenCache = {
        value:     access_token,
        expiresAt: now + (expires_in - 60) * 1000
    };

    console.log(`✅ Token obtenu, expire dans ${expires_in}s`);
    return access_token;
}

function handleApiError(res, context, error) {
    const status  = error.response?.status  || 500;
    const details = error.response?.data    || error.message;
    console.error(`[${context}] Erreur ${status}:`, JSON.stringify(details));
    res.status(status).json({ error: `Erreur ${context}`, details });
}

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

/**
 * GET /offres
 * Query params : motsCles, codeRome, commune, range
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
            `${BASE_URL_API}/offresdemploi/v2/offres/search`,
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
 * Détail d'une offre par son ID France Travail
 */
app.get('/offres/:id', async (req, res) => {
    try {
        const token = await getFranceTravailToken();

        const response = await axios.get(
            `${BASE_URL_API}/offresdemploi/v2/offres/${req.params.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        res.json(response.data);
    } catch (error) {
        handleApiError(res, 'Offre détail', error);
    }
});

/**
 * GET /evenements
 * Query params : page, taille
 */
app.get('/evenements', async (req, res) => {
    try {
        const token = await getFranceTravailToken();

        const response = await axios.get(
            `${BASE_URL_API}/mes-evenements-emploi/v1/evenements`,
            {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page:   req.query.page   || 1,
                    taille: req.query.taille || 10,
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        handleApiError(res, 'Événements', error);
    }
});

/**
 * GET /
 * Health check + debug du scope utilisé
 */
app.get('/', (req, res) => {
    const clientId = process.env.CLIENT_ID || '⚠️ CLIENT_ID manquant !';
    res.json({
        status:    'Tipi-Tapa Proxy is running ✅',
        version:   '1.3.0',
        auth_url:  BASE_URL_AUTH,
        api_url:   BASE_URL_API,
        scope:     `application_${clientId} api_offresdemploiv2 o2dsoffre api_mes-evenements-emplov1`,
        endpoints: ['/offres', '/offres/:id', '/evenements']
    });
});

// ─────────────────────────────────────────────
// DÉMARRAGE
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur Tipi-Tapa prêt sur le port ${PORT}`);
    console.log(`   Auth : ${BASE_URL_AUTH}`);
    console.log(`   API  : ${BASE_URL_API}`);
});
