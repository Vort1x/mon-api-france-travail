const express = require('express');
const axios = require('axios');
const app = express();

app.get('/offres', async (req, res) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID;
        const CLIENT_SECRET = process.env.CLIENT_SECRET;

        // TEST : On utilise uniquement le scope de l'API sans le préfixe application
        // C'est le format le plus courant pour les accès "Offres d'emploi v2"
        const scope = "api_offresdemploiv2 o2dso8w";
        
        // On construit la chaîne manuellement pour être sûr de l'encodage de l'espace
        const authData = `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&scope=${encodeURIComponent(scope)}`;

        const tokenRes = await axios.post(
            'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire',
            authData,
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
        res.status(500).json({ message: "Erreur Auth", details: errorData });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur sur port ${PORT}`));
