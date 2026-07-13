import { Logger } from './logger/logger.js'
import { Storage } from "./core/storage.js"
import { Loader } from "./core/loader.js"
import { NotificationsManager } from "./managers/notifications-manager.js"
import { ThemeManager } from "./managers/theme-manager.js"
import { TypewriterManager } from "./managers/typewriter-manager.js"
import { LinksManager } from "./managers/links-manager.js"

const logger = new Logger()

let storage, loader, notificationsManager, themeManager, typewriterManager, linksManager

const createStep = (name, fn) => async () => {
  logger.createGroup(name)
  
  try {
    logger.info(`${name}...`)
    
    await fn()
    
    logger.endGroupWithSuccess(`${name} complete`)
  } catch (e) {
    logger.endGroupWithError(name, e)
    throw e
  }
}

// Core setup
const setupStorage = createStep('Storage', async () => {
  storage = new Storage({ logger })
  await storage.setup()
})

const setupLoader = createStep('Loader', async () => {
  loader = new Loader({ logger })
  await loader.setup()
})

// Managers setup
const setupNotificationsManager = createStep('Notification manager setup', async () => {
  notificationsManager = new NotificationsManager({ logger, storage, loader })
  await notificationsManager.setup()
})

const setupThemeManager = createStep('Theme manager setup', async () => {
  themeManager = new ThemeManager({ logger, storage, loader })
  await themeManager.setup()
})

const setupTypewriterManager = createStep('Typewriter manager setup', async () => {
  typewriterManager = new TypewriterManager({ logger, storage, loader })
  await typewriterManager.setup()
})

const setupLinksManager = createStep('Links manager setup', async () => {
  linksManager = new LinksManager({ logger, storage, loader })
  await linksManager.setup()
})

// Managers init
const initNotificationsManager = createStep('Notifications manager init', async () => await notificationsManager.init())
const initThemeManager = createStep('Theme manager init', async () => await themeManager.init())
const initTypewriterManager = createStep('Typewriter manager init', async () => await typewriterManager.init())
const initLinksManager = createStep('Links manager init', async () => await linksManager.init())

// Steps
const setupCore = createStep('Core setup', async () => {
  await setupStorage()
  await setupLoader()
})

const setupManagers = createStep('Managers setup', async () => {
  await setupNotificationsManager()
  await setupThemeManager()
  await setupTypewriterManager()
  await setupLinksManager()
})

const onAppReady = createStep('App ready callbacks', async () => {
  await initNotificationsManager()
  await initThemeManager()
  await initTypewriterManager()
  await initLinksManager()
})

async function init() {
  logger.createGroup("App init")
  
  try {
    logger.info("App init...")
    
    await setupCore()
    await setupManagers()
    await onAppReady()

    Object.assign(window, { logger, storage, loader, notificationsManager, themeManager, typewriterManager }) // debug

    logger.endGroupWithSuccess("App init complete")
  } catch (e) {
    logger.endGroupWithError('App init', e)
  }
}

document.addEventListener('DOMContentLoaded', init)
