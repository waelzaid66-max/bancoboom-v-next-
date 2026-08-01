# PASTE — وكيل اللابتوب · N2 Android + iOS

```bash
git fetch origin && git checkout main && git pull --ff-only
node scripts/chain-integrity-gate.mjs   # متوقع 34/34
node --test artifacts/banco-mobile/tests/lib-hardening.test.mjs \
  artifacts/banco-mobile/tests/section-miniapp-guard.test.mjs \
  artifacts/banco-mobile/tests/mobile-resilience.test.mjs
```

**اقرأ:** `audit/N2-PLATFORM-IOS-ANDROID-HYGIENE-2026-07-21-AR.md`

## نفّذ على ASB Android + جهاز/محاكي iOS
1. Map Locate me: grant OK · deny → Alert  
2. Keyboard Android فوق الشات  
3. Cover + Chat: rationale قبل OS  
4. كل ميني‑آب: عزل + شرائط المالك  
5. Push ASB (ليس Expo Go)

**ممنوع:** تغيير Stay/Cars · SECTION_ROUTE · auto-FI · FlashList دون قياس جَنْك

**رد:** `SYNC_SHA` · `GATE=34/34` · `ANDROID=…` · `IOS=…` · `LOCATE=pass|fail`
