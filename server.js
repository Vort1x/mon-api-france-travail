const express = require('express');
const axios = require('axios');
const app = express();

app.get('/offres', async (req, res) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID;
        const CLIENT_SECRET = process.env.CLIENT_SECRET;

        // TEST : On envoie les identifiants SANS le paramètre scope
        // France Travail devrait retourner les droits par défaut de ton application
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        // On ne met PAS params.append('scope', ...) ici

        const tokenRes = await axios.post(
            'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire',
            params.toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const token = tokenRes.data.access_token;

        // Appel de l'API
        const response = await axios.get(
            'https://api.emploi-store.fr/partenaire/offresemploi/v2/offres/search',
            {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { range: '0-9' }
            }
        );

        res.json(response.data);

    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        console.error("Détails:", errorData);
        res.status(500).json({ message: "Erreur Auth", details: errorData });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur sur port ${PORT}`));
