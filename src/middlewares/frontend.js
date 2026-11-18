'use strict';
const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const helmet = require('helmet');

module.exports = function frontend(directory) {
  const router = express.Router();
  const index = path.join(directory, 'index.html');
  if (!fs.existsSync(index)) return router;
  const policy = helmet.contentSecurityPolicy({ directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"], scriptSrcAttr: ["'none'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
    connectSrc: ["'self'"], objectSrc: ["'none'"],
    frameAncestors: ["'none'"], baseUri: ["'self'"],
    // Permite também a verificação local por HTTP; o proxy da AWS força HTTPS.
    upgradeInsecureRequests: null,
  } });
  router.use('/assets', policy, express.static(path.join(directory, 'assets'), {
    immutable: true, maxAge: '1y', fallthrough: true, index: false, dotfiles: 'deny',
  }));
  router.get(['/', '/index.html'], policy, (_req, res) => {
    res.set('Cache-Control', 'no-store').sendFile(index);
  });
  return router;
};
