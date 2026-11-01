# Geräteausleihe IT-Raum

Eine kleine React-App, die ein Coding-Agent gebaut hat. Für die Übung **Faktencheck**: Den
Bericht des Agenten und den Auftrag bekommt ihr im Unterricht.

## Starten mit Docker (empfohlen)

```bash
git clone https://github.com/berndheidemann/faktencheck-geraeteausleihe.git
cd faktencheck-geraeteausleihe
docker compose up --build
```

Dann im Browser öffnen: <http://localhost:8090>. Beenden mit `Strg`+`C`.

Der erste Start lädt Basis-Images und Pakete herunter und dauert ein paar Minuten. Ist Port 8090
belegt: `APP_PORT=8091 docker compose up --build`, dann <http://localhost:8091>.

## Starten ohne Docker (mit Node 22)

```bash
npm ci
npm run build
npm run preview
```

Die Adresse steht in der Ausgabe (meist <http://localhost:4173>). Für die Übung bitte diesen Weg
nehmen und nicht `npm run dev`.
