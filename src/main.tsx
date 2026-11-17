import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import Desktop from './desktop/Desktop.tsx'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource/ibm-plex-mono/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-ext-700.css'
import './styles.css'
import './network/network.css'
import './desktop/desktop.css'
import './junior/junior.css'
import './detective/detective.css'

createRoot(document.getElementById('root')!).render(
  <MotionConfig reducedMotion="user">
    <Desktop />
  </MotionConfig>,
)
