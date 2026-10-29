# terraform

`https://madori.yong-ju.me` で静的サイトとして madori をホストするためのインフラ定義。

## 構成

- **S3** — ビルド成果物を配置する。Static Website Hosting を有効化し、バケットポリシーは CloudFront だけが知っているシークレット値と一致する `Referer` ヘッダーが付いたリクエストに対してのみ `s3:GetObject` を許可する。S3 への直アクセスは拒否される。
- **CloudFront** — バケットを前段で受け、オリジンリクエストごとにシークレットの `Referer` ヘッダーを付与し (`custom_header` ブロック)、HTTPS を強制し、403/404 時は `404.html` を返す。
- **ACM** — `madori.yong-ju.me` 用の TLS 証明書を `us-east-1` で発行し、既存の `yong-ju.me` Route 53 ゾーンに DNS レコードを追加して検証する。
- **Route 53** — サブドメインを CloudFront に向ける A/AAAA エイリアスレコード。
- **IAM** — `sei40kr/madori` リポジトリの workflow が引き受けるデプロイ用ロール。バケットへの sync と CloudFront の invalidation に必要な権限のみを持ち、長期 AWS キーは使わない。

## 前提

- AWS の認証情報がローカルで設定済みであること (`aws configure` もしくは環境変数)。
- 同じアカウント内に `yong-ju.me` の Route 53 ホストゾーンが既に存在すること。
- 同じアカウント内に GitHub Actions 用の OIDC プロバイダが既に存在すること。
- Terraform >= 1.10 (S3 backend のネイティブロック `use_lockfile = true` を使うため)。

## state 用 S3 バケットのブートストラップ

`backend.tf` は state を `madori.yong-ju.me-tfstate` バケットに保存する設定になっている。chicken-and-egg を避けるため、このバケットだけは Terraform 管理外で先に作成する。

```sh
aws s3api create-bucket \
  --bucket madori.yong-ju.me-tfstate \
  --region ap-northeast-1 \
  --create-bucket-configuration LocationConstraint=ap-northeast-1

aws s3api put-bucket-versioning \
  --bucket madori.yong-ju.me-tfstate \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket madori.yong-ju.me-tfstate \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": { "SSEAlgorithm": "AES256" },
      "BucketKeyEnabled": true
    }]
  }'

aws s3api put-public-access-block \
  --bucket madori.yong-ju.me-tfstate \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

ロックは S3 のネイティブロック (`use_lockfile = true`) を使うので DynamoDB テーブルは不要。

## 初回セットアップ

```sh
cd terraform
terraform init
terraform apply
```

apply 後、出力を GitHub リポジトリの Secrets に登録する。`gh` CLI から直接流し込める。

```sh
gh secret set AWS_DEPLOY_ROLE_ARN --body "$(terraform output -raw github_deploy_role_arn)"
gh secret set CLOUDFRONT_DISTRIBUTION_ID --body "$(terraform output -raw cloudfront_distribution_id)"
```

(別リポジトリで実行する場合は `--repo sei40kr/madori` を付ける)

これで `.github/workflows/deploy.yml` が `main` への push のたびに Bun でビルドし、`./out` を S3 に sync して CloudFront キャッシュを invalidate するようになる。

## 補足

- CloudFront ディストリビューションは初回 apply で 5〜15 分かかる。以降の apply は速い。
- CloudFront 用の ACM 証明書は `us-east-1` に置く必要があり、本構成では `aws.us_east_1` の alias provider で対応している。
- GitHub の OIDC プロバイダ (`token.actions.githubusercontent.com`) はアカウントに 1 つしか作れないため、ここでは作成せず既存のものを data source で参照する。アカウントにまだ無い場合は先に作成しておくこと。
