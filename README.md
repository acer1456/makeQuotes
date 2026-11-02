# 慢慢 studio

繁體中文 IG 輪播製作工具，以附件的上下拼圖、深色照片與白色襯線字為靈感。純前端 React + Vite + TypeScript，無須資料庫或伺服器。

## 啟動

```sh
npm install
npm run dev
```

開啟終端機列出的網址（預設 http://127.0.0.1:5173）。正式版：`npm run build`，將 `dist/` 放上靜態網站服務即可。

## GitHub Pages

網站網址：https://acer1456.github.io/makeQuotes/

推送到 `main` 後，GitHub Actions 會執行測試、建置並發布 `dist/`。Repository 的 Settings → Pages 使用 GitHub Actions 作為來源。

Pages 建置使用 `npm run build -- --base=/makeQuotes/`，同時調整靜態圖片路徑。本機開發與一般靜態部署仍使用根路徑；專案檔內的圖片網址維持相同格式，可跨部署匯入。

## 使用

1. 左邊選頁面；可新增、複製、刪除、前後移動，最多 20 頁，支援復原／重做。
2. 右邊選擇全幅單圖、上下雙圖、左右雙圖或純文字。編輯兩段文字、字型、字級、顏色、對齊、位置、背景、照片遮罩與共用署名。
3. 圖片分頁可上傳本機 JPG／PNG／WebP（每張最多 10 MB），輸入 HTTPS 圖片網址，或挑選圖庫圖片。支援縮放與水平／垂直裁切。
4. 「匯出輪播」下載目前頁 PNG 或整組 ZIP；每張均為 1080 × 1350。ZIP 含圖片來源與授權文字檔。使用同一個 Canvas 繪圖流程產生預覽與下載。
5. 專案名稱旁的選單可下載／開啟專案 JSON。編輯會自動存到此瀏覽器的 IndexedDB；清除瀏覽器資料會刪除草稿。跨裝置請下載專案檔備份。

## 圖片 API 與授權

- **Wikimedia Commons CC0**：不需 API Key。透過官方 MediaWiki API 搜尋 `CC-Zero` 類別，再核對每張圖的 `LicenseShortName === CC0`，排除標示額外限制的圖片。適合英文關鍵字。
- **Pexels**：選填自己的 API Key，透過 `https://api.pexels.com/v1/search` 搜尋。新 Key 的發放狀況以平台頁面為準。
- **內建精選**：8 張依 [Unsplash 免費授權](https://unsplash.com/license) 使用的示範照片，原始來源記錄在 `src/data.ts`；本機存放讓開啟網站後即可編輯與下載。
- CC0 允許免費修改、散布與商用，參見 [CC0 官方條款](https://creativecommons.org/publicdomain/zero/1.0/)。肖像、隱私、商標等其他權利仍依原平台規定。自訂上傳／網址圖片請自行確認使用權。
- 來源 API：[Commons API](https://commons.wikimedia.org/wiki/Commons:API)、[Pexels API](https://www.pexels.com/api/)。

## OpenRouter AI

1. 在「API 設定」填入自己的 [OpenRouter Key](https://openrouter.ai/settings/keys)。
2. 按「AI 靈感生成」，從即時讀取的文字模型清單選擇模型，設定 3／5／7／10 頁與提示詞。
3. 透過官方 `/api/v1/chat/completions` 產生繁體中文文案、版型與英文圖片搜尋詞。有支援的模型使用 JSON Schema；其他模型以 JSON 提示與嚴格的回傳驗證處理。
4. 有 Pexels Key 時使用 Pexels，否則以免 Key 的 Commons CC0 搜尋配圖。搜尋失敗會提示並使用內建授權照片。照片為圖庫照片，並非 AI 繪圖。
5. 生成後先預覽摘要，再按「套用到編輯器」。生成失敗不會覆蓋現有作品；套用後仍可復原及逐頁修改。

金鑰只存在目前分頁的 React 記憶體；不存入 IndexedDB、localStorage 或匯出的 JSON，重新整理後會清除。瀏覽器直接把 Key 傳給所選服務，因此這是每位使用者提供自己 Key 的工具；若需共用服務端 Key，應另建後端代理，不能把 Key 放入前端環境變數。

模型實際費用由使用者的 OpenRouter 帳戶支付，免費模型也可能有額度與頻率限制。AI 內容應在發布前確認，尤其涉及復健衛教時。

官方技術參考：[OpenRouter API](https://openrouter.ai/docs/api/reference/overview)、[模型清單 API](https://openrouter.ai/docs/api/api-reference/models/get-models)。

## 驗證

```sh
npm test
npm run build
```

單元測試涵蓋 AI 輸出格式與頁數、專案匯入安全檢查及版型尺寸。瀏覽器測試的實際範圍與尚未使用真人 API Key 的限制，請以交付說明為準。
