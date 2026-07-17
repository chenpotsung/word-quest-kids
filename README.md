# Word Quest Kids

給國小三年級前小朋友使用的英文單字闖關遊戲。

## GitHub Pages 網址

部署完成後，網站會在：

https://chenpotsung.github.io/word-quest-kids/

## 第一次啟用 GitHub Pages

1. 進入這個 repository 的 `Settings`。
2. 左側點選 `Pages`。
3. 在 `Build and deployment` 的 `Source` 選擇 `GitHub Actions`。
4. 回到 `Actions`，等待 `Deploy Word Quest Kids to GitHub Pages` 變成綠色勾勾。

`.github/workflows/deploy-pages.yml` 會在每次更新 `main` 後自動建置與發布網站。

## 本機使用

```bash
npm install
npm run dev
```

## 建置靜態網站

```bash
npm run build:pages
```

靜態檔案會輸出到 `out` 資料夾。
