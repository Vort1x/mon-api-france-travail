const express = require('express');
const axios = require('axios');
const app = express();

app.get('/offres', async (req, res) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID;
        const CLIENT_SECRET = process.env.CLIENT_SECRET;

        // 1. Authentification - Configuration stricte selon la doc France Travail
        const authUrl = 'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire';
        
        // Utilisation de URLSearchParams pour un encodage parfait
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('scope', 'api_offresdemploiv2 o2dso8w');

        const tokenRes = await axios.post(authUrl, params.toString(), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded' 
            }
        });

        const token = tokenRes.data.access_token;

        // 2. Appel API Offres d'emploi v2
        const response = await axios.get('https://api.emploi-store.fr/partenaire/offresemploi/v2/offres/search', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            params: { 
                range: '0-9' // Paramètre obligatoire pour tester la réponse
            }
        });

        res.json(response.data);

    } catch (error) {
        // Log complet pour voir la réponse de France Travail en cas d'échec
        const errorDetail = error.response ? error.response.data : error.message;
        console.error("Détails de l'erreur:", errorDetail);
        res.status(500).json({ 
            message: "Erreur lors de la communication avec France Travail", 
            details: errorDetail 
        });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
