🎯 SOLUTION LA PLUS RAPIDE : Webpage card

ÉTAPE 1 : Configurer Trusted Networks
Édite /config/configuration.yaml et ajoute au tout début (ou dans la section homeassistant: si elle existe déjà) :

text
homeassistant:
  auth_providers:
    - type: homeassistant
    - type: trusted_networks
      trusted_networks:
        - 192.168.3.0/24
        - 127.0.0.1
      allow_bypass_login: true
⚠️ Important :

Si tu as déjà une section homeassistant:, ne la duplique pas, ajoute seulement auth_providers: dedans

Adapte 192.168.3.0/24 à ton réseau (vu que ton HA est sur 192.168.3.160, c'est bon)

ÉTAPE 2 : Vérifier la configuration
bash
ha core check
Si tout est OK :

bash
ha core restart



Modifier le tableau de bord (bouton en haut à droite)

+ Ajouter une carte

Cherche "Webpage" ou tape webpage dans la recherche

Dans le champ URL, colle :

text
/local/community/home_suivi_elec_ui/index.html
Terminé !

Tu peux ajouter un lien dans la sidebar via un bookmark dans Lovelace :

Va dans Paramètres → Tableaux de bord

Clique sur Aperçu (ton dashboard principal)

Clique sur les 3 points en haut à droite → Modifier le tableau de bord

Ajoute une carte Webpage :

text
type: iframe
url: /local/community/home_suivi_elec_ui/index.html
aspect_ratio: 100%
Ou plus simple, ajoute un badge/lien dans ta config :

text
# configuration.yaml
panel_custom:
  - name: home_suivi_elec_link
    url_path: home-suivi-elec
    sidebar_title: 'Home Suivi Élec'
    sidebar_icon: mdi:lightning-bolt
    module_url: /local/home_suivi_elec_redirect.js
Et crée /config/www/home_suivi_elec_redirect.js :

javascript
window.location.href = '/local/community/home_suivi_elec_ui/index.html';

