# 🔧 Install Xcode Command Line Tools

## Quick Fix

The installation needs Xcode Command Line Tools. Here's how to install them:

### Method 1: Automatic Installation (Recommended)

1. **Open Terminal** (if not already open)
2. Run this command:
   ```bash
   xcode-select --install
   ```
3. **A dialog will appear** asking to install the tools
4. Click **"Install"**
5. Wait for installation to complete (5-15 minutes)
6. **Restart Terminal** after installation

### Method 2: If Dialog Doesn't Appear

If the dialog doesn't show up, try:

```bash
# Try installing via softwareupdate
sudo softwareupdate --install "Command Line Tools for Xcode"

# Or download directly from Apple Developer
# Visit: https://developer.apple.com/download/all/
# Search for "Command Line Tools for Xcode"
```

### Method 3: Manual Download

1. Visit: https://developer.apple.com/download/all/
2. Search for: "Command Line Tools for Xcode"
3. Download the latest version for your macOS
4. Install the .dmg file
5. Restart Terminal

---

## After Installing Xcode Tools

Once installed, verify:

```bash
xcode-select -p
```

Should show something like:
```
/Library/Developer/CommandLineTools
```

Then try the installation again:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH
./install-and-start.sh
```

---

## Alternative: Install Without Sudo (User Install)

If you can't use sudo, we can install Python packages to your user directory:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend

# Install to user directory (no sudo needed)
python3 -m pip install --user -r requirements.txt

# Add to PATH if needed
export PATH="$HOME/Library/Python/3.9/bin:$PATH"
```

---

## Quick Test

After installing Xcode tools, test Python:

```bash
python3 --version
python3 -m pip --version
```

Both should work without errors.

---

**Once Xcode tools are installed, run the installation script again!**





