# Oude Google Drive-koppeling ingetrokken

De browserkoppeling met Apps Script is verwijderd. De gedeelde browserkey,
GET-rapportages en client-side PIN/hashcontrole boden geen betrouwbare beveiliging.
Er bestaat geen compatibiliteitsfallback en geen instellingenpaneel voor storagekeys.

De actuele architectuur is browser → dezelfde HTTPS-origin /api → Cloudflare Worker
→ private D1. Google Identity Services dient voor staff-authenticatie, zonder
browsercredentials voor Sheets/Drive. Docenten beheren hun eigen leerlingregister
en resultaten; de server controleert rollen en recordownership.

Zie [../SECURITY.md](../SECURITY.md) voor het contract en
[../SECURITY_DEPLOYMENT.md](../SECURITY_DEPLOYMENT.md) voor de resterende handelingen,
waaronder archiveren van alle oude Apps Script deployments en rotatie van de key.
De oude Sheet wordt behouden en privé geëxporteerd. Er is geen automatische import
of verwijdering van historische leerlinggegevens.
