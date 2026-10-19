# DUBAI PIZZA SHOP POS — WINDOWS 10 / 11 DESKTOP APPLICATION GUIDE

## 1. Overview
**DUBAI PIZZA SHOP POS** is a dedicated offline restaurant Point of Sale (POS) application built for Windows 10 and Windows 11 (64-bit). It functions completely offline with local data persistence, thermal receipt printing, kitchen order ticket (KOT) generation, table floor management, and credit/Udhaar ledger.

- **Shop Name:** DUBAI PIZZA SHOP
- **Location:** Sian, Jhal
- **Contact Numbers:** 0342-2562389, 0347-2762389
- **Currency:** Pakistani Rupees (Rs.)

---

## 2. Launching on Windows Desktop

### Method A: One-Click Desktop Launcher (.bat)
1. Double-click `Start_DubaiPizzaShopPOS.bat` in the project directory.
2. The launcher boots the local server and opens the application in fullscreen window mode.
3. No internet connection required.

### Method B: Building the Windows Installer (`DubaiPizzaShopPOS_Setup.exe`)
Using the included Electron and `electron-builder` configuration:
```bash
# 1. Install dependencies
npm install

# 2. Build the production application
npm run build

# 3. Generate DubaiPizzaShopPOS_Setup.exe and Portable Build
npx electron-builder --win nsis
```
- The installer executable `DubaiPizzaShopPOS_Setup.exe` will be located in `dist-electron/`.
- Runs on Windows 10 & 11 (64-bit).
- Generates Desktop and Start Menu shortcuts.
- Stores user data safely in `%APPDATA%\com.dubaipizzashop.pos` so application updates never erase business records.

---

## 3. Keyboard Shortcuts for Rapid Billing
- **F1:** Open Billing POS screen
- **F2:** Open Orders Management
- **F3:** Open Table Floor Management
- **F4:** Open Kitchen KOT Screen
- **Escape:** Close open dialog or preview modal

---

## 4. Thermal Printer Setup (80mm & 55mm)
1. Connect thermal receipt printer (e.g. Xprinter XP-80, EPSON TM-T88, POS-80) via USB.
2. In Windows **Settings > Printers & Scanners**, select your receipt printer and set default paper size to `80mm x Receipt` (or `58mm x Receipt` for 55mm compact paper).
3. In app **Settings > Receipt Paper Width**, choose `80mm` or `55mm`.
4. The system prints high-contrast thermal bills with shop logo, item breakdown, customer details, and payment status without extra margins.

---

## 5. Complete 41 Menu Items & 26 Deals
- **13 Pizzas:** Special Dubai, Chicken Tikka, Fajita, Hot & Spicy, Tandoori, Mughlai, Malai Boti, Kebab Crust, Creamy, Cheese Lover, Achari, BBQ, Super Suprim (with Small 7", Medium 10", Large 14" exact prices).
- **6 Burgers:** Zinger Burger (Rs. 280), Chicken Burger (Rs. 270), Beef Peti (Rs. 340), Tikka Burger (Rs. 270), Tower Burger (Rs. 499), Sub Burger (Rs. 250).
- **Prathas, Shawarmas, Nuggets, Wings, Fries, Cold Drinks, Extras.**
- **All 26 Deals:** Pre-configured with exact items and quantities.
- **Deal 18 Price Confirmation:** Deal 18 has its original Rs. 0 price flagged. Authorized users can confirm and set the price in Deals Management before selling.
