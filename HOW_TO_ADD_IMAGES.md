# Comment Ajouter Vos Images et Vidéos

## 📸 Ajouter des Images

### Étape 1: Placer vos images
1. Copiez vos images dans le dossier `src/assets/`
2. Nommez-les de manière descriptive (ex: `group-photo-1.jpg`, `training-session.jpg`)

### Étape 2: Importer dans AboutSection.tsx
Ouvrez `src/components/home/AboutSection.tsx` et ajoutez vos imports en haut du fichier:

```typescript
import groupPhoto1 from "@/assets/group-photo-1.jpg";
import trainingSession from "@/assets/training-session.jpg";
import competition from "@/assets/competition.jpg";
// ... ajoutez autant d'images que vous voulez
```

### Étape 3: Mettre à jour le tableau aboutImages
Remplacez ou ajoutez vos images dans le tableau `aboutImages`:

```typescript
const aboutImages = [
  {
    src: groupPhoto1, // Votre image importée
    alt: "Description de l'image",
    title: "Titre de l'image",
    description: "Description détaillée",
    type: "image",
  },
  {
    src: trainingSession,
    alt: "Session d'entraînement",
    title: "Entraînement",
    description: "Nos étudiants en action",
    type: "image",
  },
  // ... ajoutez plus d'images
];
```

## 🎥 Ajouter des Vidéos

### Option 1: YouTube
1. Allez sur YouTube et copiez l'URL de votre vidéo
2. Dans `AboutSection.tsx`, ajoutez dans le tableau `videos`:

```typescript
const videos = [
  {
    title: "Titre de votre vidéo",
    description: "Description",
    thumbnail: heroImage, // Image de prévisualisation
    videoUrl: "https://www.youtube.com/watch?v=VOTRE_ID", // URL YouTube
    type: "youtube",
  },
];
```

### Option 2: Vimeo
```typescript
{
  title: "Titre",
  description: "Description",
  thumbnail: heroImage,
  videoUrl: "https://vimeo.com/VOTRE_ID",
  type: "vimeo",
}
```

### Option 3: Vidéo directe
Si vous avez un fichier vidéo, placez-le dans `public/videos/` et utilisez:

```typescript
{
  title: "Titre",
  description: "Description",
  thumbnail: heroImage,
  videoUrl: "/videos/votre-video.mp4",
  type: "direct",
}
```

## 🖼️ Format des Images Recommandé

- **Format**: JPG, PNG, WebP
- **Taille**: 1200px - 2000px de largeur
- **Poids**: Optimisez vos images (utilisez TinyPNG ou similaire)
- **Ratio**: Les images seront recadrées automatiquement

## 📐 Layout des Images

Le layout utilise une grille masonry avec différentes tailles:
- **Grande image**: `col-span-2 row-span-2` (2 colonnes, 2 lignes)
- **Image moyenne**: `col-span-1 row-span-2` (1 colonne, 2 lignes)
- **Petite image**: `col-span-1 row-span-1` (1 colonne, 1 ligne)
- **Image large**: `col-span-2 row-span-1` (2 colonnes, 1 ligne)

## ✅ Vérification

Après avoir ajouté vos images:
1. Redémarrez le serveur de développement
2. Allez sur la page d'accueil
3. Faites défiler jusqu'à la section "À PROPOS DE L'ACADÉMIE"
4. Vos images devraient apparaître dans la galerie

## 🎨 Personnalisation

Vous pouvez modifier:
- Le nombre d'images dans la galerie
- Les titres et descriptions
- L'ordre d'affichage
- Les animations et effets

Tout est dans le fichier `src/components/home/AboutSection.tsx`!

