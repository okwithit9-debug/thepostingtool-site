# thepostingtool-site

Source for [thepostingtool.com](https://thepostingtool.com), the website for **The Posting Tool**, a free, open-source, self-hosted tool that posts your videos to X, Threads, TikTok, Pinterest, YouTube, and Instagram from your own machine.

- The Posting Tool: https://github.com/okwithit9-debug/the-posting-tool
- Sara AI: https://github.com/okwithit9-debug/sara-ai
- Open Source Clipper: https://github.com/okwithit9-debug/open-source-clipper
- All projects in one place: https://github.com/okwithit9-debug/open-source

## Run locally

Requires Node 18+. No dependencies.

```sh
npm start        # or: node server.js
# open http://localhost:3000
```

`server.js` serves `/` from `index.html`, `/<name>` from `<name>.html`, 301-redirects `/<name>.html` to `/<name>`, and returns `404.html` for anything else.

## Contributing

Issues and pull requests are welcome.

## License

[MIT](LICENSE)
