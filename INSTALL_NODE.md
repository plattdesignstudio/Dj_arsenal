# Install Node.js and npm

## Problem
Getting `zsh: command not found: npm` - Node.js/npm is not installed.

## Quick Fix

### Option 1: Install via Homebrew (Recommended for macOS)

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js (includes npm)
brew install node

# Verify installation
node --version
npm --version
```

### Option 2: Install via Official Installer

1. **Download Node.js:**
   - Visit: https://nodejs.org/
   - Download the LTS (Long Term Support) version for macOS
   - Choose the `.pkg` installer

2. **Install:**
   - Double-click the downloaded `.pkg` file
   - Follow the installation wizard
   - Complete the installation

3. **Verify:**
   ```bash
   node --version
   npm --version
   ```

### Option 3: Install via nvm (Node Version Manager)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.zshrc

# Install Node.js LTS
nvm install --lts
nvm use --lts

# Verify
node --version
npm --version
```

## After Installation

### 1. Verify Installation
```bash
node --version
npm --version
```

Should show version numbers like:
```
v20.x.x
10.x.x
```

### 2. Install Project Dependencies
```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
npm install
```

### 3. Start Frontend
```bash
npm run dev
```

## Troubleshooting

### Command Still Not Found After Installation

1. **Restart Terminal:**
   - Close and reopen your terminal
   - Or run: `source ~/.zshrc`

2. **Check PATH:**
   ```bash
   echo $PATH
   ```
   Should include Node.js paths

3. **Find Node.js:**
   ```bash
   which node
   which npm
   ```

### Permission Errors

If you get permission errors:
```bash
# Fix npm permissions (if needed)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

## Required Versions

- **Node.js:** 18.x or higher (LTS recommended)
- **npm:** 9.x or higher (comes with Node.js)

## Verify Everything Works

After installation:
```bash
# Check versions
node --version
npm --version

# Install project dependencies
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
npm install

# Start frontend
npm run dev
```

## Quick Reference

**Install Node.js:**
```bash
brew install node
```

**Verify:**
```bash
node --version && npm --version
```

**Install Dependencies:**
```bash
npm install
```

**Start Dev Server:**
```bash
npm run dev
```

