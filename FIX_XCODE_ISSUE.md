# 🔧 Fix: Xcode Command Line Tools Required

## The Problem

Python needs Xcode Command Line Tools to compile some packages. The installation is trying to install them automatically, but you need to approve it.

## Solution: Install Xcode Tools

### Step 1: Install Xcode Command Line Tools

**In Terminal, run:**
```bash
xcode-select --install
```

**A dialog will pop up** asking:
> "The xcode-select command requires the command line developer tools. Would you like to install the tools now?"

**Click "Install"** and wait 5-15 minutes for installation.

### Step 2: After Installation

**Restart Terminal**, then verify:
```bash
xcode-select -p
```

Should show: `/Library/Developer/CommandLineTools`

### Step 3: Retry Installation

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
./install-and-start.sh
```

---

## Alternative: Install Without Sudo

If you can't install Xcode tools right now, use the user install script:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
./install-python-deps.sh
```

This installs packages to your user directory (no sudo needed).

---

## Manual Installation Steps

If the dialog doesn't appear, try:

### Option 1: Software Update
```bash
sudo softwareupdate --install "Command Line Tools for Xcode"
```

### Option 2: Download Manually
1. Visit: https://developer.apple.com/download/all/
2. Search: "Command Line Tools for Xcode"
3. Download and install the .dmg file

### Option 3: Use Homebrew Python (if you have Homebrew)
```bash
brew install python3
```

---

## Quick Test

After installing, test:
```bash
python3 --version
python3 -m pip --version
```

Both should work!

---

## Continue Installation

Once Xcode tools are installed:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
./install-and-start.sh
```

---

**The Xcode tools installation is a one-time setup. After this, everything will work smoothly!**





