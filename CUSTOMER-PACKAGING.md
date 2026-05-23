# Customer Packaging

Use this workflow to create a separate branded desktop QR generator for each customer.

## 1. Make a Customer Config

Copy `customers.example.json` to a new file, such as:

```powershell
Copy-Item customers.example.json customers.acme.json
```

Edit the values:

```json
{
  "appName": "Acme QR",
  "customerName": "Acme Company",
  "logoSource": "C:\\Path\\To\\customer-logo.png",
  "logoShortName": "ACME",
  "defaultFileName": "acme-qr",
  "tagline": "Branded QR codes for Acme Company.",
  "sampleUrl": "https://acme.com"
}
```

## 2. Build the Customer App

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-win.ps1 -Config customers.acme.json
```

The app will be created in:

```text
dist\Acme QR-win32-x64\Acme QR.exe
```

## 3. Deliver the Folder

Send the whole generated folder to the customer, not just the `.exe`.

Example:

```text
dist\Acme QR-win32-x64
```

That folder contains the executable, Electron runtime files, the customer logo, and the local QR engine.

## Notes

- No customer login is required in this version.
- QR generation runs locally on the customer's machine.
- Uploaded logos inside the app are local to that customer machine.
- For best scanning, keep logo size under 20% and use high error correction.
