#!/bin/bash

# Get GitHub username
echo "What is your GitHub username?"
read USERNAME

# Configuration
REPO_URL="https://github.com/$USERNAME/drone-companion-pwa.git"
BRANCH="gh-pages"

# Build the app
echo "Building the app..."
npm run build-no-check

# Navigate to the dist folder
cd dist

# Create a .nojekyll file to prevent GitHub Pages from ignoring files that begin with an underscore
touch .nojekyll

# Initialize a new git repository
git init
git add -A
git commit -m "Deploy to GitHub Pages"

# Force push to the gh-pages branch of your repository
echo "Deploying to GitHub Pages..."
git push -f $REPO_URL master:$BRANCH

cd -

echo "Deployment complete! Your app should be available at https://$USERNAME.github.io/drone-companion-pwa/" 