const express = require('express');
const axios = require('axios');
const app = express();

app.get('/offres', async (req, res) => {
    try {
        // Récupération des identifiants depuis les variables d'environnement Render
        const CLIENT_ID = process.env.PAR_studentevent_0fb9b30330edb0b9837684fc1609b79135f634d9a7d99488888560e77066f531;
        const CLIENT_SECRET = process.env.77bab34551cbf12894733ac789460989dc27cc3e2dab38008467718353047926;

        // Configuration précise pour France Travail
        // On utilise URLSearchParams pour éviter les erreurs d'encodage du scope
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('scope', 'api_offresdemploiv2 o2dso8w');

        // 1. Demande du jeton d'accès (Token)
        const tokenRes = await axios.post(
            'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire',
            params.toString(),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );

        const token = tokenRes.data.access_token;

        // 2. Appel de l'API France Travail pour récupérer les offres
        const response = await axios.get(
            'https://api.emploi-store.fr/partenaire/offresemploi/v2/offres/search',
            {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { 
                    motsCles: req.query.motsCles || 'iOS',
                    range: '0-9' 
                }
            }
        );

        // 3. Renvoi des données à ton application iOS
        res.json(response.data);

    } catch (error) {
        // Affiche l'erreur précise dans les logs de Render pour le débogage
        console.error("Détails de l'erreur France Travail:", error.response ? error.response.data : error.message);
        
        res.status(500).json({ 
            error: "Erreur France Travail", 
            details: error.response ? error.response.data : error.message 
        });
    }
});

// Port standard pour Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
