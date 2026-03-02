# Lecteur Audio Web Components (Part3)

Implémentation d’un lecteur audio en Web Components (vanilla JS) avec Web Audio API.

## Fonctionnalités
- Lecteur principal avec playlist intégrée
- Égaliseur 10 bandes avec presets
- Visualizer (spectrum / waveform)
- Contrôles de lecture (play, pause, next, prev, shuffle, loop)
- Contrôle volume + balance
- Ajout de pistes locales et par URL
- Réorganisation de la playlist par drag & drop
- Mode `layout="fixed"` pour page fixe avec scroll de playlist

## Architecture
- `components/audioplayer.js` : orchestration UI + graphe audio
- `components/myequalizer.js` : traitement EQ 10 bandes
- `components/myvisualizer.js` : rendu canvas temps réel
- `components/playlist.js` : gestion de la playlist
- `css/*.css` : styles par composant

## Graphe audio
`<audio>` → `my-equalizer` → `GainNode` → `StereoPannerNode` → `AnalyserNode` → `destination`

## Pages de démonstration
- `index.html` : player principal (mode `layout="fixed"`)
- `demo-advanced.html` : page de démonstration complète
- `isolated-eq.html` : composant EQ isolé
- `isolated-playlist.html` : composant playlist isolé
- `isolated-visualizer.html` : composant visualizer isolé

## Lancement local
Depuis le dossier `Part3` :

```bash
npx http-server . -p 8000 -c-1
```

Puis ouvrir `http://localhost:8000/index.html`.

## Notes
- En mode `layout="fixed"`, la page reste fixe et la zone playlist gère son propre scroll.
- Le projet est sans framework et fonctionne avec des modules ES natifs.
- Les composants peuvent être testés individuellement via les pages `isolated-*.html`.

## Tests experts validés (OK)

Tests réalisés en console navigateur sur `index.html` :

```js
const player = document.querySelector("my-audio-player");

player.getAudioContext().state
// "running"

player.getGainNode() instanceof GainNode
// true

player.getPannerNode() instanceof StereoPannerNode
// true

player.getAnalyserNode() instanceof AnalyserNode
// true
```

Résultat : graphe audio propre (tous les contrôles `instanceof` sont `true`).

### Test EQ programmatique (OK)

```js
player.shadowRoot.querySelector("#eq").applyPreset("Bass Boost")
```

Résultat : boost immédiat audible.

### Test playlist programmatique (OK)

```js
player.playNext()
```

Résultat : changement de piste correct.

## Conclusion technique

✔ Conforme Web Components W3C  
✔ Conforme Web Audio API  
✔ Architecture modulaire  
✔ API publique propre  
✔ Communication via events  
✔ Accessible (ARIA présent)  
✔ Pas de fuite DOM
