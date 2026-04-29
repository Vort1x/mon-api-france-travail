const express = require('express');
const axios = require('axios');
const app = express();

app.get('/offres', async (req, res) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID;
        const CLIENT_SECRET = process.env.CLIENT_SECRET;

        // Configuration du Scope exacte pour France Travail
        const scope = `application_${CLIENT_ID} api_offresdemploiv2 o2dso8w`;
        const authData = `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&scope=${scope}`;
        
        // 1. Récupération du Token
        const tokenRes = await axios.post('https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire', authData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const token = tokenRes.data.access_token;

        // 2. Appel de l'API avec le nouveau token
        const response = await axios.get('https://api.emploi-store.fr/partenaire/offresemploi/v2/offres/search', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { motsCles: 'iOS', range: '0-9' }
        });

        res.json(response.data);

    } catch (error) {
        // Log plus détaillé pour t'aider dans Render
        console.error("Erreur détaillée:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Erreur France Travail", details: error.response ? error.response.data : null });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
