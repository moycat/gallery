# gallery

Gallery of [@moycat](https://github.com/moycat).

Hosted at [https://gallery.moy.cat](https://gallery.moy.cat) via Cloudflare Pages.

## Deployment

GitHub Actions deploys the site only when `master` is pushed. The workflow checks out Git LFS
pointers first, restores `.photos-cache`, downloads only missing or changed photo objects, uploads
originals to S3-compatible storage, builds the static site, and deploys `dist` to Cloudflare Pages.

Required repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `S3_ACCESS_KEY_ID`
- `S3_BUCKET`
- `S3_ENDPOINT`
- `S3_SECRET_ACCESS_KEY`

Required repository variables:

- `S3_PUBLIC_BASE_URL`

Optional repository variables:

- `S3_ORIGINAL_PREFIX`
