# XTP tour frontend

Xtp tour frontend is a applications for tennis player to find and one time or regular hitting partner.

## Features

### Public Event Sharing
Users can share their tennis events via unique URLs that can be posted on social networks and messengers. Each public event has a unique link in the format `/event/{eventId}` that allows anyone to view the event details and join if they're signed in.

**Key features:**
- Unique shareable URLs for each public event
- **Anonymous viewing**: Anyone can view shared events without signing in
- Click-to-copy share functionality with toast notifications
- Social media sharing to Facebook, Twitter, WhatsApp, and Telegram
- Responsive design that works on mobile and desktop
- Support for both signed-in and anonymous users viewing events
- Easy navigation back to the main events list

**How to use:**
1. Create a public event in the app
2. Click the share button (📤) on any public event in the list
3. The event URL will be copied to your clipboard
4. Share the URL with friends via social media, messaging apps, etc.
5. **Anyone with the link can view the event details** - no sign-in required
6. To join the event, users need to sign in to the app

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
