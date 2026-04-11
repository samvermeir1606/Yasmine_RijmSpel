Rijmwoordenspel met thema-mappen.

Structuur:
- topics/index.js
- topics/ei/center - ei.png
- topics/ei/center - ei.mp3
- topics/ei/aardbei - true.png
- topics/ei/aardbei - true.mp3
- topics/ei/nest - false.png
- topics/ei/nest - false.mp3

Naamregels:
- Elke map onder topics/ is 1 thema.
- Het midden gebruikt altijd: center - WOORD.png en center - WOORD.mp3
- De kaartjes gebruiken altijd: WOORD - true.png/.mp3 of WOORD - false.png/.mp3
- true betekent: dit woord rijmt op het midden
- false betekent: dit woord rijmt niet op het midden

Belangrijk:
- Voeg een nieuw thema toe in een eigen map.
- Voeg daarna het thema-object ook toe aan topics/index.js.
- De browser kan niet zelf alle lokale mappen uitlezen, daarom blijft index.js nodig.
- Voor een volledige spelronde voorzie je best minstens 5 `true` kaartjes en 3 `false` kaartjes.

Instructie-audio voor spel 1:
- Zet de basiszin hier: assets/audio/instructions/rijm-base.mp3
- Die opname mag alleen bevatten: "Zoek woorden die rijmen op"
- Daarna speelt het spel automatisch het `center - WOORD.mp3` bestand van het actieve thema af.
