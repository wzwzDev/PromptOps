/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: [
		'./index.html',
		'./src/**/*.{ts,tsx,js,jsx}',
	],
	theme: {
		extend: {
			colors: {
				brand: {
					50: '#f3f7ff', 100: '#e6efff', 200: '#c6d9ff', 300: '#9fbaff',
					400: '#6e8fff', 500: '#4467ff', 600: '#2d4cf0', 700: '#243dd0',
					800: '#1f34a6', 900: '#1c2d83'
				},
			},
			boxShadow: {
				glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
			},
			backdropBlur: {
				xs: '2px'
			},
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Arial'],
				mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
			}
		}
	},
	plugins: [],
}
