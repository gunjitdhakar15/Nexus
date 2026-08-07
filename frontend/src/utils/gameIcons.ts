export const getGameIcon = (title: string): string => {
  const icons: Record<string, string> = {
    'Valorant': 'fa-crosshairs',
    'Elden Ring': 'fa-sword',
    'World of Warcraft': 'fa-dragon',
    'Destiny 2': 'fa-rocket',
    'Counter-Strike': 'fa-gun',
    'League of Legends': 'fa-crown',
    'Subway Surf': 'fa-train',
    'Red Dead Redemption': 'fa-horse-head',
    'Uncharted': 'fa-map',
    'FIFA': 'fa-futbol',
    'Dishonored': 'fa-mask',
  }
  return icons[title] || 'fa-gamepad'
}
