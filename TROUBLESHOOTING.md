# 🔧 Dépannage - Section "À Propos"

## ✅ Vérifications à faire

### 1. Vérifier que le serveur de développement tourne
```bash
npm run dev
```
Le serveur devrait démarrer sur `http://localhost:5173` (ou un autre port)

### 2. Vérifier que la section est visible
- Allez sur la page d'accueil
- Faites défiler après la section Hero (grande image en haut)
- La section "À PROPOS DE L'ACADÉMIE" devrait apparaître

### 3. Vérifier la navigation
- Cliquez sur "À Propos" dans le menu de navigation
- La page devrait scroller automatiquement vers la section

### 4. Vérifier les images
- Ouvrez la console du navigateur (F12)
- Vérifiez s'il y a des erreurs 404 pour les images
- Les images devraient se charger depuis `/assets/`

## 🐛 Problèmes courants et solutions

### Problème: La section n'apparaît pas
**Solution:**
1. Vérifiez que `AboutSection` est importé dans `src/pages/Index.tsx`
2. Vérifiez qu'il n'y a pas d'erreurs dans la console
3. Redémarrez le serveur de développement

### Problème: Les images ne se chargent pas
**Solution:**
1. Vérifiez que les fichiers images existent dans `src/assets/`
2. Vérifiez les imports dans `AboutSection.tsx`
3. Les noms de fichiers doivent correspondre exactement

### Problème: Le lien "À Propos" ne fonctionne pas
**Solution:**
1. Vérifiez que l'ID `a-propos` est présent sur la section
2. Vérifiez la console pour les erreurs JavaScript
3. Essayez de faire défiler manuellement vers la section

### Problème: La section est cachée ou invisible
**Solution:**
1. Vérifiez que `isVisible` devient `true` (dans les DevTools React)
2. Vérifiez les styles CSS - peut-être un problème de z-index
3. Vérifiez que `bg-background` est défini dans votre thème

## 🔍 Debugging

### Ouvrir la console du navigateur
1. Appuyez sur `F12` ou `Ctrl+Shift+I`
2. Allez dans l'onglet "Console"
3. Cherchez les erreurs en rouge

### Vérifier les composants React
1. Installez l'extension React DevTools
2. Inspectez le composant `AboutSection`
3. Vérifiez l'état `isVisible`

### Vérifier les imports
Dans `src/components/home/AboutSection.tsx`, vérifiez que tous les imports sont corrects:
```typescript
import img1 from "@/assets/IMG-20260126-WA0016.jpg";
// etc...
```

## 📝 Checklist de vérification

- [ ] Le serveur de développement tourne
- [ ] Pas d'erreurs dans la console
- [ ] Les images existent dans `src/assets/`
- [ ] `AboutSection` est importé dans `Index.tsx`
- [ ] Le lien "À Propos" est dans le menu
- [ ] L'ID `a-propos` est sur la section
- [ ] Les styles CSS sont chargés

## 🚀 Test rapide

1. Ouvrez `http://localhost:5173`
2. Faites défiler vers le bas
3. Vous devriez voir:
   - Titre "À PROPOS DE L'ACADÉMIE"
   - Galerie d'images (5 images en layout masonry)
   - Section "Galerie Photos" (8 images)
   - Section "Nos Valeurs" (4 cartes)
   - Section "Call to Action"

Si vous voyez tout cela, la section fonctionne! ✅

## 💡 Si rien ne fonctionne

1. **Redémarrez le serveur:**
   ```bash
   # Arrêtez avec Ctrl+C
   npm run dev
   ```

2. **Nettoyez le cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

3. **Vérifiez les dépendances:**
   ```bash
   npm install
   ```

4. **Vérifiez la version de Node:**
   ```bash
   node --version
   # Devrait être >= 18
   ```

