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
2. 右邊選擇全幅單圖、上下雙圖、左右雙圖或純文字。每段語錄各有中文與英文，選擇「中主・英副」、「英主・中副」、「僅中文」、「僅英文」，模式可套用全部頁面。切換模式會保留兩種語言內容。
3. 預覽預設 30%，縮放不影響 1080 × 1350 匯出尺寸。新語錄主、副文字均預設思源黑體，可各自選擇 11 款免費商用中英文字型，調整顏色與粗細。主文字預設 56 px、副文字 34 px，可分別調整；副文字保持比主文字小。
4. 新語錄預設主、副文字各一行，字級與位置完全依設定，不依寬高自動縮字、換行或避讓；可選擇「手動換行（依輸入分行）」再自行分行。超出畫布的內容會裁切，請自行調整構圖。每段可選一般文字、引號語錄或引用框，並填寫作者／講者與來源。可直接在畫布點選語錄、拖曳整組位置，拖曳右下「主」或左下「副」調整各自字級；放開記錄一次修改，Esc 取消拖曳。選取框不會出現在匯出圖片。方向鍵可微調，Shift 加速；右側文字分頁保留位置、字級與對齊設定。亦可編輯背景、照片遮罩與共用署名。
5. 圖片分頁可上傳本機 JPG／PNG／WebP（每張最多 10 MB），輸入 HTTPS 圖片網址，或挑選圖庫圖片。支援縮放與水平／垂直裁切。
6. 「匯出輪播」仍可下載目前頁 PNG 或整組 ZIP；每張均為 1080 × 1350。ZIP 含圖片來源與授權文字檔。使用同一個 Canvas 繪圖流程產生預覽與下載。
7. 頂部「專案」可匯出／載入可編輯 JSON，保存所有頁面、字型、語言、引用樣式、作者來源、裁切設定與本機上傳圖片，專案檔上限 80 MB。原本專案名稱選單與圖片匯出功能仍保留。編輯會自動存到此瀏覽器的 IndexedDB；清除瀏覽器資料會刪除草稿。跨裝置請下載專案備份，圖庫與網址圖片仍需可連線載入。

第 3 版專案格式支援引用樣式、單行選項及更多字型，仍可載入第 1、2 版。舊稿保留原換行選項與既有字型；換行選項現在只依手動輸入分行，所有專案都不再自動縮字或適應寬度；第 1 版以「僅中文」開啟，不會自動替既有文案翻譯。

## 字型與授權

中文字型：思源黑體、思源宋體、霞鶩文楷 TC、芫荽 Iansui、圓體 Huninn。英文字型：Inter、Lora、Playfair Display、Montserrat、DM Sans、Cormorant Garamond。主、副文字可分別選擇；英文字型不包含的中文字會使用思源黑體補字。

各字型均已核對官方 SIL Open Font License，允許商業使用。授權原文保留在 `public/font-licenses/`，字型選單下方可直接查看。字型由 Google Fonts 載入，未修改字型檔；詳見 [字型來源與授權](docs/font-licenses.md)。

## 圖片 API 與授權

- **Wikimedia Commons CC0**：不需 API Key。透過官方 MediaWiki API 搜尋 `CC-Zero` 類別，再核對每張圖的 `LicenseShortName === CC0`，排除標示額外限制的圖片。適合英文關鍵字。
- **Pexels**：選填自己的 API Key，透過 `https://api.pexels.com/v1/search` 搜尋。新 Key 的發放狀況以平台頁面為準。
- **內建精選**：8 張依 [Unsplash 免費授權](https://unsplash.com/license) 使用的示範照片，原始來源記錄在 `src/data.ts`；本機存放讓開啟網站後即可編輯與下載。
- CC0 允許免費修改、散布與商用，參見 [CC0 官方條款](https://creativecommons.org/publicdomain/zero/1.0/)。肖像、隱私、商標等其他權利仍依原平台規定。自訂上傳／網址圖片請自行確認使用權。
- 來源 API：[Commons API](https://commons.wikimedia.org/wiki/Commons:API)、[Pexels API](https://www.pexels.com/api/)。

## OpenRouter AI

1. 在「API 設定」填入自己的 [OpenRouter Key](https://openrouter.ai/settings/keys)。可勾選「加密儲存在此瀏覽器」並按完成，下次自動載入；不勾選則只在本次分頁使用。
2. 按「AI 靈感生成」，從即時讀取的文字模型清單選擇模型，設定 3／5／7／10 頁、字幕顯示模式與提示詞。
3. 透過官方 `/api/v1/chat/completions` 產生每段語錄的繁體中文與英文對照、版型與英文圖片搜尋詞。即使選單語顯示，兩種語言仍會保留。有支援的模型使用 JSON Schema；其他模型以 JSON 提示與嚴格的回傳驗證處理。回傳缺少翻譯時不會覆蓋現有作品。
4. 有 Pexels Key 時使用 Pexels，否則以免 Key 的 Commons CC0 搜尋配圖。搜尋失敗會提示並使用內建授權照片。照片為圖庫照片，並非 AI 繪圖。
5. 生成後先預覽摘要，再按「套用到編輯器」。生成失敗不會覆蓋現有作品；套用後仍可復原及逐頁修改。

選擇本機記憶時，使用 Web Crypto AES-256-GCM 加密、每次隨機 12-byte IV，將密文與不可匯出的 CryptoKey 原子存入獨立 IndexedDB `slow-studio-keys`。不把明文 Key 寫入 localStorage、草稿、專案 JSON 或原始碼。取消勾選並完成設定，或按「清除本機金鑰」，會刪除密文與 CryptoKey。

這是使用者選擇的自動解鎖方案：解密金鑰也在同一瀏覽器，能執行同來源程式碼的程式仍可解密；這不是密碼鎖或硬體金鑰保護。GitHub Pages 同帳號的不同專案通常共用來源。清除瀏覽器資料也會刪除已存 Key。瀏覽器直接把 Key 傳給所選服務，每位使用者應提供自己的 Key；不可把共用服務端 Key 放入前端環境變數。

模型實際費用由使用者的 OpenRouter 帳戶支付，免費模型也可能有額度與頻率限制。AI 內容應在發布前確認，尤其涉及復健衛教時。

官方技術參考：[OpenRouter API](https://openrouter.ai/docs/api/reference/overview)、[模型清單 API](https://openrouter.ai/docs/api/api-reference/models/get-models)。

## 驗證

```sh
npm test
npm run build
```

單元測試涵蓋 AES-GCM 還原、防竄改、不可匯出加密金鑰、AI 雙語輸出、專案升級與引用資料保存、固定字級、手動換行、主副文字排版、畫布座標換算及拖曳字級限制。瀏覽器測試包含畫布移動與縮放、主副字級獨立拖曳、一次復原、取消及觸控操作，亦包含重啟自動解鎖、清除、僅本次使用、11 款字型載入、專案往返及 PNG／ZIP；付費 AI 呼叫未實測。
