const express = require('express');
const axios = require('axios');
const app = express();

// Tes identifiants France Travail (à garder secrets !)
const CLIENT_ID = "PAR_studentevent_0fb9b30330edb0b9837684fc1609b79135f634d9a7d99488888560e77066f531";
const CLIENT_SECRET = "77bab34551cbf12894733ac789460989dc27cc3e2dab38008467718353047926";

app.get('/offres', async (req, res) => {
    try {
        // 1. Demander le token à France Travail (Le POST que tu voulais éviter en Swift)
        const authData = `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&scope=api_offresdemploiv2 o2dso8w`;
        
        const tokenRes = await axios.post('https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire', authData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const token = tokenRes.data.access_token;

        // 2. Récupérer les offres (Le GET avec le token tout frais)
        const response = await axios.get('https://api.emploi-store.fr/partenaire/offresemploi/v2/offres/search', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { motsCles: req.query.motsCles || 'iOS' }
        });

        // 3. Renvoyer les résultats à ton iPhone
        res.json(response.data);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur lors de la communication avec France Travail" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));