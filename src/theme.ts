export const theme = {
  colors: {
    background: '#000000',
    surface: '#111111',
    primary: '#00ff00',
    secondary: '#ff00ff',
    accent: '#00ffff',
    warning: '#ff6600',
    text: {
      primary: '#00ff00',
      secondary: '#cccccc',
      accent: '#ffffff'
    }
  },
  effects: {
    glow: (color: string) => `0 0 10px ${color}44, 0 0 20px ${color}22, 0 0 30px ${color}11`,
    scanlines: `
      linear-gradient(
        to bottom,
        transparent 50%,
        rgba(0, 255, 0, 0.02) 50%
      )
    `,
    noise: `
      repeating-radial-gradient(
        rgba(0, 255, 0, 0.03) 100px,
        transparent 100px,
        transparent 200px
      )
    `
  },
  fonts: {
    mono: "'Space Mono', monospace",
    display: "'Share Tech Mono', monospace"
  }
}; 