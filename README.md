
# Lucid LoFi Space

A modern, aesthetic, and fully responsive web app for focus and relaxation.

## Features

- **Fullscreen Animated Background**: Particle effects sensitive to themes (rain, night, particles).
- **Three Modes**: Study, Sleep, Relax (with distinct themes and audio).
- **Embedded LoFi Player**: Custom glassmorphism controls for YouTube LoFi streams.
- **Draggable Sticky Notes**: Persisted in local storage, draggable anywhere.
- **Minimal Toolbar**: Quick access to notes and mode switching.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    npm install lucide-react clsx tailwind-merge
    ```

2.  **Run Locally**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

3.  **Build for Production**:
    ```bash
    npm run build
    npm start
    ```

## Deployment on Vercel

1.  Push this repository to GitHub.
2.  Import the project in Vercel.
3.  Vercel will automatically detect Next.js.
4.  Click **Deploy**.

## Folder Structure

- `src/app`: Pages and Layout
- `src/components`: UI Components
- `src/hooks`: Custom Hooks (`useTheme`, `useDraggable`)
- `src/providers`: React Context Providers (`ThemeProvider`)
- `src/lib`: Constants and Utilities

## Customization

Edit `src/lib/constants.ts` to change themes, colors, or audio streams.
