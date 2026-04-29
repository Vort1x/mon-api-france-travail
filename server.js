const express = require('express');
const axios = require('axios');
const app = express();

app.get('/offres', async (req, res) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID;
        const CLIENT_SECRET = process.env.CLIENT_SECRET;

        // ÉTAPE 1 : RÉCUPÉRER LE TOKEN
        // On utilise exactement les scopes affichés dans ton interface partenaire
        const scope = "api_offresdemploiv2 o2dso8w";
        
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

        // ÉTAPE 2 : RÉCUPÉRER LES OFFRES
        const response = await axios.get(
            'https://api.emploi-store.fr/partenaire/offresemploi/v2/offres/search',
            {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { range: '0-9' } // On commence simple sans motsCles pour tester
            }
        );

        res.json(response.data);

    } catch (error) {
        // On affiche l'erreur complète pour comprendre si c'est le scope ou autre chose
        const errorData = error.response ? error.response.data : error.message;
        console.error("Erreur détaillée:", errorData);
        res.status(500).json({ message: "Erreur Auth", details: errorData });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur Live sur ${PORT}`));
