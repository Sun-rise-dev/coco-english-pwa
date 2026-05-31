// Tailwind 配置 — Coco 设计系统 (暖调海滩 + 现代简约)
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主色 — 温暖珊瑚 (Coco 的蜜桃橙)
        coco: {
          50:  '#FFF5F0',
          100: '#FFE8DD',
          200: '#FFD1B8',
          300: '#FFB48A',
          400: '#FF975C',
          500: '#FF7B4A',  // 主色
          600: '#E56238',
          700: '#C44A28',
          800: '#9C341C',
          900: '#7A2212',
        },
        // 辅助色 — 海滩青 (对话气泡 / 强调)
        ocean: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        // 暖沙色 (背景 / 卡片)
        sand: {
          50:  '#FEFCFA',
          100: '#FDF7F2',
          200: '#FAEEE4',
          300: '#F5E0D0',
          400: '#EDCBAD',
          500: '#E0B88F',
        },
        // 表面色 (暗色模式用)
        surface: {
          light: '#FEFAF7',
          dark:  '#1A1816',
        },
      },
      fontFamily: {
        display: ['"Fredoka"', 'system-ui', 'sans-serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 16px -4px rgba(255, 123, 74, 0.12)',
        'soft-lg': '0 4px 24px -6px rgba(255, 123, 74, 0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
