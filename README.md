# 15cross

カタカナ版スライドパズル。`index.html` を開くだけで遊べます(サーバ不要)。

## ファイル構成
- `index.html` / `style.css` / `app.js` … ゲーム本体
- `data/vocab.js` … 許容語(VAL)と出題語(GEN)。**自動生成**
- `data/bank.js` … 問題バンク。**自動生成**
- `tools/build_vocab.py` … JMdict から語彙を増やす
- `tools/gen_puzzles.py` … 出題語から新しい問題を作る

## 語彙を増やす(約6万語を目指す)
1. https://www.edrdg.org/ から `JMdict_e.gz`(英語版でOK)をダウンロードして `tools/` に置く
2. `python3 tools/build_vocab.py tools/JMdict_e.gz`
   - 出題語の広さは `--nf-max`(既定24、小さいほど有名語のみ)で調整。実行後に語数が表示されます
   - 既存の語は消えず、和集合で追加されます(`--replace` で作り直し)
3. `python3 tools/gen_puzzles.py --count 2000 --sec 600`
   - 3=3×3, 4=4×4, 5=5×5(✕), 6=4×4(✕)。時間がかかってもOK
4. `index.html` をブラウザで開いて確認(「≡ → 語彙」で語数も見られます)

## GitHub で公開
```
git init && git add . && git commit -m "15cross"
git branch -M main
git remote add origin https://github.com/<ユーザー名>/15cross.git
git push -u origin main
```
GitHub の Settings → Pages → Branch を `main` / `(root)` にして Save。
数分後に `https://<ユーザー名>.github.io/15cross/` で遊べます。

## ライセンス
語彙は JMdict (© EDRDG, CC BY-SA 4.0) 由来です。公開時は出典表記が必要です:
"This product uses data from JMdict, © the Electronic Dictionary Research and Development Group."
