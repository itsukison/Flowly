'use client'

import { useRef } from 'react'
import { HotTable } from '@handsontable/react-wrapper'
import { registerAllModules } from 'handsontable/registry'
import { HANDSONTABLE_LICENSE_KEY } from '@/lib/handsontable-config'

// Register Handsontable modules
registerAllModules()

/**
 * Test component to verify Handsontable setup
 * This is a minimal component to test if Handsontable works with React 19
 */
export default function HandsontableTest() {
  const hotRef = useRef(null)

  const data = [
    ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
    ['2019', 10, 11, 12, 13],
    ['2020', 20, 11, 14, 13],
    ['2021', 30, 15, 12, 13],
  ]

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Handsontable Test</h2>
      <div className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden p-4">
        <HotTable
          ref={hotRef}
          data={data}
          colHeaders={true}
          rowHeaders={true}
          height="auto"
          licenseKey={HANDSONTABLE_LICENSE_KEY}
          stretchH="all"
        />
      </div>
    </div>
  )
}
