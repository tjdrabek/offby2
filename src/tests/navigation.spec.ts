import { test, expect } from '@playwright/test'

const DESTINATIONS = [
  'Projects',
  'Sheet layouts',
  'Printing setups and calibration',
  'Assets',
  'Settings and backup',
]

test('primary navigation exposes and activates all five stable destinations', async ({
  page,
}) => {
  await page.goto('/')

  const nav = page.getByRole('navigation', { name: 'Primary' })
  await expect(nav).toBeVisible()

  for (const label of DESTINATIONS) {
    await expect(nav.getByRole('link', { name: label })).toBeVisible()
  }

  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Projects' })).toHaveAttribute(
    'aria-current',
    'page',
  )

  for (const label of DESTINATIONS) {
    await nav.getByRole('link', { name: label }).click()
    await expect(page.getByRole('heading', { name: label })).toBeVisible()
    await expect(nav.getByRole('link', { name: label })).toHaveAttribute(
      'aria-current',
      'page',
    )
  }
})
