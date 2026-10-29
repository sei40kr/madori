# Madori

ブラウザで間取り図を描くエディタ。部屋・ドア・窓・仕切り・柱・家具を配置して寸法を編集でき、面積を ㎡ と畳で表示する。

https://madori.yong-ju.me

## 機能

- 部屋をドラッグで作成し、角をドラッグしてサイズを変える。寸法はグリッドに吸着する。
- ドアと窓は部屋の辺や仕切りに吸着し、部屋を動かすと一緒に動く。ドアは開き戸・引き戸・折れ戸を選べる。
- 柱は部屋の角に吸着する。家具は冷蔵庫やベッドなどの種類と一般的なサイズから選べる。
- 選択中の要素の幅・奥行・長さをパネルからメートル単位で入力できる。
- 延床面積と部屋ごとの面積を ㎡ と畳 (1 畳 = 1.62 ㎡) で表示する。
- PNG と PDF (ブラウザの印刷ダイアログ経由) で書き出せる。
- 編集内容はブラウザの localStorage に自動保存される。サーバーには何も送らない。

## 開発

Nix の devshell に Bun と Node.js が入っている。direnv を使っていれば `cd` するだけで有効になる。

```sh
nix develop      # direnv を使わない場合
bun install
bun dev          # http://localhost:3000
```

| コマンド | 内容 |
| --- | --- |
| `bun run build` | 静的サイトとして `out/` に書き出す (`output: "export"`) |
| `bun run check` | Biome で lint とフォーマットを検査する |
| `bun run format` | Biome でフォーマットする |

主なディレクトリ:

- `src/components/` — エディタの UI。`canvas.tsx` がキャンバス上のマウス・タッチ・キーボード操作を扱う。
- `src/lib/` — 間取りの状態と操作 (`plan-store.ts`、zustand)、幾何計算、書き出し、型。
- `terraform/` — ホスティング用のインフラ定義。詳細は [terraform/README.md](terraform/README.md)。

## デプロイ

`main` に push すると GitHub Actions (`.github/workflows/deploy.yml`) がビルドし、S3 に sync して CloudFront のキャッシュを無効化する。
