import { motion } from 'framer-motion';
import { Sun, Moon, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, ColorScheme, colorSchemeOptions } from '@/hooks/useTheme';

const colorPreviewClasses: Record<ColorScheme, string> = {
  green: 'bg-[hsl(120,100%,50%)]',
  blue: 'bg-[hsl(200,100%,50%)]',
  purple: 'bg-[hsl(270,100%,50%)]',
  orange: 'bg-[hsl(25,100%,50%)]',
};

const ThemeToggle = () => {
  const { colorScheme, themeMode, setColorScheme, setThemeMode } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
          <Palette className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border-border">
        <DropdownMenuLabel className="font-mono text-xs text-muted-foreground">
          THEME MODE
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => setThemeMode('dark')}
          className={`cursor-pointer ${themeMode === 'dark' ? 'bg-primary/20 text-primary' : ''}`}
        >
          <Moon className="w-4 h-4 mr-2" />
          <span className="font-mono text-sm">Dark</span>
          {themeMode === 'dark' && (
            <motion.div
              className="ml-auto w-2 h-2 rounded-full bg-primary"
              layoutId="theme-indicator"
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setThemeMode('vibrant')}
          className={`cursor-pointer ${themeMode === 'vibrant' ? 'bg-primary/20 text-primary' : ''}`}
        >
          <Sun className="w-4 h-4 mr-2" />
          <span className="font-mono text-sm">Vibrant</span>
          {themeMode === 'vibrant' && (
            <motion.div
              className="ml-auto w-2 h-2 rounded-full bg-primary"
              layoutId="theme-indicator"
            />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuLabel className="font-mono text-xs text-muted-foreground">
          COLOR SCHEME
        </DropdownMenuLabel>
        {(Object.keys(colorSchemeOptions) as ColorScheme[]).map((scheme) => (
          <DropdownMenuItem
            key={scheme}
            onClick={() => setColorScheme(scheme)}
            className={`cursor-pointer ${colorScheme === scheme ? 'bg-primary/20' : ''}`}
          >
            <div className={`w-4 h-4 rounded-full mr-2 ${colorPreviewClasses[scheme]}`} />
            <span className="font-mono text-sm">{colorSchemeOptions[scheme].name}</span>
            {colorScheme === scheme && (
              <motion.div
                className="ml-auto w-2 h-2 rounded-full bg-primary"
                layoutId="color-indicator"
              />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
