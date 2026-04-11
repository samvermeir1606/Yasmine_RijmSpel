Minigame 2 gebruikt nu een paar-structuur met bestandsnamen die tonen wat bij elkaar hoort.

Structuur:
- pairs/index.js
- pairs/schaap - aap.png
- pairs/schaap - aap.mp3
- pairs/aap - schaap.png
- pairs/aap - schaap.mp3

Naamregels:
- Elk kaartje krijgt de naam: WOORD - PARTNER
- Voor elk rijmpaar maak je dus 2 kaartjes:
- `schaap - aap`
- `aap - schaap`
- Het spel leest uit de bestandsnaam welk woord bij welk ander woord hoort.

Belangrijk:
- Voeg nieuwe kaartjes ook toe aan `pairs/index.js`
- Afbeeldingen mogen `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` of `.svg` zijn
- Audio gebruikt momenteel `.mp3`
- Spel 2 toont nu 6 paren per ronde
- Het memory-spel gebruikt dezelfde bronlijst, maar blijft 3 paren tonen
