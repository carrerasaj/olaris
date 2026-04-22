// Internal preview route for the ported order-form variants.
// Will be removed in Phase 2 once /admin/orders/* routes land. Until then,
// this is how Alan can eyeball the Phase 3 port against the original mockup.

import { OrderPreviewClient } from './OrderPreviewClient'

export const metadata = {
  title: 'Order form preview · internal',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <OrderPreviewClient />
}
