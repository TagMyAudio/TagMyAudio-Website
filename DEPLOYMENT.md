# Infomaniak deployment and GitHub release synchronization

This website runs on ordinary Apache hosting. Node.js and PHP execution are not required.

## Release information

The `Refresh GitHub release data` GitHub Actions workflow runs every five minutes (at minutes 2, 7, 12, and so on through 57 of each hour), or manually through **Actions > Refresh GitHub release data > Run workflow**. GitHub may delay scheduled runs. Scheduled workflows may be disabled by GitHub after prolonged repository inactivity; monitor the Actions page.

The workflow reads the application's release designated **Latest**. It accepts only a stable version with all seven expected distribution/source/build assets, a SHA-256 digest for each, and `SHA256SUMS.txt`. Keep the naming convention used in 1.8.6. Upload all files before publishing the release. Incomplete releases fail validation and leave the previous snapshot untouched. Automatic downgrades are rejected.

`release-data.json` is committed only when its values change. The website fetches this public file directly from the website repository. GitHub API credentials are never exposed to visitors. No Infomaniak upload is needed for release/count updates. Static hosting and GitHub caching can add a delay.

The two download counters count **application asset downloads for the displayed version**: arm64 + Intel for macOS; Setup + Portable for Windows. They include downloads via the website and directly via GitHub. They exclude sources, build kits, checksum files, other versions and GitHub-generated source archives. These are download events, not unique users or verified installations. The snapshot date is displayed in the visitor's selected language.

If the live snapshot is unavailable, the bundled `release-data.json` is used. If both fail, the reviewed HTML links and hashes remain usable and counters remain unknown (a dash). Guides and translated release history retain their real documented version; they are not relabelled as a new release. Update those documents when their contents change.

## First upload

In the Manager, confirm the dedicated site directory for **tagmyaudio.net** and HTTPS. Upload only `index.html`, `app.js`, `release-sync.js`, `release-data.json`, `assets/` and `guides/` to that directory. Do not upload the containing repository directory itself. Preserve LUFScale's directory. Check whether a default index.php takes precedence over index.html and remove only the default placeholder if necessary.

## Automatic website deployment

The `Deploy website to Infomaniak` workflow is prepared but disabled until configured. It uploads only public site files and never deletes existing remote files. It requires SSH/rsync access to the dedicated TagMyAudio directory.

Create GitHub repository variables under **Settings > Secrets and variables > Actions**:

- `INFOMANIAK_HOST`: the SSH server hostname from Infomaniak.
- `INFOMANIAK_USER`: the SSH user.
- `INFOMANIAK_PORT`: the SSH port (default 22).
- `INFOMANIAK_PATH`: the verified absolute site directory ending in `/tagmyaudio.net`.
- `INFOMANIAK_DEPLOY_ENABLED`: set to `true` only after the above and the secrets below are configured.

Create repository secrets (never put them in source files or chat):

- `INFOMANIAK_SSH_KEY`: a dedicated deployment private key whose public key has been authorized on the hosting account.
- `INFOMANIAK_KNOWN_HOSTS`: the SSH host key entry, verified against Infomaniak's trusted information. Host-key checking is mandatory.

Run the deployment manually once and verify the domain, HTTPS, language selection, guides and all download links. Thereafter pushes to `main` that change public site content deploy automatically. Release snapshot changes are read directly from GitHub and do not trigger deployment.

No hosting credentials are currently configured by this source change. Creating the Infomaniak site alone does not activate deployment.
