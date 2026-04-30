import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		screens: {
  			'800': {
  				raw: '(height: 800px)'
  			},
  			'900': {
  				raw: '(height: 900px)'
  			},
  			fold1: {
  				min: '279px',
  				max: '300px'
  			},
  			fold: {
  				min: '279px',
  				max: '321px'
  			},
  			zfold: {
  				min: '344px',
  				max: '358px'
  			},
  			s8: {
  				min: '359px',
  				max: '370px'
  			},
  			se: {
  				min: '375px',
  				max: '389px'
  			},
  			pro: {
  				min: '389px',
  				max: '420px'
  			},
  			proMax: {
  				min: '430px',
  				max: '529px'
  			},
  			xr: {
  				min: '414px',
  				max: '420px'
  			},
  			iho: {
  				min: '410px',
  				max: '529px'
  			},
  			surface: {
  				min: '530px',
  				max: '559px'
  			},
  			surface7: {
  				min: '900px',
  				max: '1000px'
  			},
  			surface8: {
  				min: '910px',
  				max: '1130px'
  			},
  			nest: {
  				raw: '(height: 600px)'
  			},
  			ipad: {
  				min: '550px',
  				max: '768px'
  			},
  			ipad2: {
  				min: '530px',
  				max: '738px'
  			},
  			ipadAir: {
  				min: '767px',
  				max: '919px'
  			},
  			tab: {
  				min: '768px',
  				max: '874px'
  			},
  			ipadPro: {
  				min: '1024px',
  				max: '1026px'
  			},
  			nestHub: {
  				min: '1024px',
  				max: '1199px'
  			},
  			nestMax: {
  				min: '1200px',
  				max: '1300px'
  			},
  			surfacePro: {
  				min: '853px',
  				max: '913px'
  			},
  			'2.5xl': {
  				min: '1650px',
  				max: '1800px'
  			},
  			'3xl': '1800px',
  			xs: '320px'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
