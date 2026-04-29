const express = require('express');
const axios = require('axios');
const app = express();

app.get('/offres', async (req, res) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID;
        const CLIENT_SECRET = process.env.CLIENT_SECRET;

        // ÉTAPE 1 : Authentification
        // On utilise l'URL sans le paramètre realm pour éviter le ECONNREFUSED
        const authUrl = 'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token';
        
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('scope', 'api_offresdemploiv2 o2dso8w');

        const tokenRes = await axios.post(authUrl, params.toString(), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Host': 'entreprise.pole-emploi.fr'
            },
            params: { realm: '/partenaire' } // On passe le realm en paramètre d'URL séparé
        });

        const token = tokenRes.data.access_token;

        // ÉTAPE 2 : Recherche
        const response = await axios.get('https://api.emploi-store.fr/partenaire/offresemploi/v2/offres/search', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { range: '0-9' }
        });

        res.json(response.data);

    } catch (error) {
        console.error("Erreur:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            message: "Erreur Auth", 
            details: error.response ? error.response.data : error.message 
        });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur prêt sur port ${PORT}`));
