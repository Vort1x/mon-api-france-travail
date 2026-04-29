const express = require('express');
const axios = require('axios');
const app = express();

app.get('/offres', async (req, res) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID;
        const CLIENT_SECRET = process.env.CLIENT_SECRET;

        // On utilise le scope complet avec le préfixe application
        // Attention : pas d'espace en trop, juste un seul entre les deux scopes
        const scope = `application_${CLIENT_ID} api_offresdemploiv2 o2dso8w`;

        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('scope', scope);

        const tokenRes = await axios.post(
            'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire',
            params.toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const token = tokenRes.data.access_token;

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
