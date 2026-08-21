/** Tailwind build config — quét class trong HTML + JS để xuất CSS tĩnh (thay CDN) */
module.exports = {
  content: ['./*.html', './assets/js/*.js'],
  theme: {
    extend: {
      colors: { primary: '#3563E9', accent: '#54A6FF', ink: '#1A202C', muted: '#90A3BF' },
      fontFamily: { sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'] }
    }
  }
};
