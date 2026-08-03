import { chromium } from '@playwright/test'

async function capture(sceneIndex) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

  page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message))

  await page.goto('http://localhost:5191/', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(3000)

  for (let i = 1; i < sceneIndex; i++) {
    await page.locator('button:has-text("Siguiente")').click({ force: true })
    await page.waitForTimeout(2500)
  }

  await page.screenshot({ path: `scripts/theme-scene-${sceneIndex}.png` })
  await browser.close()
  console.log(`Captured scene ${sceneIndex}`)
}

const index = parseInt(process.argv[2] || '1', 10)
capture(index).catch((err) => {
  console.error(err)
  process.exit(1)
})
