# Next Step: Install librosa

## Good News
Your pip is up to date! Now install librosa.

## Install librosa

Run this command:

```bash
pip3 install librosa soundfile
```

This will install:
- `librosa` - Audio analysis library
- `soundfile` - Audio file I/O library (required by librosa)

## After Installation

Once librosa is installed, restart your backend:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## If Installation Takes a While

librosa has several dependencies (numpy, scipy, etc.) so installation might take a few minutes. This is normal!

## Alternative: Install All Requirements

If you want to install all dependencies at once:

```bash
cd /Users/PlattDESiGN/Desktop/DJ_BOOTH/backend
pip3 install -r requirements.txt
```

This will install librosa along with all other backend dependencies.

## Expected Output

You should see something like:
```
Collecting librosa
  Downloading librosa-0.10.2-py3-none-any.whl (...
...
Successfully installed librosa-0.10.2 soundfile-0.12.1 ...
```

